document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.querySelector(".navigation");
  if (!navContainer) return;

  const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, "");

  try {
    const response = await fetch("/nav-index.json");
    const navList = await response.json();

    const currentIndex = navList.indexOf(currentPath);
    if (currentIndex === -1) {
      console.warn("Current page not found in nav-index.json:", currentPath);
      return;
    }

    const prevLink = navList[currentIndex - 1];
    const nextLink = navList[currentIndex + 1];

    if (prevLink) {
      const btn = document.createElement("a");
      btn.href = `/${prevLink}`;
      btn.className = "btn btn-outline-secondary me-2";
      btn.textContent = "← Prev";
      navContainer.appendChild(btn);
    }

    if (nextLink) {
      const btn = document.createElement("a");
      btn.href = `/${nextLink}`;
      btn.className = "btn btn-outline-secondary";
      btn.textContent = "Next →";
      navContainer.appendChild(btn);
    }
  } catch (err) {
    console.error("Navigation error:", err);
  }
});
