import path from 'path';
import fs from 'fs/promises';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';
import { formatSectionTitle } from '../utils/formatSectionTitle.js';

export async function buildSectionIntroductions({ binderDir, buildDir, introTemplate, navIndex }) {
  const folders = await fs.readdir(binderDir);

  for (const folder of folders) {
    const sectionPath = path.join(binderDir, folder);
    const stat = await fs.stat(sectionPath);
    if (!stat.isDirectory()) continue;

    const introPath = path.join(sectionPath, 'introduction.md');
    const exists = await fs.stat(introPath).then(() => true).catch(() => false);
    if (!exists) continue;

    const introMd = await fs.readFile(introPath, 'utf-8');
    const introHtml = await renderTemplate(introTemplate, {
      ASSET_PATH: '../',
      TITLE: `Introduction - ${formatSectionTitle(folder)}`,
      CONTENT: marked.parse(introMd),
      PREV_BUTTON: '',
      NEXT_BUTTON: '',
    });

    const outputDir = path.join(buildDir, folder);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'introduction.html'), introHtml);
    navIndex.push(`${folder}/introduction.html`);
  }
}
