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
        return node.children
          .map(renderBlock)
          .filter(Boolean)
          .join("\\\\\n");
      }

      return "";
  }
}

function renderMarkdown(markdown) {
  const tree = markdownParser.parse(markdown);

  return tree.children
    .map(renderBlock)
    .filter(Boolean)
    .join("\\\\\n");
}

export function renderPair(pair) {
  return `\\stanza{
${renderMarkdown(pair.source)}
}
&
\\stanza{
${renderMarkdown(pair.target)}
}
\\\\`;
}

export function renderSongLatex(song) {
  const renderedPairs = song.pairs
    .map(renderPair)
    .join("\n\n");

  return `\\section*{${escapeLatex(song.title)}}

${song.authority ? `\\textbf{${escapeLatex(song.authority)}}` : ""}

\\vspace{1.5em}

\\begin{xltabular}{0.88\\textwidth}{@{}Y@{\\hspace{2em}}Y@{}}

${renderedPairs}

\\end{xltabular}
`;
}