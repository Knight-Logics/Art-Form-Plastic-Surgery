/**
 * Scroll-triggered homepage entrances with optional stagger delay.
 */
(function () {
  const targets = [...document.querySelectorAll('[data-artform-entrance]')];
  if (!targets.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const reveal = (el) => {
    const delay = parseInt(el.getAttribute('data-artform-entrance-delay') || '0', 10);
    window.setTimeout(() => {
      el.classList.add('is-visible');
    }, Math.max(0, delay));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
})();
