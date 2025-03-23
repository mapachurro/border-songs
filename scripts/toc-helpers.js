// scripts/toc-helpers.js
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export async function getTrackLists(markdownLinkStyle = false) {
  const files = (await glob('./binder/**/track-list-*.md')).sort((a, b) => {
    const aNum = parseInt(path.basename(a).match(/track-list-(\d+)/)?.[1] || 0, 10);
    const bNum = parseInt(path.basename(b).match(/track-list-(\d+)/)?.[1] || 0, 10);
    return aNum - bNum;
  });

  const contentBlocks = await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath, '.md');
      const folder = path.basename(path.dirname(filePath));

      const headerText = `Tracklist ${filename.replace('track-list-', '')} – ${folder}`;
      const linkPath = `./${folder}/${filename}.html`;

      const summaryLine = markdownLinkStyle
        ? `<summary><strong><a href="${linkPath}">${headerText}</a></strong></summary>`
        : `<summary><strong>${headerText}</strong></summary>`;

      return `<details>\n${summaryLine}\n\n${raw.trim()}\n</details>`;
    })
  );

  return contentBlocks.join('\n\n');
}

export async function getOrderedSongPages() {
  const files = (await glob('./binder/**/track-list-*.md')).sort((a, b) => {
    const aNum = parseInt(path.basename(a).match(/track-list-(\d+)/)?.[1] || 0, 10);
    const bNum = parseInt(path.basename(b).match(/track-list-(\d+)/)?.[1] || 0, 10);
    return aNum - bNum;
  });

  const songPages = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const folder = path.basename(path.dirname(filePath));
    const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);

    const mdFiles = (await fs.readdir(path.join('binder', folder)))
      .filter(f => f.endsWith('.md') && !f.startsWith('track-list'));

    for (const line of lines) {
      if (!line.startsWith('-')) continue;
      const title = line.replace(/^[-*\s]+/, '').trim();

      // Try to match a real .md file that contains words from title
      const match = mdFiles.find(md =>
        md.toLowerCase().includes(
          title.toLowerCase().split(' ')[0] // match by first word
        )
      );

      if (match) {
        const filename = match.replace('.md', '.html');
        songPages.push({
          title,
          folder,
          filename,
          outputPath: `${folder}/${filename}`
        });
      }
    }
  }

  return songPages;
}