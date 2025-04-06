import path from 'path';
import fs from 'fs/promises';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';
import { splitMarkdownSections } from '../utils/splitMarkdownSections.js';

export async function buildContentPages({ binderDir, buildDir, contentTemplate, navIndex, songPages }) {
  console.log('Building content pages...');

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
