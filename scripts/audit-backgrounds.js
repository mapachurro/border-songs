// This script is a sanity-checker. It prints out which background images are being used in which song files, etc.
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

const root = process.cwd();
const binderDir = path.join(root, "binder");
const publicDir = path.join(root, "public");

function findMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return findMarkdownFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith(".md")
        ? [fullPath]
        : [];
    })
    .sort();
}

function getFrontmatter(content) {
  // Frontmatter must begin at the very start of the file.
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) return {};

  return yaml.load(match[1]) ?? {};
}

const withBackground = [];
const withoutBackground = [];
const missingFiles = [];
const imageUsage = new Map();

for (const file of findMarkdownFiles(binderDir)) {
  const page = path.relative(binderDir, file);
  const content = fs.readFileSync(file, "utf8");
  const frontmatter = getFrontmatter(content);
  const background = frontmatter.background;

  if (typeof background !== "string" || !background.trim()) {
    withoutBackground.push(page);
    continue;
  }

  const imagePath = background.replace(/^\/+/, "");
  const filename = path.basename(imagePath);

  withBackground.push({ page, background, filename });

  if (!imageUsage.has(imagePath)) {
    imageUsage.set(imagePath, []);
  }

  imageUsage.get(imagePath).push(page);

  if (!fs.existsSync(path.join(publicDir, imagePath))) {
    missingFiles.push({ page, background });
  }
}

console.log("\n=== PAGES WITH BACKGROUNDS ===\n");

for (const { page, filename } of withBackground) {
  console.log(`${page}\n  → ${filename}`);
}

console.log("\n=== DUPLICATE BACKGROUNDS ===\n");

const duplicates = [...imageUsage.entries()]
  .filter(([, pages]) => pages.length > 1);

if (duplicates.length === 0) {
  console.log("None!");
} else {
  for (const [image, pages] of duplicates) {
    console.log(image);
    for (const page of pages) {
      console.log(`  → ${page}`);
    }
  }
}

console.log("\n=== PAGES WITHOUT BACKGROUNDS ===\n");

for (const page of withoutBackground) {
  console.log(`  ${page}`);
}

console.log("\n=== MISSING IMAGE FILES ===\n");

if (missingFiles.length === 0) {
  console.log("None!");
} else {
  for (const { page, background } of missingFiles) {
    console.log(`${page}\n  → ${background}`);
  }
}

console.log("\n=== SUMMARY ===\n");
console.log(`Pages scanned:          ${withBackground.length + withoutBackground.length}`);
console.log(`With backgrounds:       ${withBackground.length}`);
console.log(`Without backgrounds:    ${withoutBackground.length}`);
console.log(`Unique images used:     ${imageUsage.size}`);
console.log(`Duplicate image groups: ${duplicates.length}`);
console.log(`Missing image files:    ${missingFiles.length}`);
