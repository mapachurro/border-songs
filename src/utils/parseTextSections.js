const sectionTypes = {
  commentary: "commentary",
  notes: "notes",
  footnotes: "footnotes",
  findings: "findings",
  photo: "photo",
};

/**
 * Split the prose following Source/Target into semantic sections.
 *
 * @param {string} markdown
 * @returns {{ type: string, title: string, body: string }[]}
 */
export function parseTextSections(markdown) {
  const sections = [];
  let current = null;

  function finishSection() {
    if (!current) return;

    const body = current.lines.join("\n").trim();

    if (body) {
      sections.push({
        type: current.type,
        title: current.title,
        body,
      });
    }
  }

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^#\s+(.+?)\s*:?\s*$/);

    if (match) {
      finishSection();

      const title = match[1].replace(/:\s*$/, "").trim();
      const type = sectionTypes[title.toLowerCase()] ?? "other";

      current = { type, title, lines: [] };
    } else {
      if (!current) {
        current = { type: "other", title: "Additional text", lines: [] };
      }

      current.lines.push(line);
    }
  }

  finishSection();
  return sections;
}
