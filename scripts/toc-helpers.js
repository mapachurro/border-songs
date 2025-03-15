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
      const header = markdownLinkStyle
        ? `### [Tracklist ${filename.replace('track-list-', '')} – ${folder}](./${folder}/${filename}.html)`
        : `#### Tracklist ${filename.replace('track-list-', '')} ([${folder}](./binder/${folder}))`;
      return `${header}\n\n${raw.trim()}`;
    })
  );

  return contentBlocks.join('\n\n---\n\n');
}
