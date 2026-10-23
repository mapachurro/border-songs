import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective);

export function parseDirectives(markdown) {
  return processor.parse(markdown);
}