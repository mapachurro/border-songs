import path from 'path';
import fs from 'fs/promises';

export async function getOrderedSongPagesFromFilenames(binderDir) {
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
