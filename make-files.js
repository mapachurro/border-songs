// create-song-placeholders.js
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSongPlaceholders() {
  try {
    console.log('Starting to create song placeholder files...');
    
    const binderDir = path.join(__dirname, 'binder');
    const templatePath = path.join(binderDir, 'template.md');
    
    // Read the template file
    console.log('Reading template file...');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Get all section folders
    const folders = await fs.readdir(binderDir);
    let totalCreated = 0;
    let totalExisting = 0;
    
    for (const folder of folders) {
      const folderPath = path.join(binderDir, folder);
      const stat = await fs.stat(folderPath);
      
      // Skip if not a directory or if it's a special directory
      if (!stat.isDirectory() || folder.startsWith('.')) {
        continue;
      }
      
      console.log(`\nProcessing section: ${folder}`);
      
      // Find track list files in this folder
      const files = await fs.readdir(folderPath);
      const trackListFiles = files.filter(file => 
        file.startsWith('track-list') && file.endsWith('.md')
      );
      
      if (trackListFiles.length === 0) {
        console.log(`  No track list files found in ${folder}`);
        continue;
      }
      
      // Process each track list file
      for (const trackListFile of trackListFiles) {
        console.log(`  Processing track list: ${trackListFile}`);
        const trackListPath = path.join(folderPath, trackListFile);
        const trackListContent = await fs.readFile(trackListPath, 'utf-8');
        
        // Extract song titles from the track list
        // Looking for lines that start with a dash followed by a space
        const songLines = trackListContent
          .split('\n')
          .filter(line => line.trim().startsWith('- '))
          .map(line => line.trim().substring(2).trim());
        
        console.log(`    Found ${songLines.length} potential songs`);
        
        // Create placeholder files for each song
        for (let i = 0; i < songLines.length; i++) {
          const songTitle = songLines[i];
          
          // Skip lines that don't look like song titles
          if (!songTitle || songTitle.toLowerCase().startsWith('set the theme')) {
            continue;
          }
          
          // Extract just the song title (before any dash or parenthesis)
          let cleanTitle = songTitle;
          const dashIndex = cleanTitle.indexOf(' - ');
          if (dashIndex > 0) {
            cleanTitle = cleanTitle.substring(0, dashIndex).trim();
          }
          
          const parenIndex = cleanTitle.indexOf(' (');
          if (parenIndex > 0) {
            cleanTitle = cleanTitle.substring(0, parenIndex).trim();
          }
          
          // Create a filename-friendly version of the title
          const filenameFriendly = cleanTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          // Add a numeric prefix based on position in the list
          const paddedIndex = String(i + 1).padStart(2, '0');
          const filename = `${paddedIndex}-${filenameFriendly}.md`;
          const filePath = path.join(folderPath, filename);
          
          // Check if the file already exists
          const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
          
          if (fileExists) {
            console.log(`    ✓ File already exists: ${filename}`);
            totalExisting++;
            continue;
          }
          
          // Create the file with template content
          let fileContent = templateContent;
          // Replace the Title: line with the actual title
          fileContent = fileContent.replace('# Title:', `# Title: ${cleanTitle}`);
          
          await fs.writeFile(filePath, fileContent);
          console.log(`    ✅ Created placeholder: ${filename}`);
          totalCreated++;
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total placeholder files created: ${totalCreated}`);
    console.log(`Total existing files skipped: ${totalExisting}`);
    console.log('Done!');
    
  } catch (error) {
    console.error('Error creating song placeholders:', error);
  }
}

// Run the function
createSongPlaceholders();