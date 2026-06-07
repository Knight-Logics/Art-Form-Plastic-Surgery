/**
 * Homepage hero — scroll parallax on dedicated image layer (replaces Elementor motion FX).
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hero = document.querySelector('.artform-landing .elementor-element.elementor-element-79fd65b0');
  const img = hero?.querySelector('.artform-hero-parallax-layer__img');
  if (!hero || !img) return;

  const desktopMq = window.matchMedia('(min-width: 768px)');
  let ticking = false;

  function reset() {
    img.style.transform = '';
  }

  function updateParallax() {
    ticking = false;
    if (!desktopMq.matches) {
      reset();
      return;
    }

    const rect = hero.getBoundingClientRect();
    const viewH = window.innerHeight;
    if (rect.bottom <= 0 || rect.top >= viewH) return;

    const travel = viewH + rect.height;
    const progress = (viewH - rect.top) / travel;
    const shift = (progress - 0.5) * rect.height * 2.8;
    img.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.24)`;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  }

  if (img.complete) updateParallax();
  else img.addEventListener('load', updateParallax, { once: true });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();
