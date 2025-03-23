import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function processMarkdownFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const updatedLines = [];
  let inSource = false;
  let inTarget = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for start of sections
    if (line.trim().toLowerCase().startsWith('# source')) {
      inSource = true;
      inTarget = false;
      updatedLines.push(line);
      continue;
    }
    if (line.trim().toLowerCase().startsWith('# target')) {
      inTarget = true;
      inSource = false;
      updatedLines.push(line);
      continue;
    }

    // If we hit another heading, exit the section
    if (line.trim().startsWith('#') && !line.trim().toLowerCase().startsWith('# source') && !line.trim().toLowerCase().startsWith('# target')) {
      inSource = false;
      inTarget = false;
      updatedLines.push(line);
      continue;
    }

    if (inSource || inTarget) {
      // Append two spaces if it's not already blank or already ends in two spaces
      if (line.trim().length > 0 && !line.endsWith('  ')) {
        updatedLines.push(line + '  ');
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  }

  const newContent = updatedLines.join('\n');
  await fs.writeFile(filePath, newContent, 'utf-8');
  console.log(`✔ Updated: ${filePath}`);
}

async function run() {
  const files = await glob('./binder/**/*.md');
  for (const file of files) {
    await processMarkdownFile(file);
  }
}

run();
