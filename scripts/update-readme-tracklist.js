import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

const binderDir = "binder";
const readmePath = "README.md";

const START = "<!-- BEGIN FULL TRACKLIST -->";
const END = "<!-- END FULL TRACKLIST -->";

function readFrontmatter(filePath) {
  const markdown = fs.readFileSync(filePath, "utf8");

  const match = markdown.match(
    /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/,
  );

  if (!match) {
    throw new Error(`Missing frontmatter: ${filePath}`);
  }

  return yaml.load(match[1]);
}

function sectionTitle(directory) {
  return directory
    .replace(/^\d{2}-/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateTracklist() {
  const sections = fs
    .readdirSync(binderDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const output = [];

  for (const section of sections) {
    const sectionPath = path.join(binderDir, section);

    const songs = fs
      .readdirSync(sectionPath)
      .filter((name) => /^\d{2}-.*\.md$/.test(name))
      .sort();

    const title = sectionTitle(section);

    output.push(
      `<details>`,
      `<summary><strong>${title}</strong></summary>`,
      "",
    );

    for (const filename of songs) {
      const filePath = path.join(sectionPath, filename);
      const metadata = readFrontmatter(filePath);

      if (!metadata.title) {
        throw new Error(`Missing title: ${filePath}`);
      }

      const number = filename.slice(0, 2);
      const authority = metadata.authority
        ? ` - ${metadata.authority}`
        : "";

      output.push(
  `${number} - [${metadata.title}](./${filePath})${authority}<br>`,
);
    }

    output.push("", "</details>", "");
  }

  return output.join("\n").trim();
}

function updateReadme() {
  const readme = fs.readFileSync(readmePath, "utf8");

  const startIndex = readme.indexOf(START);
  const endIndex = readme.indexOf(END);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Tracklist markers not found in README.md");
  }

  if (endIndex <= startIndex) {
    throw new Error("Tracklist markers are out of order");
  }

  const before = readme.slice(0, startIndex + START.length);
  const after = readme.slice(endIndex);

  const updated =
    before + "\n\n" + generateTracklist() + "\n\n" + after;

  if (updated === readme) {
    console.log("README tracklist is already up to date.");
    return;
  }

  fs.writeFileSync(readmePath, updated, "utf8");
  console.log("Updated README tracklist.");
}

updateReadme();