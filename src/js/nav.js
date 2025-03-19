// nav.js - frontend navigation starter
console.log('Navigation script loaded.');

document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM loaded, initializing navigation');
    
    // Get navigation elements
    const navElement = document.querySelector('nav.navigation');
    const nextBtn = document.querySelector('[data-next]');
    const prevBtn = document.querySelector('[data-prev]');
    
    console.log('Navigation elements found:', {
      navElement: !!navElement,
      nextBtn: !!nextBtn,
      prevBtn: !!prevBtn
    });
    
    // Fix for the placeholder text issue - if we see {{PREV_BUTTON}} or {{NEXT_BUTTON}}
    // in the DOM, it means template variables weren't replaced
    if (navElement) {
      const navHtml = navElement.innerHTML;
      if (navHtml.includes('{{PREV_BUTTON}}') || navHtml.includes('{{NEXT_BUTTON}}')) {
        console.error('Template variables not replaced in navigation. Check build process.');
        // Try to fix it by hiding the placeholders
        navElement.innerHTML = navHtml
          .replace('{{PREV_BUTTON}}', '')
          .replace('{{NEXT_BUTTON}}', '');
      }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      try {
        if (e.key === 'ArrowRight') {
          if (nextBtn && nextBtn.dataset.next) {
            console.log('→ Navigating to next page:', nextBtn.dataset.next);
            window.location.href = nextBtn.dataset.next;
          } else {
            console.log('→ No next page available');
          }
        } else if (e.key === 'ArrowLeft') {
          if (prevBtn && prevBtn.dataset.prev) {
            console.log('← Navigating to previous page:', prevBtn.dataset.prev);
            window.location.href = prevBtn.dataset.prev;
          } else {
            console.log('← No previous page available');
          }
        }
      } catch (error) {
        console.error('Error in keyboard navigation:', error);
      }
    });

    // Button click handlers
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        try {
          const nextUrl = nextBtn.dataset.next;
          if (nextUrl) {
            console.log('Navigating to next page via button click:', nextUrl);
            window.location.href = nextUrl;
          } else {
            console.error('Next button clicked but no data-next attribute found');
          }
        } catch (error) {
          console.error('Error navigating to next page:', error);
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        try {
          const prevUrl = prevBtn.dataset.prev;
          if (prevUrl) {
            console.log('Navigating to previous page via button click:', prevUrl);
            window.location.href = prevUrl;
          } else {
            console.error('Previous button clicked but no data-prev attribute found');
          }
        } catch (error) {
          console.error('Error navigating to previous page:', error);
        }
      });
    }
    
    // Log navigation state for debugging
    console.log('Navigation initialized successfully');
  } catch (error) {
    console.error('Fatal error initializing navigation:', error);
  }
});
