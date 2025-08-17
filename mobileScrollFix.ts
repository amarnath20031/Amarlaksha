// SIMPLE DIRECT SCROLLING FIX
// Forces browser to enable natural document scrolling

export function initMobileScrollFix() {
  if (typeof window === 'undefined') return;

  // Direct DOM manipulation - remove any height/overflow constraints
  function enableScrolling() {
    // Reset document and body
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = 'static';
    document.body.style.webkitOverflowScrolling = 'touch';

    // Fix the root container
    const root = document.getElementById('root');
    if (root) {
      root.style.height = 'auto';
      root.style.overflow = 'visible';
      root.style.position = 'static';
    }

    // Find and fix any containers that might block scrolling
    const containers = document.querySelectorAll('.min-h-screen, .h-screen, .h-full');
    containers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.style.height = 'auto';
        container.style.minHeight = 'auto';
        container.style.overflow = 'visible';
      }
    });
  }

  // Apply fix immediately
  enableScrolling();

  // Reapply on route changes
  setTimeout(enableScrolling, 100);
  setTimeout(enableScrolling, 500);

  console.log('Simple mobile scroll fix applied');
}

export function forceScrollRefresh() {
  // Multiple scroll refresh attempts
  setTimeout(() => {
    window.scrollTo(0, 1);
    window.scrollTo(0, 0);
  }, 50);
  
  setTimeout(() => {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
  }, 150);
  
  setTimeout(() => {
    document.body.scrollTop = document.body.scrollTop + 1;
    document.body.scrollTop = document.body.scrollTop - 1;
  }, 250);
}