# Print build

The print edition of *Border Songs* generates a PDF using JavaScript, LaTeX, **LuaLaTeX**, and Docker. Shared source syntax and parsing are documented in [document-model.md](document-model.md).

## Stack and dependencies

### Host requirements
├── Node.js
├── npm
└── Docker-compatible container runtime

### Container-managed dependencies
├── TeX Live
├── LuaLaTeX
├── LaTeX packages
├── print fonts

### Runtime
To produce a .pdf printout of this book:

`npm run build:print`

This command leverages `scripts/build-print.js`. The resulting .pdf will be located at `dist-print/songbook.pdf`.

## Pipeline

```text
binder/ (Markdown + YAML frontmatter)
              |
              v
  scripts/build-songbook.js
              |
              +--> parseDocument() [shared]
              |
              v
    renderSongLatex()
              |
              v
   dist-print/songbook.tex
              |
              v
     Docker / LuaLaTeX
              |
              v
   dist-print/songbook.pdf
```

## Build command

From the repository root:

```bash
npm run build:print
```

This runs `scripts/build-print.js`, which:

1. Builds the `border-songs-latex` Docker image from `docker/latex/Dockerfile`.
2. Runs `node scripts/build-songbook.js` to write `dist-print/songbook.tex`.
3. Runs LuaLaTeX in the Docker container, mounting the repository at `/work`, to compile the PDF into `dist-print/`.

The current workflow requires Node.js/npm and Docker.

## Key files

| File | Responsibility |
| --- | --- |
| `scripts/build-print.js` | Orchestrates Docker build and compilation |
| `scripts/build-songbook.js` | Discovers songs, extracts metadata, generates book source |
| `src/utils/parseDocument.js` | Shared document parser |
| `src/utils/renderSongLatex.js` | Renders typed blocks as LaTeX |
| `latex/styles/concordance.sty` | Print-specific bilingual layout and styles |
| `docker/latex/Dockerfile` | TeX build environment |
| `dist-print/songbook.tex` | Generated LaTeX intermediate |
| `dist-print/songbook.pdf` | Generated PDF |

## Rendering behavior

At the last verified build, the script discovered **39 songs** in numbered section directories under `binder/`. `parseDocument()` produced typed blocks for the print renderer:

- **Concordance:** paired source and target stanzas in a two-column `xltabular` layout.
- **Markdown:** converted into LaTeX text and paragraph markup.
- **Editorial sections:** heading followed by recursively rendered content, including nested concordances.

The print builder formerly included a `parseSong()` fallback for legacy songs. **TODO:** Check whether this compatibility path has now been removed.

## Last confirmed checkpoint

Following migration of the 39-song corpus, `npm run build:print` completed successfully with a **100-page, 233,430-byte PDF**. These figures are historical test results, not expected fixed outputs. The compiler reported non-fatal `Overfull \hbox` warnings.

## Known limitations

### Markdown footnotes

Markers such as `[^1]` are not yet converted into actual LaTeX footnotes. An earlier build failed when a literal footnote marker followed a LaTeX `\\` line break and was misread as a spacing dimension. Changing Markdown block separation to `\par` resolved that compilation error, **not** footnote rendering.

### Accidental monospaced formatting

The last successful build contained lengthy `Overfull \hbox` warnings involving `lmtt` (monospaced) text. Some passages may be parsed as code due to Markdown indentation. Inspect source Markdown and generated LaTeX before changing page margins or fonts.

### Aesthetics

The print edition is structurally functional but its visual design is provisional. Print styling can be developed after the web design stabilizes, while retaining semantic parity.

### Non-fatal warnings

Docker's legacy-builder deprecation notice and a LaTeX package-name warning have appeared in logs without preventing successful compilation.

## Debugging

Regenerate LaTeX without rebuilding Docker:

```bash
node scripts/build-songbook.js
```

Inspect the LaTeX around a reported line (adjust numbers as needed):

```bash
sed -n '2285,2300p' dist-print/songbook.tex
```

The observed compilation log is `dist-print/songbook.log`. A complete build is `npm run build:print`.

## Regression checks

When changing the shared parser or directive structure, build both editions. For print, compilation success is only the first check: inspect representative PDF pages for missing sections, stanza alignment, line breaks, literal Markdown markers, and typography warnings.

## Documentation to complete

- LaTeX preamble, font selection, and command reference.
- Page-break behavior and table continuation rules.
- True footnote implementation.
- Images and print asset resolution.
- Build artifact cleanup and ignore rules.