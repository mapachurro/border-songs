
/**
 * @typedef {Object} ParsedSong
 * @property {string[]} source
 * @property {string[]} target
 * @property {string} remainder
 */

/**
 * Parse a song body into its semantic sections.
 *
 * Source and Target must come first.
 * All subsequent H1 sections may appear in any order.
 *
 * @param {string} body
 * @returns {ParsedSong}
 */
export function parseSong(body) {
  const headings = [...body.matchAll(/^#\s+(.+?)\s*$/gm)];

  const sections = headings.map((match, index) => {
    const title = match[1].replace(/:\s*$/, "").trim();
    const start = match.index + match[0].length;
    const end =
      index + 1 < headings.length
        ? headings[index + 1].index
        : body.length;

    return {
      title: title.toLowerCase(),
      markdown: body.slice(start, end).trim(),
      start: match.index,
    };
  });

  if (
    sections.length < 2 ||
    sections[0].title !== "source" ||
    sections[1].title !== "target"
  ) {
    throw new Error(
      "Song must begin with Source followed by Target"
    );
  }

  const source = splitStanzas(sections[0].markdown);
  const target = splitStanzas(sections[1].markdown);

  if (target.length > 0 && source.length !== target.length) {
    throw new Error(
      `Source/Target stanza mismatch: ${source.length} source, ${target.length} target`
    );
  }

  const remainder =
    sections.length > 2
      ? body.slice(sections[2].start).trim()
      : "";

  return {
    source,
    target,
    remainder,
  };
}

function splitStanzas(text) {
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(/\n\s*\n/)
    .map((stanza) => stanza.trim());
}
