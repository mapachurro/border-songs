import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';
import { getTrackLists } from '../../scripts/toc-helpers.js';
import { createSongLinks } from '../utils/createSongLinks.js';

export async function buildTOCPage({ buildDir, tocTemplate, navIndex, songPages }) {
  try {
    console.log("Building TOC page...");
    
    // Get the raw TOC markdown
    const tocMd = await getTrackLists(true);
    
    // Create a song map for the entire book
    const songMap = Object.fromEntries(
      songPages.map(song => [
        song.filename.replace('.html', ''),
        `${song.folder}/${song.filename}`
      ])
    );
    
    console.log(`Created song map with ${Object.keys(songMap).length} entries for TOC`);
    
    // Process each line to add links
    const lines = tocMd.split('\n').map(line => {
      // Use the shared utility to create links
      const linkedLine = createSongLinks({
        text: line,
        songMap,
        currentPath: 'toc.html'  // TOC is in the root directory
      });
      
      // If the line was linked, return it as is (already HTML)
      if (linkedLine !== line) {
        return linkedLine;
      }
      
      // Otherwise, return the original line
      return line;
    }).join('\n');
    
    // Render the TOC template with the processed content
    const tocHtml = await renderTemplate(tocTemplate, {
      ASSET_PATH: '',
      TOC_CONTENT: marked.parse(lines),
      PREV_BUTTON: '',
      NEXT_BUTTON: '',
    });
    
    // Write the TOC file
    await fs.writeFile(path.join(buildDir, 'toc.html'), tocHtml);
    console.log("Created TOC page: toc.html");
    
    navIndex.push('toc.html');
  } catch (error) {
    console.error(`Error building TOC page: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
}
