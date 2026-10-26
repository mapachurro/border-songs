# Web build

The web edition of *Border Songs* uses **Astro**. Shared content semantics are defined in [document-model.md](document-model.md); the reasons for architectural choices are recorded in [adr.md](adr.md).

## Stack and dependencies

### Host requirements
├── Node.js
├── npm

### Project-managed dependencies
├── Astro

For more information on the "shared" parser, see explanation in the [Document Model](./document-model.md) docs.

### Runtime
For relevant commands to start the dev server, create build, etc., see the [package file](../package.json).

## Pipeline

```text
binder/ (Markdown + YAML frontmatter)
              |
              v
  parseDocument() [shared]
              |
              v
    Astro pages/components
              |
              v
          HTML + CSS
```

The parser determines the content structure. Astro components determine how that structure is presented and navigated on the website. The print edition consumes the same semantic model but has separate styling.

## Development commands

From the repository root:

```bash
npm install
npm run dev
```

Build the production site with:

```bash
npm run build
```

The repository has also used `npm run check`; confirm the exact current scripts in `package.json` before making it a required step.

## Responsibilities

- `binder/`: canonical song content and metadata.
- `src/utils/parseDocument.js`: shared parsing of directives into typed blocks.
- Astro routes and components: HTML rendering, navigation, and page structure.
- CSS: responsive presentation, typography, and visual treatments.

The renderer must account for `concordance`, `markdown`, `analysis`, `notes`, `commentary`, `findings`, `photo`, and `gonzo` blocks. Editorial blocks can include nested concordances. Source and target content is paired at the stanza level.

**TODO:** Add the exact Astro route/component map after inspecting the current source tree. Do not treat the names above as a complete file inventory.

## Deployment

The site has been deployed through GitHub Pages. **TODO:** Verify and document `astro.config.*`, GitHub Actions workflow(s), deployment base path, and asset path conventions.

## Regression checks

1. Run `npm run build` after changes to routes, components, or content loading.
2. Inspect representative pages locally, including songs with multiple editorial sections and nested concordances.
3. Check that all source/target and editorial content appears, not merely that the build succeeds.
4. For changes to `parseDocument()` or the directive schema, also run `npm run build:print`.

## Design status

The web visual language is still evolving. Web styling changes do not automatically require matching LaTeX changes. The shared semantic contract must remain consistent across both editions.

## Internal links and deployment base

Song Markdown files use root-relative paths for internal links, independent of the website's deployment location.

For example:

```md
[Fast Car](/03-alcanzar-la-ribera/03-fast-car/)
```

The web renderer (`src/utils/renderMarkdown.js`) rewrites root-relative URLs using Astro's configured `import.meta.env.BASE_URL`.

With the current `base: "/border-songs"` configuration, the example above renders as:

```text
/border-songs/03-alcanzar-la-ribera/03-fast-car/
```

This allows the same Markdown to work when the site is deployed under a different base path, including `/` on a custom domain.

**Authoring conventions:**

- Begin internal links with `/`, relative to the Border Songs content root.
- Do not include the deployment prefix (`/border-songs/`) in source Markdown.
- Do not use document-relative paths such as `../`.
- Trailing slashes are optional for the current song routes.
- External URLs and fragment links are not rewritten.

The transformation applies to Markdown links, reference-style links, and images. It does not modify the source files.

**Print compatibility:** The LaTeX renderer processes Markdown links independently. Internal links are not yet converted into PDF cross-references, so this convention currently guarantees correct navigation only in the web edition.

## Documentation to complete

- Route and component map.
- Markdown-to-HTML rendering within parsed blocks.
- Frontmatter loading and validation.
- Custom concordance label handling.
- Navigation, assets, accessibility, and design tokens.
- GitHub Pages build and deployment details.