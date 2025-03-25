document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Navigation script loaded");

    // Find navigation containers
    const navContainers = document.querySelectorAll(".navigation");
    console.log(`Found ${navContainers.length} navigation containers`);

    if (navContainers.length === 0) {
      console.warn("No navigation containers found on page");
      return;
    }

    // Get the current path
    let currentPath = window.location.pathname;
    // Remove leading and trailing slashes
    currentPath = currentPath.replace(/^\/+|\/+$/g, "");

    // Handle special cases
    if (currentPath === "" || currentPath === "/") {
      currentPath = "index.html";
    } else if (currentPath === "toc") {
      currentPath = "toc.html";
    }

    console.log("Current path:", currentPath);

    // Try multiple possible locations for nav-index.json
    let navList;
    const possiblePaths = [
      "/nav-index.json",
      "./nav-index.json",
      "../nav-index.json",
      "nav-index.json",
    ];

    let successPath;
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to load navigation index from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          navList = await response.json();
          successPath = path;
          console.log(`Successfully loaded navigation index from: ${path}`);
          break;
        }
      } catch (error) {
        console.warn(`Failed to load from ${path}:`, error.message);
      }
    }

    if (!navList) {
      throw new Error("Could not load navigation index from any path");
    }

    console.log("Navigation index loaded:", navList.length, "items");

    // Find the current page in the navigation list
    let currentIndex = -1;

    // First try direct match
    currentIndex = navList.indexOf(currentPath);

    // If not found, try with/without .html extension
    if (currentIndex === -1) {
      const altPath = currentPath.endsWith(".html")
        ? currentPath.slice(0, -5)
        : currentPath + ".html";
      currentIndex = navList.indexOf(altPath);

      if (currentIndex !== -1) {
        console.log(`Found page with alternate path: ${altPath}`);
        currentPath = altPath;
      }
    }

    // If still not found, try matching the end of the path
    if (currentIndex === -1) {
      for (let i = 0; i < navList.length; i++) {
        if (
          currentPath.endsWith(navList[i]) ||
          navList[i].endsWith(currentPath)
        ) {
          currentIndex = i;
          currentPath = navList[i];
          console.log(`Found matching page: ${currentPath}`);
          break;
        }
      }
    }

    // Special case for toc.html
    if (currentPath === "toc" || currentPath.endsWith("/toc")) {
      const tocIndex = navList.indexOf("toc.html");
      if (tocIndex !== -1) {
        currentIndex = tocIndex;
        currentPath = "toc.html";
        console.log("Matched special case for toc.html");
      }
    }

    if (currentIndex === -1) {
      console.error("Could not find current page in navigation index");
      console.log("Current path:", currentPath);
      console.log("Available paths:", navList);
      return;
    }

    console.log("Current index in navigation:", currentIndex);

    const prevLink = currentIndex > 0 ? navList[currentIndex - 1] : null;
    const nextLink =
      currentIndex < navList.length - 1 ? navList[currentIndex + 1] : null;

    console.log("Previous link:", prevLink);
    console.log("Next link:", nextLink);

    // Determine base path for links
    const basePath = successPath.startsWith("/")
      ? ""
      : successPath.includes("../")
        ? "../"
        : "./";

    console.log("Using base path for links:", basePath);

    // Update all navigation containers
    navContainers.forEach((container, i) => {
      console.log(`Updating navigation container ${i + 1}`);

      // Clear existing content
      container.innerHTML = "";

      // Create container for buttons
      const btnContainer = document.createElement("div");
      btnContainer.className = "d-flex justify-content-between w-100";

      // Create left and right sides
      const leftSide = document.createElement("div");
      const rightSide = document.createElement("div");

      // Add prev button if available
      if (prevLink) {
        const prevBtn = document.createElement("a");
        prevBtn.href = `${basePath}${prevLink}`;
        prevBtn.className = "btn btn-outline-secondary";
        prevBtn.textContent = "← Previous";
        prevBtn.setAttribute("data-nav", "prev");
        leftSide.appendChild(prevBtn);
        console.log(`Added prev button linking to: ${basePath}${prevLink}`);
      }

      // Add next button if available
      if (nextLink) {
        const nextBtn = document.createElement("a");
        nextBtn.href = `${basePath}${nextLink}`;
        nextBtn.className = "btn btn-outline-secondary";
        nextBtn.textContent = "Next →";
        nextBtn.setAttribute("data-nav", "next");
        rightSide.appendChild(nextBtn);
        console.log(`Added next button linking to: ${basePath}${nextLink}`);
      }

      // Assemble the container
      btnContainer.appendChild(leftSide);
      btnContainer.appendChild(rightSide);
      container.appendChild(btnContainer);

      console.log(`Navigation container ${i + 1} updated successfully`);
    });

    // Add keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && prevLink) {
        console.log(`Navigating to previous page: ${basePath}${prevLink}`);
        window.location.href = `${basePath}${prevLink}`;
      } else if (e.key === "ArrowRight" && nextLink) {
        console.log(`Navigating to next page: ${basePath}${nextLink}`);
        window.location.href = `${basePath}${nextLink}`;
      }
    });

    console.log("Navigation setup complete");
  } catch (error) {
    console.error("Navigation error:", error);
  }
});
