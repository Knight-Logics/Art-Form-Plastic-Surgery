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
    closeBtn.textContent = '×';
    head.appendChild(closeBtn);

    const navWrap = document.createElement('nav');
    navWrap.className = 'artform-drawer-nav';
    const navList = buildDrawerNav();
    if (navList) navWrap.appendChild(navList);

    const cta = document.createElement('div');
    cta.className = 'artform-drawer-cta';
    cta.innerHTML =
      '<a class="artform-drawer-book" href="/book-consultation/">Book Consultation</a>' +
      '<a class="artform-drawer-phone" href="tel:8135633735"><span style="font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;display:block;opacity:0.9">Call</span>(813) 563-3735</a>';

    drawer.append(head, navWrap, cta);
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
