import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

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

// Utility to load and inject content into a template
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
  const folders = await fs.readdir(binderDir);
  for (const folder of folders) {
    const sectionPath = path.join(binderDir, folder);
    const stat = await fs.stat(sectionPath);
    if (!stat.isDirectory()) continue;

    const files = await fs.readdir(sectionPath);
    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('track-list')) continue;

      const filePath = path.join(sectionPath, file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const sections = splitMarkdownSections(raw);

      const outputHtml = await renderTemplate(contentTemplate, {
        TITLE: sections.title || file.replace('.md', ''),
        TRANSLATION_HTML: marked.parse(sections.target),
        SOURCE_HTML: marked.parse(sections.source),
        COMMENTARY_HTML: marked.parse(sections.commentary + '\n\n' + sections.notes),
      });

      const outputDir = path.join(buildDir, folder);
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(path.join(outputDir, file.replace('.md', '.html')), outputHtml);
    }
  }
}

async function buildTitlePage() {
  const titleMd = await fs.readFile(path.join(binderDir, 'title-page.md'), 'utf-8');
  const titleHtml = await renderTemplate(titleTemplate, {
    TITLE_CONTENT: marked.parse(titleMd),
  });
  await fs.writeFile(path.join(buildDir, 'index.html'), titleHtml);
}

import { getTrackLists } from '../scripts/toc-helpers.js';

async function buildTOCPage() {
  const tracklistsMarkdown = await getTrackLists(true); // enable TOC link mode
  const tocHtml = await renderTemplate(tocTemplate, {
    TOC_CONTENT: marked.parse(tracklistsMarkdown),
  });
  await fs.writeFile(path.join(buildDir, 'toc.html'), tocHtml);
}

async function copyAssets() {
  // Copy styles.css
  await fs.copyFile(path.join(__dirname, 'styles.css'), path.join(buildDir, 'styles.css'));

  // Optionally: copy selected bootstrap files
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
