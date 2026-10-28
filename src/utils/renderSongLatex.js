import {
  escapeLatex,
  renderMarkdownLatex,
} from "./renderMarkdownLatex.js";

import { renderPhotoPageStart } from "./renderPhotoPageLatex.js";

export function renderPair(pair) {
  return `\\stanza{
${renderMarkdownLatex(pair.source ?? "")}
}
&
\\stanza{
${renderMarkdownLatex(pair.target ?? "")}
}
\\\\`;
}

function renderConcordance(block) {
  const pairs = block.source.map((source, index) => ({
    source,
    target: block.target[index] ?? null,
  }));

  const renderedPairs = pairs.map(renderPair).join("\n\n");

  return `\\begin{xltabular}{0.88\\textwidth}{@{}Y@{\\hspace{2em}}Y@{}}

${renderedPairs}

\\end{xltabular}`;
}

function renderEditorialSection(block) {
  const title = escapeLatex(block.title);

  const content = block.blocks
    .map(renderDocumentBlock)
    .filter(Boolean)
    .join("\n\n\\par\\medskip\n\n");

  return `\\par\\bigskip
\\noindent\\textbf{${title}}
\\par\\medskip

${content}
\\par\\bigskip`;
}

function renderDocumentBlock(block) {
  switch (block.type) {
    case "concordance":
      return renderConcordance(block);

    case "markdown":
      return renderMarkdownLatex(block.content);

    case "analysis":
    case "commentary":
    case "notes":
    case "gonzo":
    case "findings":
    case "photo":
      return renderEditorialSection(block);

    default:
      return "";
  }
}

export function renderSongLatex(song) {
  const content = song.blocks
    .map(renderDocumentBlock)
    .filter(Boolean)
    .join("\n\n");

  return `${renderPhotoPageStart(song)}

\\section*{${escapeLatex(song.title)}}

${song.authority ? `\\textbf{${escapeLatex(song.authority)}}` : ""}

\\vspace{1.5em}

${content}
`;
}
