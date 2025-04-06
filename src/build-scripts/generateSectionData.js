import path from 'path';
import fs from 'fs/promises';
import { getOrderedSongPages } from '../../scripts/toc-helpers.js';
import { formatSectionTitle } from '../utils/formatSectionTitle.js';

export async function generateSectionData({ buildDir }) {
  const songPages = await getOrderedSongPages();
  const sections = {};

  for (const page of songPages) {
    const sectionId = page.folder;

    if (!sections[sectionId]) {
      sections[sectionId] = {
        id: sectionId,
        title: formatSectionTitle(sectionId),
        pages: [
          { title: 'Track List', path: `${sectionId}/track-list-${sectionId.match(/\d+/)[0]}.html` },
          { title: 'Introduction', path: `${sectionId}/introduction.html` }
        ]
      };
    }

    sections[sectionId].pages.push({
      title: page.title,
      path: `${sectionId}/${page.filename}`
    });
  }

  await fs.writeFile(
    path.join(buildDir, 'section-data.json'),
    JSON.stringify(sections, null, 2),
    'utf-8'
  );
}
