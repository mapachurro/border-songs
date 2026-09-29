export function parseSong(body) {
  const sourceMatch = body.match(
    /# Source:\s*\n([\s\S]*?)\n# Target:\s*\n/
  );

  const targetMatch = body.match(
    /# Target:\s*\n([\s\S]*?)\n# Commentary:\s*\n/
  );

  if (!sourceMatch || !targetMatch) {
    throw new Error("Song is missing Source or Target section");
  }

  const source = splitStanzas(sourceMatch[1]);
  const target = splitStanzas(targetMatch[1]);

  if (source.length !== target.length) {
    throw new Error(
      `Source/Target stanza mismatch: ${source.length} source, ${target.length} target`
    );
  }

  return {
    source,
    target,
  };
}

function splitStanzas(text) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((stanza) => stanza.trim());
}