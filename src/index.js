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

const navIndex = [];

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

async function getOrderedSongPagesFromFilenames() {
  const songPages = [];
  const folders = await fs.readdir(binderDir);
  for (const folder of folders) {
    const sectionPath = path.join(binderDir, folder);
    const stat = await fs.stat(sectionPath);
    if (!stat.isDirectory()) continue;

    const files = (await fs.readdir(sectionPath))
      .filter(f => f.endsWith('.md') && !f.startsWith('track-list') && /^\d+-/.test(f))
      .sort();

    for (const file of files) {
      songPages.push({
        title: file.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '),
        folder,
        filename: file.replace('.md', '.html'),
        outputPath: `${folder}/${file.replace('.md', '.html')}`,
        mdFile: path.join(sectionPath, file)
      });
    }
  }
  return songPages;
}

async function buildContentPages() {
  const songPages = await getOrderedSongPagesFromFilenames();
  for (let i = 0; i < songPages.length; i++) {
    const { folder, filename, outputPath, title, mdFile } = songPages[i];
    const raw = await fs.readFile(mdFile, 'utf-8');
    const sections = splitMarkdownSections(raw);
    const outputHtml = await renderTemplate(contentTemplate, {
      ASSET_PATH: '../',
      TITLE: sections.title || title,
      TRANSLATION_HTML: marked.parse(sections.target),
      SOURCE_HTML: marked.parse(sections.source),
      COMMENTARY_HTML: marked.parse(sections.commentary + '\n\n' + sections.notes),
      PREV_BUTTON: '',
      NEXT_BUTTON: '',
    });
    const outputDir = path.join(buildDir, folder);
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, filename);
    await fs.writeFile(filePath, outputHtml);
    navIndex.push(`${folder}/${filename}`);
  }
}

async function buildTitlePage() {
  const titleMd = await fs.readFile(path.join(binderDir, 'title-page.md'), 'utf-8');
  const titleHtml = await renderTemplate(titleTemplate, {
    ASSET_PATH: '',
    TITLE_CONTENT: marked.parse(titleMd),
    PREV_BUTTON: '',
    NEXT_BUTTON: '',
  });
  await fs.writeFile(path.join(buildDir, 'index.html'), titleHtml);
  navIndex.unshift('index.html');
}

async function buildTOCPage() {
  const tocMd = await getTrackLists(true);
  const tocHtml = await renderTemplate(tocTemplate, {
    ASSET_PATH: '',
    TOC_CONTENT: marked.parse(tocMd),
    PREV_BUTTON: '',
    NEXT_BUTTON: '',
  });
  await fs.writeFile(path.join(buildDir, 'toc.html'), tocHtml);
  navIndex.push('toc.html');
}

async function buildTrackListPages() {
  const folders = await fs.readdir(binderDir);
  for (const folder of folders) {
    const sectionPath = path.join(binderDir, folder);
    const stat = await fs.stat(sectionPath);
    if (!stat.isDirectory()) continue;

    const files = (await fs.readdir(sectionPath))
      .filter(f => f.startsWith('track-list') && f.endsWith('.md'));

    for (const file of files) {
      const trackListPath = path.join(sectionPath, file);
      const trackListContent = await fs.readFile(trackListPath, 'utf-8');
      const outputFilename = file.replace('.md', '.html');
      const outputPath = `${folder}/${outputFilename}`;

      const trackListHtml = await renderTemplate(tocTemplate, {
        ASSET_PATH: '../',
        TOC_CONTENT: marked.parse(trackListContent),
        PREV_BUTTON: '',
        NEXT_BUTTON: '',
      });
      const outputDir = path.join(buildDir, folder);
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(path.join(outputDir, outputFilename), trackListHtml);
      navIndex.push(outputPath);
    }
  }
}

async function copyAssets() {
  await fs.writeFile(path.join(buildDir, '.nojekyll'), '');
  await fs.mkdir(path.join(buildDir, 'js'), { recursive: true });
  const jsFiles = await fs.readdir(path.join(__dirname, 'js'));
  for (const file of jsFiles) {
    await fs.copyFile(
      path.join(__dirname, 'js', file),
      path.join(buildDir, 'js', file)
    );
  }
  await fs.copyFile(path.join(__dirname, 'styles.css'), path.join(buildDir, 'styles.css'));
  const bootstrapDir = path.join(__dirname, 'bootstrap');
  if (await fs.stat(bootstrapDir).then(() => true).catch(() => false)) {
    const bootstrapMinCss = path.join(bootstrapDir, 'bootstrap.min.css');
    if (await fs.stat(bootstrapMinCss).then(() => true).catch(() => false)) {
      await fs.copyFile(bootstrapMinCss, path.join(buildDir, 'bootstrap.min.css'));
    }
    const customCss = path.join(bootstrapDir, 'custom.css');
    if (await fs.stat(customCss).then(() => true).catch(() => false)) {
      await fs.copyFile(customCss, path.join(buildDir, 'custom.css'));
    }
  } else {
    const fallback = path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css');
    if (await fs.stat(fallback).then(() => true).catch(() => false)) {
      await fs.copyFile(fallback, path.join(buildDir, 'bootstrap.min.css'));
    }
  }
}

async function buildAll() {
  await ensureBuildDir();
  await buildTitlePage();
  await buildTOCPage();
  await buildContentPages();
  await buildTrackListPages();
  await copyAssets();
  await fs.writeFile(
    path.join(buildDir, 'nav-index.json'),
    JSON.stringify(navIndex, null, 2),
    'utf-8'
  );
  console.log('✅ nav-index.json written');
  console.log('✅ Build complete!');
}

buildAll();
