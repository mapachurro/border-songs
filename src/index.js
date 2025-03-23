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

async function getOrderedSongPagesFromFilenames() {
  const songPages = [];

  const folders = await fs.readdir(binderDir);
  for (const folder of folders) {
    const sectionPath = path.join(binderDir, folder);
    const stat = await fs.stat(sectionPath);
    if (!stat.isDirectory()) continue;

    const files = (await fs.readdir(sectionPath))
      .filter(f => f.endsWith('.md') && !f.startsWith('track-list') && /^\d+-/.test(f))
      .sort(); // ensures 01-foo.md, 02-bar.md, etc.

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

    const prevLink = i > 0 ? `/${songPages[i - 1].outputPath}` : '';
    const nextLink = i < songPages.length - 1 ? `/${songPages[i + 1].outputPath}` : '';
    
    console.log(`Building page ${i+1}/${songPages.length}: ${outputPath}`);
    console.log(`  Prev link: ${prevLink || 'none'}`);
    console.log(`  Next link: ${nextLink || 'none'}`);

    const outputHtml = await renderTemplate(contentTemplate, {
      ASSET_PATH: '../',
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
  
  const nextLink = '/toc.html';
  
  console.log(`Building title page`);
  console.log(`  Next link: ${nextLink}`);
  
  const titleHtml = await renderTemplate(titleTemplate, {
    ASSET_PATH: '',
    TITLE_CONTENT: marked.parse(titleMd),
    PREV_BUTTON: '',
    NEXT_BUTTON: `<a class="btn btn-outline-secondary" href="${nextLink}" data-next="${nextLink}">Next →</a>`,
  });
  await fs.writeFile(path.join(buildDir, 'index.html'), titleHtml);
}

async function buildTOCPage() {
  const tocMd = await getTrackLists(true); // markdownLinkStyle = true
  
  const songPages = await getOrderedSongPagesFromFilenames();
  const nextLink = songPages.length > 0 ? `/${songPages[0].outputPath}` : '';
  
  console.log(`Building TOC page`);
  console.log(`  Prev link: /index.html`);
  console.log(`  Next link: ${nextLink || 'none'}`);
  
  const tocHtml = await renderTemplate(tocTemplate, {
    ASSET_PATH: '',
    TOC_CONTENT: marked.parse(tocMd),
    PREV_BUTTON: '<a class="btn btn-outline-secondary" href="/index.html" data-prev="/index.html">← Title Page</a>',
    NEXT_BUTTON: nextLink ? `<a class="btn btn-outline-secondary" href="${nextLink}" data-next="${nextLink}">Next →</a>` : '',
  });
  await fs.writeFile(path.join(buildDir, 'toc.html'), tocHtml);
}

async function buildTrackListPages() {
  try {
    console.log('Building track list pages...');
    
    const folders = await fs.readdir(binderDir);
    for (const folder of folders) {
      const sectionPath = path.join(binderDir, folder);
      const stat = await fs.stat(sectionPath);
      if (!stat.isDirectory()) continue;
      
      // Look for track-list files in each section folder
      const files = (await fs.readdir(sectionPath))
        .filter(f => f.startsWith('track-list') && f.endsWith('.md'));
      
      for (const file of files) {
        const trackListPath = path.join(sectionPath, file);
        const trackListContent = await fs.readFile(trackListPath, 'utf-8');
        const outputFilename = file.replace('.md', '.html');
        const outputPath = `${folder}/${outputFilename}`;
        
        console.log(`  Building track list page: ${outputPath}`);
        
        // Get the first song in this section for the "Next" button
        const songsInSection = (await fs.readdir(sectionPath))
          .filter(f => f.endsWith('.md') && !f.startsWith('track-list') && /^\d+-/.test(f))
          .sort();
        
        const nextLink = songsInSection.length > 0 
          ? `/${folder}/${songsInSection[0].replace('.md', '.html')}` 
          : '';
        
        // For "Prev" button, link back to main TOC
        const prevLink = '/toc.html';
        
        console.log(`    Prev link: ${prevLink}`);
        console.log(`    Next link: ${nextLink || 'none'}`);
        
        // Use a simplified template for track list pages
        const trackListHtml = await renderTemplate(tocTemplate, {
          ASSET_PATH: '../',
          TOC_CONTENT: marked.parse(trackListContent),
          PREV_BUTTON: `<a class="btn btn-outline-secondary" href="${prevLink}" data-prev="${prevLink}">← Back to TOC</a>`,
          NEXT_BUTTON: nextLink ? `<a class="btn btn-outline-secondary" href="${nextLink}" data-next="${nextLink}">Next →</a>` : '',
        });        
        
        const outputDir = path.join(buildDir, folder);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(path.join(outputDir, outputFilename), trackListHtml);
      }
    }
    
    console.log('✅ Track list pages built successfully');
  } catch (error) {
    console.error('Error building track list pages:', error);
  }
}

async function copyAssets() {
  try {
    console.log('Copying assets to build directory...');
    
    // Create js directory if it doesn't exist
    await fs.mkdir(path.join(buildDir, 'js'), { recursive: true });
    
    // Copy JS frontend scripts to build
    const jsFiles = await fs.readdir(path.join(__dirname, 'js'));
    for (const file of jsFiles) {
      console.log(`  Copying JS file: ${file}`);
      await fs.copyFile(
        path.join(__dirname, 'js', file), 
        path.join(buildDir, 'js', file)
      );
    }
    
    // Copy CSS assets to build
    console.log('  Copying styles.css');
    await fs.copyFile(path.join(__dirname, 'styles.css'), path.join(buildDir, 'styles.css'));
    
    // Copy Bootstrap files
    const bootstrapDir = path.join(__dirname, 'bootstrap');
    if (await fs.stat(bootstrapDir).then(() => true).catch(() => false)) {
      console.log('  Copying Bootstrap files');
      
      // Copy bootstrap.min.css
      const bootstrapMinCss = path.join(bootstrapDir, 'bootstrap.min.css');
      if (await fs.stat(bootstrapMinCss).then(() => true).catch(() => false)) {
        console.log('    Copying bootstrap.min.css');
        await fs.copyFile(bootstrapMinCss, path.join(buildDir, 'bootstrap.min.css'));
      } else {
        console.error('    bootstrap.min.css not found in bootstrap directory');
      }
      
      // Copy custom.css if it exists
      const customCss = path.join(bootstrapDir, 'custom.css');
      if (await fs.stat(customCss).then(() => true).catch(() => false)) {
        console.log('    Copying custom.css');
        await fs.copyFile(customCss, path.join(buildDir, 'custom.css'));
      }
    } else {
      console.error('  Bootstrap directory not found at:', bootstrapDir);
      
      // Fallback: Try to find bootstrap files in node_modules
      const nodeModulesBootstrap = path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css');
      if (await fs.stat(nodeModulesBootstrap).then(() => true).catch(() => false)) {
        console.log('  Using bootstrap from node_modules');
        await fs.copyFile(nodeModulesBootstrap, path.join(buildDir, 'bootstrap.min.css'));
      } else {
        console.error('  Bootstrap not found in node_modules either. Please install bootstrap or provide the CSS files.');
      }
    }
    
    console.log('✅ Assets copied successfully');
  } catch (error) {
    console.error('Error copying assets:', error);
  }
}

async function buildAll() {
  await ensureBuildDir();
  await buildContentPages();
  await buildTitlePage();
  await buildTOCPage();
  await buildTrackListPages();
  await copyAssets();
  console.log('✅ Build complete!');
}

buildAll();
