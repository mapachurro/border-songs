import fs from "fs/promises";
import path from "path";

const binderDir = path.resolve("binder");
const shouldWrite = process.argv.includes("--write");

function yamlString(value) {
  // JSON string syntax is valid YAML and saves us from having to
  // hand-roll escaping for quotes, colons, etc.
  return JSON.stringify(value);
}

function migrateMarkdown(markdown, filePath) {
  // Don't touch files we've already migrated.
  if (markdown.startsWith("---\n")) {
    return {
      status: "skip",
      reason: "already has frontmatter",
    };
  }

  const lines = markdown.split("\n");

  const metadata = {
    title: null,
    authority: null,
    videoSource: null,
  };

  const bodyLines = [];

  for (const line of lines) {
    if (line.startsWith("# Title:")) {
      metadata.title = line.slice("# Title:".length).trim();
      continue;
    }

    if (line.startsWith("# Authority:")) {
      metadata.authority = line.slice("# Authority:".length).trim();
      continue;
    }

    if (line.startsWith("# Video source:")) {
      metadata.videoSource = line.slice("# Video source:".length).trim();
      continue;
    }

    bodyLines.push(line);
  }

  // Title really is required for this migration.
  if (!metadata.title) {
    throw new Error(`Missing "# Title:" in ${filePath}`);
  }

  const frontmatter = ["---", `title: ${yamlString(metadata.title)}`];

  // Authority is allowed to be absent/empty.
  if (metadata.authority) {
    frontmatter.push(`authority: ${yamlString(metadata.authority)}`);
  }

  // Video is also optional.
  if (metadata.videoSource) {
    frontmatter.push(`videoSource: ${yamlString(metadata.videoSource)}`);
  }

  frontmatter.push("---", "");

  // Remove blank lines left at the beginning by extracting metadata.
  while (bodyLines[0] === "") {
    bodyLines.shift();
  }

  return {
    status: "migrate",
    metadata,
    output: [...frontmatter, ...bodyLines].join("\n"),
  };
}

async function getSongFiles() {
  const entries = await fs.readdir(binderDir, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!/^\d{2}-/.test(entry.name)) continue;

    const sectionDir = path.join(binderDir, entry.name);
    const sectionEntries = await fs.readdir(sectionDir, {
      withFileTypes: true,
    });

    for (const file of sectionEntries) {
      if (!file.isFile()) continue;
      if (!/^\d{2}-.*\.md$/.test(file.name)) continue;

      files.push(path.join(sectionDir, file.name));
    }
  }

  return files.sort();
}

async function main() {
  const files = await getSongFiles();

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(
    shouldWrite
      ? `WRITE MODE: inspecting ${files.length} song files\n`
      : `DRY RUN: inspecting ${files.length} song files\n`,
  );

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);

    try {
      const markdown = await fs.readFile(filePath, "utf8");
      const result = migrateMarkdown(markdown, relativePath);

      if (result.status === "skip") {
        console.log(`SKIP     ${relativePath} (${result.reason})`);
        skipped++;
        continue;
      }

      console.log(`MIGRATE  ${relativePath}`);
      console.log(`         title:     ${result.metadata.title}`);
      console.log(
        `         authority: ${result.metadata.authority || "(none)"}`,
      );
      console.log(
        `         video:     ${result.metadata.videoSource || "(none)"}`,
      );

      if (shouldWrite) {
        await fs.writeFile(filePath, result.output, "utf8");
      }

      migrated++;
    } catch (error) {
      console.error(`ERROR    ${relativePath}`);
      console.error(`         ${error.message}`);
      errors++;
    }
  }

  console.log("\nSummary");
  console.log(`  found:    ${files.length}`);
  console.log(`  migrate:  ${migrated}`);
  console.log(`  skipped:  ${skipped}`);
  console.log(`  errors:   ${errors}`);

  if (!shouldWrite) {
    console.log("\nDry run only. No files were changed.");
    console.log("Run again with --write to perform the migration.");
  }

  if (errors > 0) {
    process.exitCode = 1;
  }
}

main();
