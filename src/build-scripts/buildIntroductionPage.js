import path from 'path';
import fs from 'fs/promises';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';

export async function buildIntroductionPage({ binderDir, buildDir, navIndex, introTemplate }) {
  const introPath = path.join(binderDir, 'introduction.md');
  const introMd = await fs.readFile(introPath, 'utf-8');

  const introHtml = await renderTemplate(introTemplate, {
    ASSET_PATH: '',
    TITLE: 'Introduction',
    CONTENT: marked.parse(introMd),
    PREV_BUTTON: '',
    NEXT_BUTTON: '',
  });

  const outputPath = path.join(buildDir, 'introduction.html');
  await fs.writeFile(outputPath, introHtml);

  const tocIndex = navIndex.indexOf('toc.html');
  if (tocIndex !== -1) {
    navIndex.splice(tocIndex + 1, 0, 'introduction.html');
  } else {
    navIndex.push('introduction.html');
  }
}
