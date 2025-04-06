import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { renderTemplate } from '../utils/renderTemplate.js';
import { getTrackLists } from '../../scripts/toc-helpers.js';

export async function buildTOCPage({ buildDir, tocTemplate, navIndex }) {
  const tocMd = await getTrackLists(true);
  const tocHtml = await renderTemplate(tocTemplate, {
    ASSET_PATH: '',
    TOC_CONTENT: marked.parse(tocMd),
    PREV_BUTTON: '',
    NEXT_BUTTON: '',
  });
  await fs.writeFile(path.join(buildDir, 'toc.html'), tocHtml);
  navIndex.push('toc.html');
}
