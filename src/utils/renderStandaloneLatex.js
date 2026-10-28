import {
  escapeLatex,
  renderMarkdownLatex,
} from "./renderMarkdownLatex.js";

import { renderPhotoPageStart } from "./renderPhotoPageLatex.js";

export function renderStandaloneLatex(page) {
  return `${renderPhotoPageStart(page)}

\\section*{${escapeLatex(page.title)}}

\\vspace{1.5em}

${renderMarkdownLatex(page.body)}
`;
}