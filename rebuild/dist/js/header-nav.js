/**
 * Mobile drawer for custom .artform-header
 */
(function () {
  const BP = 1265;

  function isMobile() {
    return window.matchMedia(`(max-width: ${BP - 0.02}px)`).matches;
  }

  function buildDrawerNav() {
    const menu = document.querySelector('.artform-header__menu');
    if (!menu) return null;
    const ul = document.createElement('ul');
    ul.className = 'artform-drawer-menu';
    ul.style.cssText = 'list-style:none;margin:0;padding:0;';

    menu.querySelectorAll(':scope > li').forEach((li) => {
      const main = li.querySelector(':scope > a');
      if (!main) return;
      const item = document.createElement('li');
      const a = document.createElement('a');
      a.href = main.getAttribute('href') || '#';
      a.textContent = main.textContent.replace(/\s*▼.*/, '').trim();
      if (li.classList.contains('is-active')) a.classList.add('is-active');
      item.appendChild(a);
      ul.appendChild(item);

      li.querySelectorAll('.artform-header__submenu a').forEach((sub) => {
        const subLi = document.createElement('li');
        const subA = document.createElement('a');
        subA.href = sub.getAttribute('href') || '#';
        subA.textContent = sub.textContent.trim();
        subA.style.paddingLeft = '28px';
        subA.style.fontSize = '0.88rem';
        subLi.appendChild(subA);
        ul.appendChild(subLi);
      });
    });
    return ul;
  }

  let backdrop;
  let drawer;
  let built = false;

  function buildDrawer() {
    if (built) return;
    const logo = document.querySelector('.artform-header__logo img')?.cloneNode(true);

    backdrop = document.createElement('div');
    backdrop.className = 'artform-nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    drawer = document.createElement('aside');
    drawer.className = 'artform-mobile-drawer';
    drawer.id = 'artform-mobile-nav';
    drawer.setAttribute('aria-hidden', 'true');

    const head = document.createElement('div');
    head.className = 'artform-drawer-head';
    if (logo) {
      const link = document.createElement('a');
      link.href = '/';
      link.appendChild(logo);
      head.appendChild(link);
    }
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'artform-drawer-close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.innerHTML =
      '<svg class="artform-drawer-close-icon" width="50" height="50" viewBox="0 0 50 50" aria-hidden="true" focusable="false">' +
      '<path d="M14 14 36 36M36 14 14 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>';
    head.appendChild(closeBtn);

    const navWrap = document.createElement('nav');
    navWrap.className = 'artform-drawer-nav';
    const navList = buildDrawerNav();
    if (navList) navWrap.appendChild(navList);

    const bottom = document.createElement('div');
    bottom.className = 'artform-drawer-bottom';

    const cta = document.createElement('div');
    cta.className = 'artform-drawer-cta';
    const header = document.querySelector('.artform-header');
    const tel = header?.dataset.phoneTel || '8135633735';
    const display = header?.dataset.phoneDisplay || '(813) 563-3735';
    const phoneIcon =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
    cta.innerHTML =
      '<a class="artform-drawer-book" href="/book-consultation/">Book Consultation</a>' +
      `<a class="header-cta header-cta--drawer" href="tel:${tel}" aria-label="Call Art Form Plastic Surgery at ${display}">` +
      `<span class="header-cta-icon" aria-hidden="true">${phoneIcon}</span>` +
      '<span class="header-cta-text">' +
      '<span class="header-cta-label">Call or Text</span>' +
      `<span class="header-cta-number">${display}</span>` +
      '</span></a>';

    const social = document.createElement('div');
    social.className = 'artform-drawer-social';
    social.setAttribute('aria-label', 'Social media');
    const footerSocial = document.querySelector('.artform-footer__social');
    if (footerSocial) {
      footerSocial.querySelectorAll('a').forEach((link) => {
        social.appendChild(link.cloneNode(true));
      });
    } else {
      social.innerHTML =
        '<a href="https://www.instagram.com/faceplasticsurgeon/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src="/images/social/instagram.svg" width="44" height="44" alt="" decoding="async"></a>' +
        '<a href="https://www.tiktok.com/@faceplasticsurgeon" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><img src="/images/social/tiktok.svg" width="44" height="44" alt="" decoding="async"></a>';
    }

    const foot = document.createElement('div');
    foot.className = 'artform-drawer-foot';
    const rule = document.createElement('div');
    rule.className = 'artform-drawer-rule';
    rule.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('p');
    copy.className = 'artform-drawer-copyright';
    const year = new Date().getFullYear();
    copy.textContent = `© ${year} Art Form Plastic Surgery. All rights reserved.`;
    foot.append(rule, copy);

    bottom.append(cta, social, foot);
    drawer.append(head, navWrap, bottom);
    document.body.append(backdrop, drawer);

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    navWrap.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });

    built = true;
  }

  function open() {
    buildDrawer();
    if (!drawer) return;
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('artform-nav-open');
    const toggle = document.querySelector('.artform-header__toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function close() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('artform-nav-open');
    const toggle = document.querySelector('.artform-header__toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function bind() {
    const toggle = document.querySelector('.artform-header__toggle');
    if (!toggle || toggle.dataset.bound) return;
    toggle.dataset.bound = '1';
    toggle.addEventListener('click', () => {
      if (!isMobile()) return;
      if (drawer?.classList.contains('is-open')) close();
      else open();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  window.addEventListener('resize', () => {
    if (!isMobile()) close();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();

/**
 * Desktop dropdowns — hover only (no click toggle); brief delay before close.
 */
(function initDesktopSubmenus() {
  const BP = 1265;
  const CLOSE_MS = 280;

  function isDesktop() {
    return window.matchMedia(`(min-width: ${BP}px)`).matches;
  }

  function bindSubmenus() {
    document.querySelectorAll('.artform-header__menu > li.has-children').forEach((item) => {
      if (item.dataset.submenuBound) return;
      item.dataset.submenuBound = '1';

      let closeTimer;

      function open() {
        clearTimeout(closeTimer);
        item.classList.add('is-submenu-open');
      }

      function scheduleClose() {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          item.classList.remove('is-submenu-open');
        }, CLOSE_MS);
      }

      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', scheduleClose);
      item.addEventListener('focusin', open);
      item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) scheduleClose();
      });
    });
  }

  function init() {
    if (!isDesktop()) return;
    bindSubmenus();
  }

  window.addEventListener('resize', () => {
    if (!isDesktop()) {
      document.querySelectorAll('.artform-header__menu > li.is-submenu-open').forEach((li) => {
        li.classList.remove('is-submenu-open');
      });
    } else {
      bindSubmenus();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
