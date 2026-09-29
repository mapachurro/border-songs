import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { parseSong } from "../src/utils/parseSong.js";

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

const inputPath =
  "binder/04-desde-la-otra-costa/02-leaving-las-vegas.md";

const markdown = fs.readFileSync(inputPath, "utf8");

// -----------------------------------------------------------------------------
// Parse frontmatter
// -----------------------------------------------------------------------------

const frontmatterMatch = markdown.match(
  /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/,
);

if (!frontmatterMatch) {
  throw new Error(`Missing or invalid frontmatter: ${inputPath}`);
}

const metadata = yaml.load(frontmatterMatch[1]);
const body = frontmatterMatch[2];

// -----------------------------------------------------------------------------
// Parse Border Songs structure
// -----------------------------------------------------------------------------

const { source, target, remainder } = parseSong(body);

const pairs = source.map((sourceStanza, index) => ({
  source: sourceStanza,
  target: target[index] ?? null,
}));

const song = {
  title: metadata.title,
  authority: metadata.authority,
  videoSource: metadata.videoSource,
  pairs,
  remainder,
};

// -----------------------------------------------------------------------------
// Render LaTeX
// -----------------------------------------------------------------------------

function renderLines(text) {
  if (!text) {
    return "";
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/, ""))
    .filter(Boolean)
    .join("\\\\\n");
}

function renderPair(pair) {
  return `\\stanza{
${renderLines(pair.source)}
}
&
\\stanza{
${renderLines(pair.target)}
}
\\\\`;
}

function renderSong(song) {
  const renderedPairs = song.pairs.map(renderPair).join("\n\n");

  return `\\documentclass[11pt,letterpaper]{article}

\\usepackage[margin=0.8in]{geometry}
\\usepackage{fontspec}
\\usepackage{xltabular}
\\usepackage{array}

\\newcolumntype{Y}{>{\\raggedright\\arraybackslash}X}

\\setmainfont{Nimbus Roman}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}

\\newcommand{\\stanza}[1]{%
  \\begin{minipage}[t]{\\linewidth}
    \\raggedright
    #1
    \\vspace{1.5em}
  \\end{minipage}
}

\\begin{document}

\\section*{${song.title}}

\\textbf{${song.authority ?? ""}}

\\vspace{1.5em}

\\begin{xltabular}{0.88\\textwidth}{@{}Y@{\\hspace{2em}}Y@{}}

${renderedPairs}

\\end{xltabular}

\\end{document}
`;
}

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

const tex = renderSong(song);

const outputPath = path.join(
  "dist-print",
  "leaving-las-vegas.tex",
);

fs.mkdirSync("dist-print", { recursive: true });
fs.writeFileSync(outputPath, tex, "utf8");

console.log(`Wrote ${outputPath}`);