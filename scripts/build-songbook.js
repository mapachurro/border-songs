import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

import { parseDocument } from "../src/utils/parseDocument.js";
import { renderSongLatex } from "../src/utils/renderSongLatex.js";
import { renderStandaloneLatex } from "../src/utils/renderStandaloneLatex.js";

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

  const blocks = parseDocument(body);

if (blocks[0]?.type !== "concordance") {
  throw new Error(
    `Missing principal concordance: ${inputPath}`,
  );
}

  return {
  title: metadata.title,
  authority: metadata.authority,
  videoSource: metadata.videoSource,
  background: metadata.background,
  blocks,
};
}
const songs = songPaths.map(loadSong);

// -----------------------------------------------------------------------------
// Load standalone back matter
// -----------------------------------------------------------------------------

function loadStandalonePage(inputPath) {
  const markdown = fs.readFileSync(inputPath, "utf8");

  const frontmatterMatch = markdown.match(
    /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/,
  );

  if (!frontmatterMatch) {
    throw new Error(
      `Missing or invalid frontmatter: ${inputPath}`,
    );
  }

  const metadata = yaml.load(frontmatterMatch[1]) ?? {};
  const body = frontmatterMatch[2];

  // The first level-one heading supplies the standalone page title.
  const headingMatch = body.match(/^# (.+)$/m);

  if (!headingMatch) {
    throw new Error(
      `Missing page title heading: ${inputPath}`,
    );
  }

  const title = headingMatch[1].trim();

  // Remove the title heading so it isn't rendered twice.
  const content = body.replace(/^# .+$(?:\r?\n)?/m, "").trim();

  return {
    title,
    background: metadata.background ?? null,
    body: content,
  };
}

const worksCited = loadStandalonePage(
  path.join(binderDir, "works-cited.md"),
);

const furtherReading = loadStandalonePage(
  path.join(binderDir, "further-reading.md"),
);

// -----------------------------------------------------------------------------
// Render songbook
// -----------------------------------------------------------------------------

const renderedDocument = [
  ...songs.map(renderSongLatex),
  renderStandaloneLatex(worksCited),
  renderStandaloneLatex(furtherReading),
].join("\n\n\\clearpage\n\n");

const tex = `\\documentclass[11pt,letterpaper]{article}

\\usepackage[margin=0.8in]{geometry}
\\usepackage{fontspec}
\\usepackage{graphicx}
\\usepackage{eso-pic}
\\usepackage{latex/styles/concordance}
\\usepackage{transparent}
\\usepackage[export]{adjustbox}

\\setmainfont{Nimbus Roman}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}

\\begin{document}

${renderedDocument}

\\end{document}
`;

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, tex, "utf8");

console.log(`Wrote ${outputPath}`);