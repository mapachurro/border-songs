document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Navbar script loaded");
    
    // Create fixed navbar if it doesn't exist
    let navbarFixed = document.querySelector(".navbar-fixed");
    if (!navbarFixed) {
      navbarFixed = document.createElement("div");
      navbarFixed.className = "navbar-fixed";
      
      const navbarContainer = document.createElement("div");
      navbarContainer.className = "navbar-container";
      
      navbarFixed.appendChild(navbarContainer);
      
      // Insert at the beginning of the body
      document.body.insertBefore(navbarFixed, document.body.firstChild);
      
      console.log("Created fixed navbar");
    }
    
    // Get the navbar container
    const navbarContainer = navbarFixed.querySelector(".navbar-container");
    
    // Get the current path
    let currentPath = window.location.pathname.replace(/^\/+|\/+$/g, "");
    
    // Extract repo name from path if on GitHub Pages
    const repoName = "border-songs"; // Default repo name
    const isGitHubPages = window.location.hostname.includes("github.io");
    
    if (isGitHubPages) {
      const pathParts = currentPath.split('/');
      if (pathParts[0] === repoName) {
        // Remove repo name from the path for consistent processing
        currentPath = pathParts.slice(1).join('/');
      }
    }
    
    console.log("Current path for breadcrumbs:", currentPath);
    
    if (currentPath === "" || currentPath === "/") {
      currentPath = "index.html";
      // For main page, just show the title
      navbarContainer.innerHTML = `
        <div class="breadcrumb-container">
          <div class="breadcrumb-section">Border Songs</div>
        </div>
      `;
      return;
    }
    
    // Extract section from path
    const pathParts = currentPath.split('/');
    if (pathParts.length < 2) {
      // For pages at the root level (like toc.html)
      navbarContainer.innerHTML = `
        <div class="breadcrumb-container">
          <div class="breadcrumb-section">Border Songs</div>
          <ol class="breadcrumb-pages">
            <li class="breadcrumb-page">
              <a href="${isGitHubPages ? `/${repoName}` : ''}/index.html">Home</a>
            </li>
            <li class="breadcrumb-page active">
              ${formatPageTitle(pathParts[0])}
            </li>
          </ol>
        </div>
      `;
      return;
    }
    
    const sectionId = pathParts[0];
    const currentFile = pathParts[1];
    
    console.log("Section ID:", sectionId);
    console.log("Current file:", currentFile);
    
    // Map section IDs to readable titles
    const sectionTitles = {
      "01-reach-the-pass": "Side 1: Reach the Pass",
      "02-behold-the-valley-beyond": "Side 2: Behold the Valley Beyond",
      "03-alcanzar-la-ribera": "Side 3: Alcanzar la Ribera",
      "04-desde-la-otra-costa": "Side 4: Desde la Otra Costa"
    };
    
    const sectionTitle = sectionTitles[sectionId] || sectionId;
    
    // Try to load the nav-index.json from multiple possible locations
    let navList;
    const possiblePaths = [
      "/nav-index.json",
      "./nav-index.json",
      "../nav-index.json",
      "nav-index.json",
      `/${repoName}/nav-index.json`,
      `https://mapachurro.github.io/${repoName}/nav-index.json`
    ];
    
    for (const navPath of possiblePaths) {
      try {
        console.log(`Trying to load navigation index from: ${navPath}`);
        const response = await fetch(navPath);
        if (response.ok) {
          navList = await response.json();
          console.log(`Successfully loaded navigation index from: ${navPath}`);
          break;
        }
      } catch (error) {
        console.log(`Failed to load from ${navPath}:`, error.message);
      }
    }
    
    if (!navList) {
      console.error("Error: Could not load navigation index from any location");
      return;
    }
    
    console.log("Navigation index loaded for breadcrumbs");
    
    // Filter pages that belong to this section
    const sectionPages = navList.filter(path => path.startsWith(sectionId + '/'));
    console.log("Section pages:", sectionPages.length);
    
    if (sectionPages.length === 0) {
      console.warn("No pages found for this section");
      return;
    }
    
    // Create the breadcrumb HTML
    const breadcrumbHTML = `
      <div class="breadcrumb-container">
        <div class="breadcrumb-section">
          <a href="${isGitHubPages ? `/${repoName}` : ''}/index.html" style="color: inherit; text-decoration: none;">Border Songs</a> › ${sectionTitle}
        </div>
        <ol class="breadcrumb-pages">
          ${sectionPages.map(page => {
            const pageName = page.split('/')[1];
            const isActive = page === currentPath;
            const pageTitle = formatPageTitle(pageName);
            const pageUrl = isGitHubPages ? `/${repoName}/${page}` : `/${page}`;
            
            return `
              <li class="breadcrumb-page${isActive ? ' active' : ''}">
                ${isActive 
                  ? pageTitle 
                  : `<a href="${pageUrl}">${pageTitle}</a>`}
              </li>
            `;
          }).join('')}
        </ol>
      </div>
    `;
    
    navbarContainer.innerHTML = breadcrumbHTML;
    
    // Remove the old breadcrumb-nav div since we're now using the fixed navbar
    const oldBreadcrumbNav = document.querySelector(".breadcrumb-nav");
    if (oldBreadcrumbNav) {
      oldBreadcrumbNav.remove();
      console.log("Removed old breadcrumb navigation");
    }
    
    console.log("Breadcrumb navigation created successfully");
    
  } catch (error) {
    console.error("Error setting up breadcrumb navigation:", error);
  }
});

// Helper function to format page titles
function formatPageTitle(filename) {
  // Remove file extension
  let title = filename.replace(/\.(html|md)$/, '');
  
  // Handle special cases
  if (title === '00-introduction') return 'Introduction';
  if (title.startsWith('track-list')) return 'Track List';
  if (title === 'toc') return 'Table of Contents';
  
  // Remove leading numbers and hyphens
  title = title.replace(/^\d+-/, '');
  
  // Replace hyphens with spaces and capitalize
  title = title.replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return title;
}