import path from 'path';
import fs from 'fs/promises';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';
import { formatSectionTitle } from '../utils/formatSectionTitle.js';
import { createSongLinks } from '../utils/createSongLinks.js';

// Optional helper if you're not importing a lib
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

export async function buildTrackListPages({ binderDir, buildDir, tocTemplate, navIndex, songPages }) {
  try {
    console.log("Building track list pages...");
    const folders = await fs.readdir(binderDir);
    
    for (const folder of folders) {
      const sectionPath = path.join(binderDir, folder);
      const stat = await fs.stat(sectionPath);
      if (!stat.isDirectory()) continue;
      
      console.log(`Processing track lists in section: ${folder}`);
      const files = (await fs.readdir(sectionPath))
        .filter(f => f.startsWith('track-list') && f.endsWith('.md'));
      
      if (files.length === 0) {
        console.log(`No track list files found in section: ${folder}`);
        continue;
      }
      
      const songsInSection = songPages.filter(song => song.folder === folder);
      console.log(`Found ${songsInSection.length} songs in section: ${folder}`);
      
      const songMap = Object.fromEntries(
        songsInSection.map(song => [
          song.filename.replace('.html', ''),
          song.filename
        ])
      );
      
      for (const file of files) {
        const trackListPath = path.join(sectionPath, file);
        console.log(`Processing track list: ${trackListPath}`);
        const raw = await fs.readFile(trackListPath, 'utf-8');
        
        // Rewrite song lines to embed links
        const lines = raw.split('\n').map(line => {
          // Use the shared utility to create links
          const linkedLine = createSongLinks({
            text: line,
            songMap,
            currentPath: `${folder}/${file.replace('.md', '.html')}`
          });
          
          // If the line was linked, return it as is (already HTML)
          if (linkedLine !== line) {
            return linkedLine;
          }
          
          // Otherwise, return the original line
          return line;
        }).join('\n');
        
        const outputFilename = file.replace('.md', '.html');
        const outputPath = `${folder}/${outputFilename}`;
        const trackListHtml = await renderTemplate(tocTemplate, {
          ASSET_PATH: '../',
          TOC_CONTENT: marked.parse(lines),
          PREV_BUTTON: '',
          NEXT_BUTTON: '',
        });
        
        const outputDir = path.join(buildDir, folder);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(path.join(outputDir, outputFilename), trackListHtml);
        console.log(`Created track list page: ${outputPath}`);
        navIndex.push(outputPath);
      }
    }
    
    console.log("Finished building track list pages");
  } catch (error) {
    console.error(`Error building track list pages: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
}
