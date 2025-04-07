/**
 * Creates HTML links to song pages based on song titles in track lists
 * 
 * @param {Object} options - Options
 * @param {string} options.text - The text to process
 * @param {Object} options.songMap - Map of song slugs to filenames
 * @param {string} options.currentPath - Current file path (for relative links)
 * @returns {string} - Text with song links added
 */
export function createSongLinks({ text, songMap, currentPath }) {
  try {
    // Skip if text doesn't match our pattern
    if (!text.match(/^\d{2} - /)) {
      return text;
    }
    
    console.log(`Processing line for links: ${text}`);
    
    // Extract the song number and title
    // Format: "00 - Wasn't born to follow - Gerry Goffin, Carole King, Roger McGuinn"
    const match = text.match(/^(\d{2}) - ([^-]+)(?:-|$)/);
    if (!match) {
      console.log(`No match found for line: ${text}`);
      return text;
    }
    
    const songNumber = match[1];
    const songTitle = match[2].trim();
    console.log(`Extracted song number: ${songNumber}, title: ${songTitle}`);
    
    // Create the slug format that matches your file naming convention
    const slug = `${songNumber}-${songTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    console.log(`Generated slug: ${slug}`);
    
    // Find the matching song file
    let targetPath = null;
    for (const [key, path] of Object.entries(songMap)) {
      if (key.startsWith(songNumber) || path.includes(`/${songNumber}-`)) {
        targetPath = path;
        console.log(`Found matching song: ${key} -> ${path}`);
        break;
      }
    }
    
    if (!targetPath) {
      console.log(`No matching song found for ${songNumber} - ${songTitle}`);
      return text;
    }
    
    // Create relative path based on current location
    const relativePath = createRelativePath(currentPath, targetPath);
    console.log(`Created relative path: ${relativePath}`);
    
    // Replace just the title part with a link, preserving the rest
    const titlePart = `${songNumber} - ${songTitle}`;
    const linkedTitle = `<a href="${relativePath}">${titlePart}</a>`;
    return text.replace(titlePart, linkedTitle);
  } catch (error) {
    console.error(`Error creating song links: ${error.message}`);
    return text; // Return original text on error
  }
}

/**
 * Creates a relative path from current file to target file
 * 
 * @param {string} currentPath - Current file path
 * @param {string} targetPath - Target file path
 * @returns {string} - Relative path
 */
function createRelativePath(currentPath, targetPath) {
  try {
    // For TOC page (in root directory)
    if (!currentPath.includes('/')) {
      return `./${targetPath}`;
    }
    
    // For track list pages (in section directories)
    const currentDir = currentPath.split('/')[0];
    const targetDir = targetPath.split('/')[0];
    
    if (currentDir === targetDir) {
      // Same directory, use relative path
      return `./${targetPath.split('/')[1]}`;
    } else {
      // Different directory, go up and then to target
      return `../${targetPath}`;
    }
  } catch (error) {
    console.error(`Error creating relative path: ${error.message}`);
    return targetPath; // Return absolute path on error
  }
}