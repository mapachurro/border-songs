export function parseSong(body) {
  const sourceMatch = body.match(
  /# Source:?\s*\n([\s\S]*?)\n# Target:?\s*\n/
);

const targetMatch = body.match(
  /# Target:?\s*\n([\s\S]*?)\n# Commentary:?\s*\n/
);

const remainderMatch = body.match(
  /# Commentary:?\s*\n[\s\S]*$/
);

 if (!sourceMatch || !targetMatch || !remainderMatch) {
  throw new Error(
    "Song is missing Source, Target, or Commentary section"
  );
}

  const source = splitStanzas(sourceMatch[1]);
  const target = splitStanzas(targetMatch[1]);
  const remainder = remainderMatch[0];

  if (target.length > 0 && source.length !== target.length) {
  throw new Error(
    `Source/Target stanza mismatch: ${source.length} source, ${target.length} target`
  );
}

  return {
    source,
    target,
    remainder
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