import { parseDirectives } from "./parseDirectives.js";
import { parseConcordance } from "./parseConcordance.js";

/**
 * @typedef {{ type: "markdown", content: string }} MarkdownBlock
 */

/**
 * @typedef {{
 *   type: "concordance",
 *   source: string[],
 *   target: string[],
 *   sourceTitle: string,
 *   targetTitle: string
 * }} ConcordanceBlock
 */

/**
 * @typedef {"analysis" | "commentary" | "notes" | "footnotes" | "findings" | "photo"} EditorialType
 */

/**
 * @typedef {{
 *   type: EditorialType,
 *   title: string,
 *   blocks: (MarkdownBlock | ConcordanceBlock)[]
 * }} EditorialBlock
 */

/**
 * @typedef {MarkdownBlock | ConcordanceBlock | EditorialBlock} DocumentBlock
 */

const editorialTypes = new Set([
  "analysis",
  "commentary",
  "notes",
  "footnotes",
  "findings",
  "photo",
]);

function headingText(node) {
  return node.children
    .filter((child) => child.type === "text")
    .map((child) => child.value)
    .join("")
    .trim()
    .replace(/:\s*$/, "")
    .toLowerCase();
}

function extractMarkdown(markdown, nodes) {
  if (!nodes.length) return "";

  const start = nodes[0].position.start.offset;
  const end = nodes[nodes.length - 1].position.end.offset;

  return markdown.slice(start, end);
}

/** @returns {ConcordanceBlock} */

function parseConcordanceNode(node, markdown) {
  const headings = node.children
    .map((child, index) => ({ child, index }))
    .filter(
      ({ child }) =>
        child.type === "heading" &&
        child.depth === 2
    );

  if (
    headings.length !== 2 ||
    headingText(headings[0].child) !== "source" ||
    headingText(headings[1].child) !== "target"
  ) {
    throw new Error(
      "Concordance must contain ## Source followed by ## Target"
    );
  }

  const sourceNodes = node.children.slice(
    headings[0].index + 1,
    headings[1].index
  );

  const targetNodes = node.children.slice(
    headings[1].index + 1
  );

  return {
  type: "concordance",
  sourceTitle: node.attributes?.source ?? "Source",
  targetTitle: node.attributes?.target ?? "Target",
  ...parseConcordance(
    extractMarkdown(markdown, sourceNodes),
    extractMarkdown(markdown, targetNodes),
  ),
};
}

/** @returns {(MarkdownBlock | ConcordanceBlock)[]} */

function parseBlocks(nodes, markdown) {
  const blocks = [];
  let prose = [];

  function flushProse() {
    if (!prose.length) return;

    const content = extractMarkdown(markdown, prose).trim();

    if (content) {
      blocks.push({
        type: "markdown",
        content,
      });
    }

    prose = [];
  }

  for (const node of nodes) {
    if (
      node.type === "containerDirective" &&
      node.name === "concordance"
    ) {
      flushProse();
      blocks.push(parseConcordanceNode(node, markdown));
    } else {
      prose.push(node);
    }
  }

  flushProse();
  return blocks;
}

/**
 * @param {string} markdown
 * @returns {DocumentBlock[]}
 */

export function parseDocument(markdown) {
  const tree = parseDirectives(markdown);
  const document = [];

  for (const node of tree.children) {
    if (node.type !== "containerDirective") {
      continue;
    }

    if (node.name === "concordance") {
      document.push(parseConcordanceNode(node, markdown));
      continue;
    }

    if (editorialTypes.has(node.name)) {
  document.push({
    type: /** @type {EditorialType} */ (node.name),
    title: node.attributes?.title ?? node.name,
    blocks: parseBlocks(node.children, markdown),
  });
}
  }
  return document;
}