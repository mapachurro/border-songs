# Document model

This is the authoritative reference for **source content shared by the web and print editions**. Renderer-specific details belong in [web-build.md](web-build.md) and [print-build.md](print-build.md); motivations belong in [adr.md](adr.md).

                    binder/
                       │
                       ▼
                parseDocument()
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Astro web          LaTeX print
           renderer           renderer
              │                 │
              ▼                 ▼
            HTML               PDF

## Shared parsing stack

### Host requirements

- Node.js
- npm

### Project-managed dependencies

The shared document parser uses:

- `unified`: Markdown processing framework.
- `remark-parse`: Parses Markdown into an abstract syntax tree.
- `remark-directive`: Recognizes custom Markdown directives.

These dependencies are declared in `package.json` and installed through npm.

The shared parser does not enable `remark-gfm` or `remark-breaks`. Renderer-specific Markdown processing may use additional plugins.

### Implementation

- `src/utils/parseDirectives.js`: Parses Markdown into an abstract syntax tree using unified and remark.
- `src/utils/parseDocument.js`: Converts recognized directives into typed document blocks.
- `src/utils/parseConcordance.js`: Splits concordance text into stanzas and validates source/target alignment.

The resulting document blocks are shared by the web and print rendering pipelines.

## Directive inventory

| Directive | Meaning | Attributes |
| --- | --- | --- |
| `:::concordance` | Paired source and target stanzas | `source`, `target` (display labels) |
| `:::analysis` | Interpretive analysis | `title` |
| `:::notes` | General or translator's notes | `title` |
| `:::commentary` | General commentary, including *Versions* and *Intralinear subtext* | `title` |
| `:::findings` | Findings and formal editorial argument | `title` |
| `:::photo` | Photo-related material or credits | `title` |
| `:::footnotes` | Editorial footnotes section | `title` |

### Concordance

```md
:::concordance{source="English" target="Spanish"}

## Source

First original stanza.

Second original stanza.

## Target

First translated stanza.

Second translated stanza.

:::
```

#### Stanza parsing and validation

Concordance content is divided into stanzas by `splitStanzas()` in `src/utils/parseConcordance.js`.

A stanza is a block of text separated from adjacent stanzas by one or more blank lines. Leading and trailing whitespace is removed from each stanza. Line breaks within stanzas are preserved.

Source and target stanzas are aligned by their array positions, not by individual lyric lines.

When target content is present, the number of target stanzas must equal the number of source stanzas. A mismatch throws an error:

```text
Source/Target stanza mismatch: 4 source, 3 target
```

Target content is optional. A concordance containing source stanzas and an empty target is valid, although both structural headings (`## Source` and `## Target`) are required.

An entirely empty concordance is also accepted.

These rules describe parser validation only. Renderer behavior for empty or monolingual concordances must be verified separately.

`## Source` and `## Target` identify the sides structurally, regardless of the displayed labels. The parser aligns **stanzas by position**, not individual lyric lines. Label attributes are optional.

### Editorial sections

```md
:::notes{title="Translator's notes"}

A note about a translation choice.

:::

:::findings{title="Findings of fact and conclusions of law"}

An argument with ordinary **Markdown** formatting.

:::
```

### Nested concordances

Use a longer fence for the outer container:

```md
::::analysis

Comparison of a passage:

:::concordance

## Source

Original passage.

## Target

Translated passage.

:::

Further analysis.

::::
```

## Shared parser

`src/utils/parseDocument.js` produces typed blocks. Known shapes:

```js
// ConcordanceBlock
{
  type: "concordance",
  source: ["first stanza", "second stanza"],
  target: ["first stanza", "second stanza"],
  sourceTitle: "...",
  targetTitle: "..."
}

// MarkdownBlock
{ type: "markdown", content: "..." }

// EditorialBlock
{
  type: "analysis", // or notes, commentary, findings, photo, footnotes
  title: "...",
  blocks: [/* MarkdownBlock and/or ConcordanceBlock */]
}
```

This model describes **what content is**, not its HTML or LaTeX appearance.

## Authoring conventions

1. Use directives rather than legacy top-level source/target headings.
2. Use `## Source` and `## Target` inside each concordance.
3. Use `title` when a section needs a specific displayed heading.
4. Use a longer outer fence when nesting directives.
5. Test both web and print when changing directive semantics or parser behavior.

## Current parser behavior and limitations

### Top-level content

`parseDocument()` processes recognized top-level container directives only. Ordinary Markdown outside those directives, including headings and paragraphs, is ignored.

The recognized top-level directives are `concordance`, `analysis`, `commentary`, `notes`, `footnotes`, `findings`, and `photo`.

Unknown top-level directives are silently ignored.

### Nesting

Editorial directives can contain ordinary Markdown and nested concordances.

Nested concordances are returned as `ConcordanceBlock` objects within the parent editorial block's `blocks` array.

Nested editorial directives are not recursively interpreted as editorial blocks. Their source text remains part of the surrounding Markdown content.

Use longer outer directive fences when nesting concordances inside editorial sections.

### Concordance structure

Each concordance must contain exactly two immediate level-two headings:

1. `## Source`
2. `## Target`

The parser accepts case variations and trailing colons, but does not reliably recognize headings containing inline formatting.

Missing, additional, or incorrectly ordered level-two headings cause parsing to fail.

The `source` and `target` attributes control display labels only. They do not change the structural heading requirements.

### Default labels

When directive attributes are omitted:

- `sourceTitle` defaults to `"Source"`.
- `targetTitle` defaults to `"Target"`.
- Editorial `title` defaults to the directive name.

### Editorial conventions

`:::footnotes` is a semantic editorial section, not an implementation of automatic Markdown footnotes such as `[^1]`. True print footnote rendering remains unfinished.

*Versions* and *Intralinear subtext* currently use the `commentary` directive rather than dedicated block types.

### Outstanding questions

- **TODO:** Verify stanza splitting, unequal stanza counts, and empty concordance behavior in `parseConcordance.js`.
- **TODO:** Verify enabled Markdown extensions and malformed directive handling in `parseDirectives.js`.
- **TODO:** Document all YAML frontmatter fields and their validation rules.
- **TODO:** Decide whether silently ignoring unknown directives is desirable or whether validation should report them.

## Migration history

`scripts/migrate-song-directives.js` migrated 38 songs; *Romance in Durango* had already been migrated. Source/Target stanza arrays were compared between legacy and new parsers before writing. The script is a historical migration aid, not the recommended authoring workflow.