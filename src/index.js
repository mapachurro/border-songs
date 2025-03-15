import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { getTrackLists, getOrderedSongPages } from '../scripts/toc-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.resolve(__dirname, '../build');
const binderDir = path.resolve(__dirname, '../binder');

const contentTemplate = path.resolve(__dirname, 'template.html');
const titleTemplate = path.resolve(__dirname, 'title-template.html');
const tocTemplate = path.resolve(__dirname, 'toc-template.html');

async function ensureBuildDir() {
  await fs.mkdir(buildDir, { recursive: true });
}

async function renderTemplate(templatePath, replacements) {
  const template = await fs.readFile(templatePath, 'utf-8');
  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

function splitMarkdownSections(md) {
  const sections = {
    title: '',
    source: '',
    target: '',
    commentary: '',
    notes: ''
  };
  const blocks = md.split(/^# /gm);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.startsWith('Title:')) sections.title = trimmed.replace(/^Title:\s*/, '').trim();
    else if (trimmed.startsWith('Source')) sections.source = trimmed.slice('Source'.length).trim();
    else if (trimmed.startsWith('Target')) sections.target = trimmed.slice('Target'.length).trim();
    else if (trimmed.startsWith('Commentary')) sections.commentary = trimmed.slice('Commentary'.length).trim();
    else if (trimmed.startsWith('Notes')) sections.notes = trimmed.slice('Notes'.length).trim();
  }
  return sections;
}

async function buildContentPages() {
  const songPages = await getOrderedSongPages();

  for (let i = 0; i < songPages.length; i++) {
    const { folder, filename, outputPath, title } = songPages[i];
    const filePath = path.join(binderDir, folder, filename.replace('.html', '.md'));

    const exists = await fs.stat(filePath).then(() => true).catch(() => false);
    if (!exists) continue;

    const raw = await fs.readFile(filePath, 'utf-8');
    const sections = splitMarkdownSections(raw);

    const prevLink = i > 0 ? `./${songPages[i - 1].outputPath}` : '';
    const nextLink = i < songPages.length - 1 ? `./${songPages[i + 1].outputPath}` : '';

    const outputHtml = await renderTemplate(contentTemplate, {
      TITLE: sections.title || title,
      TRANSLATION_HTML: marked.parse(sections.target),
      SOURCE_HTML: marked.parse(sections.source),
      COMMENTARY_HTML: marked.parse(sections.commentary + '\n\n' + sections.notes),
      PREV_BUTTON: prevLink ? `<a class="btn btn-outline-secondary" href="${prevLink}">← Previous</a>` : '',
      NEXT_BUTTON: nextLink ? `<a class="btn btn-outline-secondary" href="${nextLink}">Next →</a>` : '',
    });

    const outputDir = path.join(buildDir, folder);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, filename), outputHtml);
  }
}

async function buildTitlePage() {
  const titleMd = await fs.readFile(path.join(binderDir, 'title-page.md'), 'utf-8');
  const titleHtml = await renderTemplate(titleTemplate, {
    TITLE_CONTENT: marked.parse(titleMd),
  });
  await fs.writeFile(path.join(buildDir, 'index.html'), titleHtml);
}

async function buildTOCPage() {
  const tocMd = await getTrackLists(true); // markdownLinkStyle = true
  const tocHtml = await renderTemplate(tocTemplate, {
    TOC_CONTENT: marked.parse(tocMd),
  });
  await fs.writeFile(path.join(buildDir, 'toc.html'), tocHtml);
}

async function copyAssets() {
  // Copy JS frontend scripts to build
  await fs.cp(path.join(__dirname, 'js'), path.join(buildDir, 'js'), { recursive: true });
  // Copy CSS assets to build
  await fs.copyFile(path.join(__dirname, 'styles.css'), path.join(buildDir, 'styles.css'));
  await fs.copyFile(path.join(__dirname, 'bootstrap/bootstrap.min.css'), path.join(buildDir, 'bootstrap.min.css'));
  await fs.copyFile(path.join(__dirname, 'bootstrap/custom.css'), path.join(buildDir, 'custom.css'));
}

async function buildAll() {
  await ensureBuildDir();
  await buildContentPages();
  await buildTitlePage();
  await buildTOCPage();
  await copyAssets();
  console.log('✅ Build complete!');
}

buildAll();
