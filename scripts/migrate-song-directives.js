
import fs from "node:fs";
import path from "node:path";

const binderDir = "binder";
const write = process.argv.includes("--write");

const sectionMap = new Map([
  ["analysis", { type: "analysis" }],
  ["translator's notes", { type: "notes", title: "Translator's notes" }],
  ["notes", { type: "notes", title: "Notes" }],
  ["versions", { type: "commentary", title: "Versions" }],
  ["findings", { type: "findings", title: "Findings" }],
  [
    "findings of fact and conclusions of law",
    { type: "findings", title: "Findings of fact and conclusions of law" },
  ],
  [
    "findings of fact andconclusions of law",
    { type: "findings", title: "Findings of fact and conclusions of law" },
  ],
  ["photo", { type: "photo", title: "Photo" }],
  ["photo credit", { type: "photo", title: "Photo credit" }],
  ["photo credits", { type: "photo", title: "Photo credits" }],
  [
    "intralinear subtext",
    { type: "commentary", title: "Intralinear subtext" },
  ],
]);

function normalizeHeading(value) {
  return value.trim().replace(/:\s*$/, "").toLowerCase();
}

function directiveOpen(config) {
  return config.title
    ? `:::${config.type}{title=${JSON.stringify(config.title)}}`
    : `:::${config.type}`;
}

function migrate(markdown) {
  const match = markdown.match(
    /^(---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n)([\s\S]*)$/,
  );

  if (!match) throw new Error("Missing frontmatter");

  const [, frontmatter, body] = match;

  if (/^:::concordance\b/m.test(body)) {
    return { skipped: true, reason: "Already migrated" };
  }

  const lines = body.split(/\r?\n/);
  const sections = [];
  let current = null;

  function flush() {
    if (current) sections.push(current);
  }

  for (const line of lines) {
    const heading = line.match(/^# (.+?)\s*$/);

    if (heading) {
      flush();
      current = {
        heading: heading[1],
        lines: [],
      };
    } else {
      if (!current) {
        if (line.trim()) {
          throw new Error("Content before first section heading");
        }
      } else {
        current.lines.push(line);
      }
    }
  }

  flush();

  const sourceIndex = sections.findIndex(
    (section) => normalizeHeading(section.heading) === "source",
  );

  const targetIndex = sections.findIndex(
    (section) => normalizeHeading(section.heading) === "target",
  );

  if (sourceIndex === -1 || targetIndex === -1) {
    throw new Error("Missing Source or Target section");
  }

  if (targetIndex !== sourceIndex + 1) {
    throw new Error("Source and Target are not adjacent");
  }

  if (sourceIndex !== 0) {
    throw new Error("Source is not the first section");
  }

  const output = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const heading = normalizeHeading(section.heading);

    if (heading === "source") {
      const target = sections[++i];

      output.push(
        ":::concordance",
        "",
        "## Source",
        "",
        section.lines.join("\n").trim(),
        "",
        "## Target",
        "",
        target.lines.join("\n").trim(),
        "",
        ":::",
      );

      continue;
    }

    const config = sectionMap.get(heading);

    if (!config) {
      throw new Error(`Unknown section: ${section.heading}`);
    }

    output.push(
      directiveOpen(config),
      "",
      section.lines.join("\n").trim(),
      "",
      ":::",
    );
  }

  return {
    skipped: false,
    content: frontmatter + "\n" + output.join("\n\n") + "\n",
  };
}

const sectionDirs = fs
  .readdirSync(binderDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const songPaths = sectionDirs.flatMap((section) =>
  fs
    .readdirSync(path.join(binderDir, section))
    .filter((name) => /^\d{2}-.*\.md$/.test(name))
    .sort()
    .map((name) => path.join(binderDir, section, name)),
);

let migrated = 0;
let skipped = 0;
let failed = 0;

for (const file of songPaths) {
  try {
    const original = fs.readFileSync(file, "utf8");
    const result = migrate(original);

    if (result.skipped) {
      skipped++;
      console.log(`SKIP  ${file}: ${result.reason}`);
      continue;
    }

    if (write) fs.writeFileSync(file, result.content, "utf8");

    migrated++;
    console.log(`${write ? "WRITE" : "READY"} ${file}`);
  } catch (error) {
    failed++;
    console.error(`ERROR ${file}: ${error.message}`);
  }
}

console.log(
  `\n${write ? "Migrated" : "Ready"}: ${migrated}, Skipped: ${skipped}, Errors: ${failed}`,
);

if (failed) process.exitCode = 1;
