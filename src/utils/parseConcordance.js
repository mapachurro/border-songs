/**
 * Split Markdown lyrics into stanzas separated by blank lines.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitStanzas(text) {
  const trimmed = text.trim();

  if (!trimmed) return [];

  return trimmed.split(/\n\s*\n/).map((stanza) => stanza.trim());
}

/**
 * Parse and validate a bilingual concordance.
 *
 * @param {string} sourceMarkdown
 * @param {string} targetMarkdown
 * @returns {{ source: string[], target: string[] }}
 */
export function parseConcordance(sourceMarkdown, targetMarkdown = "") {
  const source = splitStanzas(sourceMarkdown);
  const target = splitStanzas(targetMarkdown);

  if (target.length > 0 && source.length !== target.length) {
    throw new Error(
      `Source/Target stanza mismatch: ${source.length} source, ${target.length} target`,
    );
  }

  return { source, target };
}