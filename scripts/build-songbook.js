import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

import { parseSong } from "../src/utils/parseSong.js";
import { renderSongLatex } from "../src/utils/renderSongLatex.js";

const binderDir = "binder";
const outputDir = "dist-print";
const outputPath = path.join(outputDir, "songbook.tex");

// -----------------------------------------------------------------------------
// Discover songs
// -----------------------------------------------------------------------------

const sectionDirs = fs
  .readdirSync(binderDir, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      /^\d{2}-/.test(entry.name),
  )
  .map((entry) => entry.name)
  .sort();

const songPaths = sectionDirs.flatMap((section) => {
  const sectionPath = path.join(binderDir, section);

  return fs
    .readdirSync(sectionPath)
    .filter(
      (filename) =>
        filename.endsWith(".md") &&
        /^\d{2}-/.test(filename),
    )
    .sort()
    .map((filename) =>
      path.join(sectionPath, filename),
    );
});

console.log(`Found ${songPaths.length} songs.`);

// -----------------------------------------------------------------------------
// Parse songs
// -----------------------------------------------------------------------------

function loadSong(inputPath) {
  const markdown = fs.readFileSync(inputPath, "utf8");

  const frontmatterMatch = markdown.match(
    /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/,
  );

  if (!frontmatterMatch) {
    throw new Error(
      `Missing or invalid frontmatter: ${inputPath}`,
    );
  }

  const metadata = yaml.load(frontmatterMatch[1]);
  const body = frontmatterMatch[2];

  const { source, target, remainder } =
    parseSong(body);

  const pairs = source.map(
    (sourceStanza, index) => ({
      source: sourceStanza,
      target: target[index] ?? null,
    }),
  );

  return {
    title: metadata.title,
    authority: metadata.authority,
    videoSource: metadata.videoSource,
    pairs,
    remainder,
  };
}

const songs = songPaths.map(loadSong);

// -----------------------------------------------------------------------------
// Render songbook
// -----------------------------------------------------------------------------

const renderedSongs = songs
  .map(renderSongLatex)
  .join("\n\n\\clearpage\n\n");

const tex = `\\documentclass[11pt,letterpaper]{article}

\\usepackage[margin=0.8in]{geometry}
\\usepackage{fontspec}
\\usepackage{latex/styles/concordance}

\\setmainfont{Nimbus Roman}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}

\\begin{document}

${renderedSongs}

\\end{document}
`;

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, tex, "utf8");

console.log(`Wrote ${outputPath}`);