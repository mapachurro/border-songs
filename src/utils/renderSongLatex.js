import { unified } from "unified";
import remarkParse from "remark-parse";

const markdownParser = unified().use(remarkParse);

function escapeLatex(text) {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function renderInline(node) {
  switch (node.type) {
    case "text":
      return escapeLatex(node.value);

    case "strong":
      return `\\textbf{${node.children.map(renderInline).join("")}}`;

    case "emphasis":
      return `\\textit{${node.children.map(renderInline).join("")}}`;

    case "inlineCode":
      return `\\texttt{${escapeLatex(node.value)}}`;

    case "break":
      return "\\\\";

    default:
      if (node.children) {
        return node.children.map(renderInline).join("");
      }

      return "";
  }
}

function renderBlock(node) {
  switch (node.type) {
    case "paragraph":
      return node.children.map(renderInline).join("");

    case "blockquote": {
      const content = node.children
        .map(renderBlock)
        .filter(Boolean)
        .join("\\\\\n");

      return `\\begin{quote}
${content}
\\end{quote}`;
    }

    // Preserve comments in Markdown, but don't typeset them yet.
    case "html":
      return "";

    default:
      if (node.children) {
        return node.children.map(renderBlock).filter(Boolean).join("\\\\\n");
      }

      return "";
  }
}

function renderMarkdown(markdown) {
  const tree = markdownParser.parse(markdown);

  return tree.children
    .map(renderBlock)
    .filter(Boolean)
    .join("\n\n\\par\n\n");
}

export function renderPair(pair) {
  return `\\stanza{
${renderMarkdown(pair.source ?? "")}
}
&
\\stanza{
${renderMarkdown(pair.target ?? "")}
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
      return renderMarkdown(block.content);

    case "analysis":
    case "commentary":
    case "notes":
    case "footnotes":
    case "findings":
    case "photo":
      return renderEditorialSection(block);

    default:
      return "";
  }
}

function renderBackground(song) {
  if (!song.background) {
    return "";
  }

  const imagePath = `public/${song.background}`;

  return `\\AddToShipoutPictureBG*{
  \\AtPageLowerLeft{
    \\transparent{0.18}{
      \\adjustimage{
        min size={\\paperwidth}{\\paperheight},
        center
      }{${imagePath}}
    }
  }
}`;
}

export function renderSongLatex(song) {
  const content = song.blocks
    .map(renderDocumentBlock)
    .filter(Boolean)
    .join("\n\n");

  return `${renderBackground(song)}

\\section*{${escapeLatex(song.title)}}

${song.authority ? `\\textbf{${escapeLatex(song.authority)}}` : ""}

\\vspace{1.5em}

${content}
`;
}