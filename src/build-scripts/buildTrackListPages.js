import path from 'path';
import fs from 'fs/promises';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';
import { formatSectionTitle } from '../utils/formatSectionTitle.js';

// Optional helper if you're not importing a lib
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

export async function buildTrackListPages({ binderDir, buildDir, tocTemplate, navIndex, songPages }) {
  const folders = await fs.readdir(binderDir);
  for (const folder of folders) {
    const sectionPath = path.join(binderDir, folder);
    const stat = await fs.stat(sectionPath);
    if (!stat.isDirectory()) continue;

    const files = (await fs.readdir(sectionPath))
      .filter(f => f.startsWith('track-list') && f.endsWith('.md'));

      const songsInSection = songPages.filter(song => song.folder === folder);

      const songMap = Object.fromEntries(
        songsInSection.map(song => [
          song.filename.replace('.html', ''),
          song.filename
        ])
      );  

    for (const file of files) {
      const trackListPath = path.join(sectionPath, file);
      const raw = await fs.readFile(trackListPath, 'utf-8');

      // Rewrite song lines to embed links
      const lines = raw.split('\n').map(line => {
        const match = line.match(/^(\d{2}) - (.+)$/);
        if (!match) return line;

        const number = match[1];
        const text = match[2].trim();
        const slug = `${number}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
        const htmlFile = songMap[slug];
        if (!htmlFile) return line;

        return `<p><a href="./${htmlFile}">${escapeHtml(line)}</a></p>`;
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
      navIndex.push(outputPath);
    }
  }
}
