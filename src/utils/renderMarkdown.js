import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

// Astro's configured deployment base, e.g. "/border-songs/".
const BASE_URL = import.meta.env?.BASE_URL ?? "/";

function normalizeBase(base) {
  const trimmed = base.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

function resolveInternalUrl(url) {
  // Only rewrite root-relative URLs, not external links,
  // protocol-relative URLs, fragments, or relative paths.
  if (!url.startsWith("/") || url.startsWith("//")) {
    return url;
  }

  const base = normalizeBase(BASE_URL);

  if (base === "/" || url.startsWith(base)) {
    return url;
  }

  return `${base}${url.slice(1)}`;
}

function remarkResolveInternalLinks() {
  return (tree) => {
    function visit(node) {
      if (node.type === "link" || node.type === "image") {
        node.url = resolveInternalUrl(node.url);
      }

      if (node.type === "definition") {
        node.url = resolveInternalUrl(node.url);
      }

      if (node.children) {
        node.children.forEach(visit);
      }
    }

    visit(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkResolveInternalLinks)
  .use(remarkRehype)
  .use(rehypeStringify);

export async function renderMarkdown(markdown) {
  const result = await processor.process(markdown);
  return String(result);
}