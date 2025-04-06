import path from 'path';
import fs from 'fs/promises';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';

export async function buildTitlePage({ binderDir, buildDir, titleTemplate, navIndex }) {
  const titleMdPath = path.join(binderDir, 'title-page.md');
  const titleMd = await fs.readFile(titleMdPath, 'utf-8');

  const titleHtml = await renderTemplate(titleTemplate, {
    ASSET_PATH: '',
    TITLE_CONTENT: marked.parse(titleMd),
    PREV_BUTTON: '',
    NEXT_BUTTON: '',
  });

  const outputPath = path.join(buildDir, 'index.html');
  await fs.writeFile(outputPath, titleHtml);
  navIndex.unshift('index.html');
}
