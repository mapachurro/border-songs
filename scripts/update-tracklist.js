// scripts/update-tracklist.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTrackLists } from './toc-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const README_PATH = path.resolve(__dirname, '../README.md');
const START_TAG = '<!-- BEGIN FULL TRACKLIST -->';
const END_TAG = '<!-- END FULL TRACKLIST -->';

async function injectTrackListsIntoReadme() {
  const readme = await fs.readFile(README_PATH, 'utf-8');
  const newTrackSection = `${START_TAG}\n\n### Full track listing\n\n${await getTrackLists()}\n\n${END_TAG}`;

  const updated = readme.includes(START_TAG)
    ? readme.replace(
        new RegExp(`${START_TAG}[\\s\\S]*?${END_TAG}`),
        newTrackSection
      )
    : `${readme.trim()}\n\n${newTrackSection}`;

  await fs.writeFile(README_PATH, updated);
  console.log('✅ Tracklist injected into README.md');
}

injectTrackListsIntoReadme();
