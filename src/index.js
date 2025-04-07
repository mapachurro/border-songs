import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { orderNavigationItems, logNavigationOrder } from './utils/orderNavigationItems.js';

async function ensureBuildDir(buildDir) {
  await fs.mkdir(buildDir, { recursive: true });
}


import { buildTitlePage } from './build-scripts/buildTitlePage.js';
import { buildTOCPage } from './build-scripts/buildTOCPage.js';
import { buildContentPages } from './build-scripts/buildContentPages.js';
import { buildSectionIntroductions } from './build-scripts/buildSectionIntroductions.js';
import { buildIntroductionPage } from './build-scripts/buildIntroductionPage.js';
import { buildTrackListPages } from './build-scripts/buildTrackListPages.js';
import { copyAssets } from './build-scripts/copyAssets.js';
import { generateSectionData } from './build-scripts/generateSectionData.js';
import { getOrderedSongPagesFromFilenames } from './utils/getOrderedSongPages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const binderDir = path.resolve(__dirname, '../binder');
const buildDir = path.resolve(__dirname, '../build');

const titleTemplate = path.resolve(__dirname, 'title-template.html');
const tocTemplate = path.resolve(__dirname, 'toc-template.html');
const contentTemplate = path.resolve(__dirname, 'template.html');
const introTemplate = path.resolve(__dirname, 'intro-template.html');

const navIndex = [];

async function buildAll() {
  await ensureBuildDir(buildDir);

  const songPages = await getOrderedSongPagesFromFilenames(binderDir);

  await buildTitlePage({ binderDir, buildDir, titleTemplate, navIndex });
  await buildTOCPage({ buildDir, tocTemplate, navIndex });
  await buildIntroductionPage({ binderDir, buildDir, navIndex, introTemplate });

  await buildContentPages({ binderDir, buildDir, contentTemplate, navIndex, songPages });

  await buildSectionIntroductions({ binderDir, buildDir, introTemplate, navIndex });
  await buildTrackListPages({ binderDir, buildDir, tocTemplate, navIndex, songPages });

  await copyAssets({ __dirname, buildDir });

  const orderedNavIndex = orderNavigationItems(navIndex);
  
  await logNavigationOrder(orderedNavIndex, { 
    writeToFile: true, 
    filePath: path.join(buildDir, 'nav-order-debug.txt') 
  });

  await fs.writeFile(
    path.join(buildDir, 'nav-index.json'),
    JSON.stringify(orderedNavIndex, null, 2),
    'utf-8'
  );

  await generateSectionData({ buildDir });
}

buildAll();