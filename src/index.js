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
  let template = await fs.readFile(templatePath, 'utf-8');
  
  // Handle conditional sections
  for (const key in replacements) {
    if (key.startsWith('#')) {
      const actualKey = key.substring(1);
      const value = replacements[key];
      
      // If value exists, replace the conditional section with its content
      if (value) {
        template = template.replace(
          new RegExp(`{{#${actualKey}}}(.*?){{/${actualKey}}}`, 's'),
          (_, content) => content.replace(`{{${actualKey}}}`, value)
        );
      } else {
        // If value doesn't exist, remove the conditional section
        template = template.replace(
          new RegExp(`{{#${actualKey}}}.*?{{/${actualKey}}}`, 's'),
          ''
        );
      }
    }
  }
  
  // Replace regular placeholders
  return Object.entries(replacements)
    .filter(([key]) => !key.startsWith('#'))
    .reduce(
      (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
      template
    );
}

function splitMarkdownSections(markdown) {
  console.log('Splitting markdown sections...');
  
  const sections = {
    title: '',
    authority: '',
    videoSource: '',
    source: '',
    target: '',
    commentary: '',
    notes: '',
    versions: ''
  };

  // Log the first 100 characters to debug
  console.log('Markdown preview:', markdown.substring(0, 100) + '...');
  
  const lines = markdown.split('\n');
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for section headers
    if (line.startsWith('# Title:')) {
      sections.title = line.replace('# Title:', '').trim();
      console.log('Found title:', sections.title);
      continue;
    }
    
    if (line.startsWith('# Authority:')) {
      sections.authority = line.replace('# Authority:', '').trim();
      console.log('Found authority:', sections.authority);
      continue;
    }
    
    if (line.startsWith('# Video source:')) {
      sections.videoSource = line.replace('# Video source:', '').trim();
      console.log('Found video source:', sections.videoSource);
      continue;
    }
    
    if (line.startsWith('# Source')) {
      currentSection = 'source';
      console.log('Starting source section');
      continue;
    }
    
    if (line.startsWith('# Target')) {
      currentSection = 'target';
      console.log('Starting target section');
      continue;
    }
    
    if (line.startsWith('# Commentary')) {
      currentSection = 'commentary';
      console.log('Starting commentary section');
      continue;
    }
    
    if (line.startsWith('# Notes')) {
      currentSection = 'notes';
      console.log('Starting notes section');
      continue;
    }
    
    if (line.startsWith('# Versions')) {
      currentSection = 'versions';
      console.log('Starting versions section');
      continue;
    }
    
    // Add content to the current section
    if (currentSection && sections[currentSection] !== undefined) {
      sections[currentSection] += line + '\n';
    }
  }
  
  // Trim whitespace from all sections
  for (const key in sections) {
    if (typeof sections[key] === 'string') {
      sections[key] = sections[key].trim();
    }
  }
  
  // Log section lengths to debug
  console.log('Section lengths:', {
    title: sections.title.length,
    authority: sections.authority.length,
    videoSource: sections.videoSource.length,
    source: sections.source.length,
    target: sections.target.length,
    commentary: sections.commentary.length,
    notes: sections.notes.length,
    versions: sections.versions.length
  });
  
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
      .filter(f => f.endsWith('.md') && !f.startsWith('track-list') && !f.startsWith('introduction') && /^\d+-/.test(f))
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
  console.log('Building content pages...');
  const songPages = await getOrderedSongPagesFromFilenames();
  for (let i = 0; i < songPages.length; i++) {
    try {
      const { folder, filename, outputPath, title, mdFile } = songPages[i];
      console.log(`Building content page: ${outputPath}`);
      
      const raw = await fs.readFile(mdFile, 'utf-8');
      console.log(`Read ${raw.length} bytes from ${mdFile}`);
      
      const sections = splitMarkdownSections(raw);
      
      // Check if sections are empty and log warning
      if (!sections.source || !sections.target) {
        console.warn(`Warning: Empty source or target section in ${mdFile}`);
      }
      
      // Process video source if available
      let videoEmbed = '';
      if (sections.videoSource) {
        console.log(`Processing video source: ${sections.videoSource}`);
        
        // Extract YouTube video ID
        let videoId = '';
        if (sections.videoSource.includes('youtube.com')) {
          const url = new URL(sections.videoSource);
          videoId = url.searchParams.get('v');
        } else if (sections.videoSource.includes('youtu.be')) {
          videoId = sections.videoSource.split('/').pop();
        }
        
        if (videoId) {
          videoEmbed = `<iframe src="https://www.youtube.com/embed/${videoId}" title="${sections.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          console.log(`Created video embed for ID: ${videoId}`);
        } else {
          console.warn(`Could not extract YouTube video ID from: ${sections.videoSource}`);
        }
      }
      
      const outputHtml = await renderTemplate(contentTemplate, {
        ASSET_PATH: '../',
        TITLE: sections.title || title,
        SONG_TITLE: sections.title || title,
        '#AUTHORITY': sections.authority,
        '#VIDEO_EMBED': videoEmbed,
        TRANSLATION_HTML: sections.target ? marked.parse(sections.target) : '<p>Translation content missing</p>',
        SOURCE_HTML: sections.source ? marked.parse(sections.source) : '<p>Source content missing</p>',
        COMMENTARY_HTML: marked.parse((sections.commentary || '') + '\n\n' + (sections.notes || '')),
        PREV_BUTTON: '',
        NEXT_BUTTON: '',
      });
      
      const outputDir = path.join(buildDir, folder);
      await fs.mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, filename);
      await fs.writeFile(filePath, outputHtml);
      navIndex.push(`${folder}/${filename}`);
      console.log(`✅ Built content page: ${outputPath}`);
    } catch (error) {
      console.error(`Error building content page ${songPages[i]?.outputPath || 'unknown'}:`, error);
    }
  }
  console.log('✅ All content pages built successfully');
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
  try {
    console.log('Copying assets...');
    
    // Copy CSS
    try {
      await fs.copyFile(
        path.resolve(__dirname, 'styles.css'),
        path.join(buildDir, 'styles.css')
      );
      console.log('✅ Copied styles.css');
    } catch (error) {
      console.error('Error copying styles.css:', error);
    }
    
    // Copy Bootstrap from the correct location
    try {
      const bootstrapPath = path.resolve(__dirname, 'bootstrap', 'bootstrap.min.css');
      await fs.copyFile(
        bootstrapPath,
        path.join(buildDir, 'bootstrap.min.css')
      );
      console.log('✅ Copied bootstrap.min.css');
    } catch (error) {
      console.error('Error copying bootstrap.min.css:', error);
    }
    
    // Copy JavaScript files
    const jsDir = path.join(buildDir, 'js');
    await fs.mkdir(jsDir, { recursive: true });
    console.log(`Created JS directory: ${jsDir}`);
    
    // Get all JS files from the source directory
    const srcJsDir = path.resolve(__dirname, 'js');
    try {
      const jsFiles = await fs.readdir(srcJsDir);
      console.log(`Found ${jsFiles.length} JS files to copy`);
      
      for (const file of jsFiles) {
        const srcPath = path.join(srcJsDir, file);
        const destPath = path.join(jsDir, file);
        
        // Check if it's a file (not a directory)
        const stat = await fs.stat(srcPath);
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath);
          console.log(`Copied JS file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error copying JS files:', error);
    }
    
    // Copy images directory
    const srcImgDir = path.resolve(__dirname, 'img');
    const buildImgDir = path.join(buildDir, 'img');
    
    try {
      // Check if source img directory exists
      await fs.access(srcImgDir);
      console.log(`Found image directory: ${srcImgDir}`);
      
      // Create destination img directory
      await fs.mkdir(buildImgDir, { recursive: true });
      console.log(`Created image directory: ${buildImgDir}`);
      
      // Get all files in the img directory
      const imgFiles = await fs.readdir(srcImgDir);
      console.log(`Found ${imgFiles.length} image files to copy`);
      
      // Copy each file
      for (const file of imgFiles) {
        const srcPath = path.join(srcImgDir, file);
        const destPath = path.join(buildImgDir, file);
        
        // Check if it's a file (not a directory)
        const stat = await fs.stat(srcPath);
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath);
          console.log(`Copied image: ${file}`);
        }
      }
      
      console.log('✅ Images copied successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`No img directory found at ${srcImgDir}, skipping image copy`);
      } else {
        console.error('Error copying images:', error);
      }
    }
    
    console.log('✅ All assets copied successfully');
  } catch (error) {
    console.error('Error in copyAssets function:', error);
  }
}

async function buildIntroductionPage() {
  try {
    console.log('Building introduction page...');
    const introMd = await fs.readFile(path.join(binderDir, 'introduction.md'), 'utf-8');
    
    // Don't use splitMarkdownSections here since the introduction format is different
    const introHtml = await renderTemplate(path.resolve(__dirname, 'intro-template.html'), {
      ASSET_PATH: '',
      TITLE: 'Introduction',
      CONTENT: marked.parse(introMd),
      PREV_BUTTON: '',
      NEXT_BUTTON: '',
    });
    
    await fs.writeFile(path.join(buildDir, 'introduction.html'), introHtml);
    console.log('✅ Introduction page built successfully');
    
    // Add to navigation index in the correct position (after TOC)
    const tocIndex = navIndex.indexOf('toc.html');
    if (tocIndex !== -1) {
      navIndex.splice(tocIndex + 1, 0, 'introduction.html');
    } else {
      navIndex.push('introduction.html');
    }
  } catch (error) {
    console.error('Error building introduction page:', error);
  }
}

async function buildSectionIntroductions() {
  try {
    console.log('Building section introduction pages...');
    const folders = await fs.readdir(binderDir);
    
    for (const folder of folders) {
      const sectionPath = path.join(binderDir, folder);
      const stat = await fs.stat(sectionPath);
      if (!stat.isDirectory()) continue;
      
      // Look for introduction file in this section
      const introPath = path.join(sectionPath, 'introduction.md');
      try {
        const introExists = await fs.stat(introPath).then(() => true).catch(() => false);
        if (!introExists) continue;
        
        console.log(`Building introduction for section ${folder}...`);
        const introMd = await fs.readFile(introPath, 'utf-8');
        
        // Use the intro-template.html instead of contentTemplate
        const introHtml = await renderTemplate(path.resolve(__dirname, 'intro-template.html'), {
          ASSET_PATH: '../',
          TITLE: `Introduction - ${formatSectionTitle(folder)}`,
          CONTENT: marked.parse(introMd),
          PREV_BUTTON: '',
          NEXT_BUTTON: '',
        });
        
        const outputDir = path.join(buildDir, folder);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(path.join(outputDir, 'introduction.html'), introHtml);
        
        console.log(`✅ Introduction for ${folder} built successfully`);
        
        // Add to navigation index (will be sorted later)
        navIndex.push(`${folder}/introduction.html`);
      } catch (error) {
        console.error(`Error building introduction for section ${folder}:`, error);
      }
    }
  } catch (error) {
    console.error('Error building section introductions:', error);
  }
}

async function generateSectionData() {
  try {
    console.log('Generating section data...');
    
    // Get all track lists and song pages
    const songPages = await getOrderedSongPages();
    
    // Group pages by section
    const sections = {};
    
    for (const page of songPages) {
      const sectionId = page.folder;
      
      if (!sections[sectionId]) {
        // Create new section
        sections[sectionId] = {
          id: sectionId,
          title: formatSectionTitle(sectionId),
          pages: []
        };
        
        // Add track list page as first page
        sections[sectionId].pages.push({
          title: "Track List",
          path: `${sectionId}/track-list-${sectionId.match(/\d+/)[0]}.html`
        });
        
        // Add introduction page as second page
        sections[sectionId].pages.push({
          title: "Introduction",
          path: `${sectionId}/introduction.html`
        });
      }
      
      // Add the page to the section
      sections[sectionId].pages.push({
        title: page.title,
        path: `${sectionId}/${page.filename}`
      });
    }
    
    // Write the section data to a JSON file
    await fs.writeFile(
      path.join(buildDir, 'section-data.json'),
      JSON.stringify(sections, null, 2),
      'utf-8'
    );
    
    console.log('✅ section-data.json written');
  } catch (error) {
    console.error('Error generating section data:', error);
  }
}

function formatSectionTitle(sectionId) {
  const sectionMap = {
    '01-reach-the-pass': 'Side 1: Reach the Pass',
    '02-behold-the-valley-beyond': 'Side 2: Behold the Valley Beyond',
    '03-alcanzar-la-ribera': 'Side 3: Alcanzar la Ribera',
    '04-desde-la-otra-costa': 'Side 4: Desde la Otra Costa'
  };
  
  return sectionMap[sectionId] || sectionId;
}

async function buildAll() {
  await ensureBuildDir();
  // Clear the navigation index before building
  navIndex.length = 0;
  
  await buildTitlePage();
  await buildTOCPage();
  await buildIntroductionPage();
  await buildContentPages();
  await buildSectionIntroductions();
  await buildTrackListPages();
  await copyAssets();
  
  // Sort the navigation index to ensure proper order
  navIndex.sort((a, b) => {
    // Special handling for key pages at the root level
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    if (a === 'toc.html') return b === 'index.html' ? 1 : -1;
    if (b === 'toc.html') return a === 'index.html' ? -1 : 1;
    if (a === 'introduction.html') return (b === 'index.html' || b === 'toc.html') ? 1 : -1;
    if (b === 'introduction.html') return (a === 'index.html' || a === 'toc.html') ? -1 : 1;
    
    // Get section IDs for both paths
    const aSection = a.split('/')[0];
    const bSection = b.split('/')[0];
    
    // If they're in different sections, sort by section ID
    if (aSection !== bSection) {
      return aSection.localeCompare(bSection);
    }
    
    // If they're in the same section, handle special ordering
    const aFile = a.split('/')[1];
    const bFile = b.split('/')[1];
    
    // Track list should come first in each section
    if (aFile.startsWith('track-list')) return -1;
    if (bFile.startsWith('track-list')) return 1;
    
    // Introduction should come second
    if (aFile.startsWith('introduction')) return -1;
    if (bFile.startsWith('introduction')) return 1;
    
    // For other files, sort numerically by the prefix
    const aNum = parseInt(aFile.match(/^(\d+)-/) ? aFile.match(/^(\d+)-/)[1] : '999', 10);
    const bNum = parseInt(bFile.match(/^(\d+)-/) ? bFile.match(/^(\d+)-/)[1] : '999', 10);
    
    return aNum - bNum;
  });
  
  await fs.writeFile(
    path.join(buildDir, 'nav-index.json'),
    JSON.stringify(navIndex, null, 2),
    'utf-8'
  );
  console.log('✅ nav-index.json written');
  
  // Generate section data
  await generateSectionData();
  
  console.log('✅ Build complete!');
}

buildAll();
