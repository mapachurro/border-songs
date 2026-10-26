# Architectural Decision Records

This is a chronological record of significant decisions about *Border Songs*. ADRs explain **why** decisions were made. Current implementation details belong in [document-model.md](document-model.md), [web-build.md](web-build.md), and [print-build.md).

These entries are reconstructed retrospectively. Dates and original motivations should be checked against Git history. Append new records with stable identifiers; when a decision changes, mark it superseded and link to the replacement rather than deleting it.

## ADR-001: Markdown is the canonical content source

**Status:** Accepted · **Date:** To verify

**Context:** The songbook needs a web edition and a printable edition, both containing original text, translations, and editorial writing.

**Decision:** Store song content as Markdown with YAML frontmatter in `binder/`, and generate both editions from that corpus.

**Consequences:** Content is independent of its presentation, but source conventions must be documented and understood by both pipelines. The Markdown format must accommodate bilingual alignment and editorial sections.

## ADR-002: Adopt Astro for the web edition

**Status:** Accepted · **Date:** To verify

**Context:** An earlier frontend plan described a custom `src/index.js` build and heading-based source/target handling. The current web edition uses Astro.

**Decision:** Use Astro for web pages, components, and presentation.

**Consequences:** Web layout can evolve independently of print layout. Astro should consume shared document semantics rather than create its own incompatible content format.

**Historical note:** The precise original selection criteria for Astro still need to be supplied or recovered.

## ADR-003: Adopt semantic Markdown directives

**Status:** Accepted · **Date:** To verify

**Context:** Legacy `# Source`, `# Target`, and editorial headings did not express nested comparisons or distinguish structural meaning from heading typography reliably.

**Decision:** Use `remark-directive`-style `:::` containers to identify concordances and editorial sections. Preserve ordinary Markdown inside the containers. Migrate the 39-song corpus to this structure.

**Consequences:** The source can express richer layouts, including concordances nested inside editorial sections. Directive names and attributes become a shared authoring contract. Both renderers must support new semantic blocks.

See [document-model.md](document-model.md) for syntax.

## ADR-004: Share parsing, separate rendering

**Status:** Accepted · **Date:** To verify

**Context:** The web and print editions need to agree about the meaning of source content, but their presentation technologies and layout constraints differ.

**Decision:** Parse Markdown into typed blocks with `src/utils/parseDocument.js`. Render those blocks separately in Astro and through `src/utils/renderSongLatex.js`.

**Consequences:** Changes to the document model affect both outputs and require cross-format testing. The renderers must maintain **semantic parity**, not pixel-for-pixel visual equivalence. Print aesthetics can remain provisional while web design evolves.

## ADR-005: Use Docker and LuaLaTeX for print

**Status:** Accepted · **Date:** To verify

**Context:** A paginated bilingual book needs print-specific layout controls and a repeatable compilation environment.

According to notes made in `./README.md`, this would have been done in September 2026: 

### Edit, September 2026
Haha just kidding. We're gonna use LaTex, too. Ha ha


**Decision:** Generate LaTeX from the shared document model and compile with LuaLaTeX inside a Docker image defined under `docker/latex/`.

**Consequences:** The PDF pipeline has an explicit TeX environment and its own stylesheets. Successful compilation is distinct from typographic correctness, so PDF inspection remains part of testing.

## Recording future decisions

A new semantic block system, replacement renderer, or fundamental footnote policy may merit an ADR. Routine CSS adjustments, bug fixes, and typography refinements usually do not. Keep this file a history of decisions, not a running description of every implementation change.