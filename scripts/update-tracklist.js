// scripts/update-tracklist.js
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

// ESM replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const README_PATH = path.resolve(__dirname, '../README.md');
const START_TAG = '<!-- BEGIN FULL TRACKLIST -->';
const END_TAG = '<!-- END FULL TRACKLIST -->';

async function getTrackLists() {
  const files = await glob('./binder/**/track-list-*.md');

  const contentBlocks = await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath, '.md');
      const folder = path.basename(path.dirname(filePath));
      const header = `### ${filename.replace('track-list-', 'Tracklist ')} (${folder})`;
      return `${header}\n\n${raw.trim()}`;
    })
  );

  return contentBlocks.join('\n\n---\n\n');
}

async function injectTrackListsIntoReadme() {
  const readme = await fs.readFile(README_PATH, 'utf-8');
  const newTrackSection = `${START_TAG}\n\n${await getTrackLists()}\n\n${END_TAG}`;

  const updated = readme.includes(START_TAG)
    ? readme.replace(
        new RegExp(`${START_TAG}[\\s\\S]*?${END_TAG}`),
        newTrackSection
      )
    : `${readme.trim()}\n\n## Full Track Listing\n\n${newTrackSection}`;

  await fs.writeFile(README_PATH, updated);
  console.log('✅ Tracklist injected into README.md');
}

injectTrackListsIntoReadme();
