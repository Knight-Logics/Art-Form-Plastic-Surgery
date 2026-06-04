/**
 * Elementor-style entrance animations + JKit fun-fact counters (data-value).
 */
(function () {
  const ANIMS = ['fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'fadeIn', 'zoomIn'];

  function parseSettings(node) {
    const raw = node?.getAttribute?.('data-settings');
    if (!raw) return null;
    try {
      return JSON.parse(raw.replace(/&quot;/g, '"'));
    } catch {
      return null;
    }
  }

  function animationFromNode(node) {
    if (!node) return null;
    const s = parseSettings(node);
    const anim = s?._animation || s?.animation;
    return anim && ANIMS.includes(anim) ? anim : null;
  }

  function pickAnimation(el) {
    for (const a of ANIMS) {
      if (el.classList.contains(a) || el.classList.contains('elementor-animation-' + a)) return a;
    }
    const chain = [el, el.closest('.elementor-widget'), el.closest('.elementor-column'), el.closest('.elementor-section')];
    for (const node of chain) {
      const anim = animationFromNode(node);
      if (anim) return anim;
    }
    if (el.classList.contains('elementor-heading-title')) return 'fadeInLeft';
    if (el.classList.contains('elementor-widget-wrap')) return 'fadeInUp';
    return 'fadeInUp';
  }

  function reveal(el) {
    const anim = pickAnimation(el);
    el.classList.remove('elementor-invisible');
    el.classList.add('animated', anim);
    if (el.classList.contains('animated-slow')) {
      el.style.animationDuration = '1.25s';
    }
  }

  function collectAnimationTargets() {
    const set = new Set();
    document.querySelectorAll('.elementor-invisible').forEach((el) => set.add(el));
    document.querySelectorAll('.elementor-section.animated-slow').forEach((el) => set.add(el));
    document.querySelectorAll('.elementor-widget.elementor-invisible').forEach((el) => set.add(el));
    return [...set];
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    const targets = collectAnimationTargets();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );
    targets.forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.elementor-invisible').forEach((el) => {
      el.classList.remove('elementor-invisible');
    });
  }

  /* Fun-fact counters: start at 0, count to data-value (452 patients on live site) */
  document.querySelectorAll('.jkit-fun-fact .number[data-value]').forEach((numEl) => {
    const target = parseInt(numEl.getAttribute('data-value'), 10);
    if (!Number.isFinite(target) || target < 1) return;

    const duration = parseInt(numEl.getAttribute('data-animation-duration') || '3500', 10);
    const suffixEl = numEl.closest('.number-wrapper')?.querySelector('.super');
    const hasPlus = suffixEl && suffixEl.textContent.includes('+');

    numEl.textContent = '0';

    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        numEl.textContent = String(val);
        if (p < 1) requestAnimationFrame(tick);
        else numEl.textContent = String(target);
      };
      requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        run();
      },
      { threshold: 0.35 }
    );
    obs.observe(numEl.closest('.jkit-fun-fact') || numEl);
  });
})();
