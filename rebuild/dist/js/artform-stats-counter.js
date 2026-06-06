/**
 * Homepage stat counters — count up from 0 when the band enters the viewport.
 * Targets are set at build time via data-artform-count (see site.json stats).
 */
(function () {
  function animateCounter(el, target, duration) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.textContent = String(target);
      el.closest('.artform-stat-counter')?.classList.add('is-complete');
      return;
    }

    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = String(target);
        el.closest('.artform-stat-counter')?.classList.add('is-complete');
      }
    }
    requestAnimationFrame(frame);
  }

  function runCounter(el) {
    if (el.dataset.artformAnimated === 'true') return;
    el.dataset.artformAnimated = 'true';
    const target = parseInt(el.dataset.artformCount, 10);
    if (!Number.isFinite(target)) return;
    const duration = parseInt(el.dataset.animationDuration, 10) || 2200;
    animateCounter(el, target, duration);
  }

  function init() {
    const counters = document.querySelectorAll('.artform-stat-count[data-artform-count]');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -8% 0px' }
    );

    counters.forEach((el) => observer.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
