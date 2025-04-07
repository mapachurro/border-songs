/**
 * Orders navigation items according to the book's logical reading order
 * 
 * Order:
 * 1. Main pages (index, introduction, toc)
 * 2. For each section (in numerical order):
 *    a. Track list
 *    b. Section introduction
 *    c. Songs in numerical order
 * 
 * @param {string[]} navItems - Array of navigation item paths
 * @returns {string[]} - Ordered array of navigation item paths
 */
export function orderNavigationItems(navItems) {
    try {
      console.log(`Ordering ${navItems.length} navigation items...`);
      
      return [...navItems].sort((a, b) => {
        try {
          // Special case for main pages
          const mainPages = ['index.html', 'introduction.html', 'toc.html'];
          const aIsMain = mainPages.includes(a);
          const bIsMain = mainPages.includes(b);
          
          if (aIsMain && bIsMain) {
            return mainPages.indexOf(a) - mainPages.indexOf(b);
          }
          if (aIsMain) return -1;
          if (bIsMain) return 1;
          
          // Extract section numbers and page types
          const aMatch = a.match(/^(\d+)-([^\/]+)\/(?:(\d+)-|track-list-|introduction)/);
          const bMatch = b.match(/^(\d+)-([^\/]+)\/(?:(\d+)-|track-list-|introduction)/);
          
          if (!aMatch || !bMatch) {
            console.warn(`Warning: Couldn't parse path format for ${!aMatch ? a : b}`);
            return a.localeCompare(b); // Fallback to alphabetical
          }
          
          // Compare section numbers first
          const aSectionNum = parseInt(aMatch[1]);
          const bSectionNum = parseInt(bMatch[1]);
          if (aSectionNum !== bSectionNum) {
            return aSectionNum - bSectionNum;
          }
          
          // Within a section, order: track-list, introduction, then songs by number
          const aIsTrackList = a.includes('track-list-');
          const bIsTrackList = b.includes('track-list-');
          const aIsIntro = a.endsWith('introduction.html');
          const bIsIntro = b.endsWith('introduction.html');
          
          if (aIsTrackList) return -1;
          if (bIsTrackList) return 1;
          if (aIsIntro) return -1;
          if (bIsIntro) return 1;
          
          // Both are songs, compare by song number
          const aSongNum = parseInt(aMatch[3] || '0');
          const bSongNum = parseInt(bMatch[3] || '0');
          return aSongNum - bSongNum;
        } catch (error) {
          console.error(`Error comparing ${a} and ${b}: ${error.message}`);
          return 0; // Keep original order on error
        }
      });
    } catch (error) {
      console.error(`Error ordering navigation items: ${error.message}`);
      console.error(error.stack);
      return navItems; // Return original array on error
    }
  }
  
  /**
   * Logs the ordered navigation items to console and optionally to a file
   * Useful for debugging navigation order issues
   * 
   * @param {string[]} orderedItems - The ordered navigation items
   * @param {Object} options - Options for logging
   * @param {boolean} [options.writeToFile=false] - Whether to write to a file
   * @param {string} [options.filePath] - Path to write the log file
   */
  export async function logNavigationOrder(orderedItems, options = {}) {
    try {
      console.log("\nNavigation order:");
      orderedItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item}`);
      });
      
      if (options.writeToFile && options.filePath) {
        const fs = await import('fs/promises');
        const content = orderedItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
        await fs.writeFile(options.filePath, content, 'utf-8');
        console.log(`Navigation order written to ${options.filePath}`);
      }
    } catch (error) {
      console.error(`Error logging navigation order: ${error.message}`);
    }
  }