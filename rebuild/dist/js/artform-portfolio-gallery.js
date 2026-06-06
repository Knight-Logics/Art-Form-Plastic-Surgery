/**
 * JKit portfolio gallery — hover/click panel + background image crossfade (no Elementor).
 */
(function () {
  const AUTOPLAY_MS = 5200;

  function initGallery(root) {
    const rowItems = [...root.querySelectorAll('.row-item')];
    const imageItems = [...root.querySelectorAll('.image-item')];
    if (!rowItems.length || !imageItems.length) return;

    imageItems.forEach((img) => {
      const bg = img.getAttribute('data-background') || '';
      if (bg && !img.style.backgroundImage) {
        img.style.backgroundImage = `url(${bg})`;
      }
    });

    const activate = (tabId) => {
      if (!tabId) return;
      rowItems.forEach((row) => {
        row.classList.toggle('current-item', row.getAttribute('data-tab') === tabId);
      });
      imageItems.forEach((img) => {
        img.classList.toggle('current-item', img.id === tabId);
      });
    };

    // Single active panel on load (scraped HTML often marks two as current).
    activate(rowItems[0].getAttribute('data-tab'));

    const mode = root.classList.contains('on-click') ? 'click' : 'hover';
    rowItems.forEach((row) => {
      const tabId = row.getAttribute('data-tab');
      if (mode === 'click') {
        row.addEventListener('click', () => activate(tabId));
      } else {
        row.addEventListener('mouseenter', () => activate(tabId));
      }
      row.addEventListener('focus', () => activate(tabId));
    });

    let timer = null;
    let index = 0;

    const stopAutoplay = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startAutoplay = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stopAutoplay();
      timer = setInterval(() => {
        index = (index + 1) % rowItems.length;
        activate(rowItems[index].getAttribute('data-tab'));
      }, AUTOPLAY_MS);
    };

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', () => {
      startAutoplay();
    });

    startAutoplay();
  }

  function boot() {
    document.querySelectorAll('.jkit-portfolio-gallery').forEach(initGallery);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
