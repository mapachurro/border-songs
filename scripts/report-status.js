import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

import { parseDocument } from "../src/utils/parseDocument.js";

const REPORT_FILE = "reports/editorial-status.md";

const BINDER = "binder";

const EDITORIAL_TYPES = [
  "analysis",
  "commentary",
  "notes",
  "footnotes",
  "findings",
  "photo",
];

const SECTION_PATTERN = /^\d{2}-/;
const SONG_PATTERN = /^\d{2}-.*\.md$/;

function discoverSongs() {
  const files = [];

  for (const section of fs.readdirSync(BINDER).sort()) {
    const sectionPath = path.join(BINDER, section);

    if (
      !SECTION_PATTERN.test(section) ||
      !fs.statSync(sectionPath).isDirectory()
    ) {
      continue;
    }

    for (const filename of fs.readdirSync(sectionPath).sort()) {
      if (!SONG_PATTERN.test(filename)) continue;

      files.push(path.join(sectionPath, filename));
    }
  }

  return files;
}

function readSong(filename) {
  const raw = fs.readFileSync(filename, "utf8");

  const match = raw.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
  );

  if (!match) {
    throw new Error("Missing or invalid YAML frontmatter");
  }

  const metadata = yaml.load(match[1]);
  const blocks = parseDocument(match[2]);

  return {
    title: metadata.title ?? path.basename(filename, ".md"),
    blocks,
    raw,
  };
}

function hasContent(block) {
  if (block.type === "markdown") {
    return block.content.trim().length > 0;
  }

  if (block.type === "concordance") {
    return [...block.source, ...block.target].some(
      (stanza) => stanza.trim().length > 0
    );
  }

  if (block.blocks) {
    return block.blocks.some(hasContent);
  }

  return false;
}

function translationStatus(blocks) {
  const concordance = blocks[0];

  if (!concordance || concordance.type !== "concordance") {
    return "ERROR";
  }

  const source = concordance.source;
  const target = concordance.target;

  if (target.length === 0 || target.every((s) => !s.trim())) {
    return "missing";
  }

  if (
    source.length !== target.length ||
    target.some((s) => !s.trim())
  ) {
    return "partial";
  }

  return "complete";
}

function editorialStatus(blocks, type) {
  const matches = blocks.filter((block) => block.type === type);

  if (matches.length === 0) return "absent";

  return matches.some(hasContent) ? "written" : "empty";
}

function findTodos(raw, filename, title) {
  return raw
    .split(/\r?\n/)
    .flatMap((line, index) =>
      line.includes("TODO")
        ? [{
            title,
            filename,
            line: index + 1,
            text: line.trim(),
          }]
        : []
    );
}

function printTable(headers, rows) {
  const widths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...rows.map((row) => String(row[index]).length)
    )
  );

  const format = (row) =>
    row.map((cell, i) => String(cell).padEnd(widths[i])).join("  ");

  console.log(format(headers));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    console.log(format(row));
  }
}

const output = [];
const originalLog = console.log;

console.log = (...args) => {
  output.push(args.map(String).join(" "));
  originalLog(...args);
};

const files = discoverSongs();
const songs = [];
const errors = [];
const todos = [];

for (const filename of files) {
  try {
    const song = readSong(filename);

    songs.push({
      filename,
      title: song.title,
      translation: translationStatus(song.blocks),
      editorial: Object.fromEntries(
        EDITORIAL_TYPES.map((type) => [
          type,
          editorialStatus(song.blocks, type),
        ])
      ),
    });

    todos.push(...findTodos(song.raw, filename, song.title));
  } catch (error) {
    errors.push({ filename, message: error.message });

    // Still collect TODOs from files that fail parsing.
    const raw = fs.readFileSync(filename, "utf8");
    todos.push(
      ...findTodos(raw, filename, path.basename(filename, ".md"))
    );
  }
}

console.log("\nBORDER SONGS | EDITORIAL STATUS");
console.log("================================\n");

console.log(`Songs discovered: ${files.length}`);
console.log(`Songs parsed:     ${songs.length}`);
console.log(`Parse errors:     ${errors.length}`);
console.log(`TODOs found:      ${todos.length}`);

console.log("\nTRANSLATIONS\n");

for (const status of ["complete", "partial", "missing", "ERROR"]) {
  const count = songs.filter(
    (song) => song.translation === status
  ).length;

  console.log(`${status.padEnd(10)} ${count}`);
}

console.log("\nEDITORIAL COVERAGE\n");

printTable(
  ["Type", "Written", "Empty", "Absent"],
  EDITORIAL_TYPES.map((type) => [
    type,
    songs.filter((s) => s.editorial[type] === "written").length,
    songs.filter((s) => s.editorial[type] === "empty").length,
    songs.filter((s) => s.editorial[type] === "absent").length,
  ])
);

console.log("\nSONG-BY-SONG STATUS\n");

const symbols = {
  written: "✓",
  empty: "○",
  absent: "·",
};

printTable(
  ["Song", "Translation", ...EDITORIAL_TYPES],
  songs.map((song) => [
    song.title,
    song.translation,
    ...EDITORIAL_TYPES.map(
      (type) => symbols[song.editorial[type]]
    ),
  ])
);

console.log("\nLegend: ✓ written, ○ empty, · absent");

console.log("\nTODO INVENTORY\n");

if (todos.length === 0) {
  console.log("No TODOs found.");
} else {
  for (const todo of todos) {
    console.log(`${todo.title}`);
    console.log(`  ${todo.filename}:${todo.line}`);
    console.log(`  ${todo.text}\n`);
  }
}

if (errors.length > 0) {
  console.log("\nPARSE ERRORS\n");

  for (const error of errors) {
    console.log(`${error.filename}`);
    console.log(`  ${error.message}\n`);
  }
}

console.log = originalLog;

fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });

fs.writeFileSync(
  REPORT_FILE,
  [
    "# Border Songs: Editorial Status",
    "",
    "```text",
    ...output,
    "```",
    "",
  ].join("\n"),
  "utf8"
);

console.log(`\nReport saved to ${REPORT_FILE}`);