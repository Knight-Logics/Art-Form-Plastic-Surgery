/**
 * Homepage hero stage — sticky hero + lead form slides down to help band.
 */
(function () {
  document.documentElement.classList.add('js');

  function initHomeHeroStage() {
    const stage = document.querySelector('.artform-home-page .af-hero-stage');
    const hero = stage && stage.querySelector('[data-af-hero-parallax]');
    const panel = stage && stage.querySelector('.af-hero-lead-panel');
    const next = document.querySelector('.artform-home-page .artform-help-band');
    if (!stage || !hero || !panel || !next) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 1100px)');
    let frame = null;
    let pullPx = 0;

    function clearStage() {
      document.documentElement.style.setProperty('--af-hero-stage-pad', '0px');
      hero.style.removeProperty('transform');
      panel.style.removeProperty('transform');
      pullPx = 0;
    }

    function layoutStage() {
      clearStage();
      if (motionQuery.matches || !desktopQuery.matches) return;

      const heroHeight = hero.offsetHeight;
      const panelHeight = panel.offsetHeight;
      const stageTop = stage.getBoundingClientRect().top + window.scrollY;
      const nextTop = next.getBoundingClientRect().top + window.scrollY;
      const leadRun = Math.max(0, nextTop - stageTop - heroHeight - panelHeight);
      const pad = Math.max(leadRun, Math.round(heroHeight * 0.82));
      const overlapPx = Math.min(120, Math.round(heroHeight * 0.12));

      pullPx = -Math.max(0, heroHeight - panelHeight - overlapPx);
      document.documentElement.style.setProperty('--af-hero-stage-pad', pad + 'px');
      panel.style.transform = pullPx ? 'translate3d(0,' + pullPx + 'px,0)' : '';
    }

    function tick() {
      frame = null;
      if (motionQuery.matches || !desktopQuery.matches) {
        clearStage();
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      const run = stage.offsetHeight - hero.offsetHeight;
      if (run <= 0) {
        hero.style.removeProperty('transform');
        panel.style.transform = pullPx ? 'translate3d(0,' + pullPx + 'px,0)' : '';
        return;
      }

      const scrolled = Math.min(Math.max(-stageRect.top, 0), run);
      const progress = scrolled / run;
      const panelShift = pullPx * (1 - progress);
      const heroShift = scrolled * 0.2;

      hero.style.transform = heroShift ? 'translate3d(0,' + heroShift + 'px,0)' : '';
      panel.style.transform = Math.abs(panelShift) > 0.5 ? 'translate3d(0,' + panelShift + 'px,0)' : '';
    }

    function queueTick() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onLayoutChange() {
      layoutStage();
      queueTick();
    }

    layoutStage();
    window.addEventListener('scroll', queueTick, { passive: true });
    window.addEventListener('resize', onLayoutChange, { passive: true });
    motionQuery.addEventListener('change', onLayoutChange);
    desktopQuery.addEventListener('change', onLayoutChange);
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeHeroStage);
  } else {
    initHomeHeroStage();
  }
})();
