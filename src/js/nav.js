// nav.js - frontend navigation starter
console.log('Navigation script loaded.');

document.addEventListener('DOMContentLoaded', () => {
  // Example: simple keyboard nav
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      // TODO: navigate to next page
      console.log('→ next');
    } else if (e.key === 'ArrowLeft') {
      // TODO: navigate to previous page
      console.log('← previous');
    }
  });

  // You could also add "Next" and "Previous" button behavior here
  const nextBtn = document.querySelector('[data-next]');
  const prevBtn = document.querySelector('[data-prev]');

  nextBtn?.addEventListener('click', () => {
    // Replace with actual path
    window.location.href = nextBtn.dataset.next;
  });

  prevBtn?.addEventListener('click', () => {
    window.location.href = prevBtn.dataset.prev;
  });
});
