import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

const site = JSON.parse(await fs.readFile(path.join(ROOT, 'data/site.json'), 'utf8'));
const pages = JSON.parse(await fs.readFile(path.join(ROOT, 'data/pages.json'), 'utf8'));
const navConfig = JSON.parse(await fs.readFile(path.join(ROOT, 'data/nav.json'), 'utf8'));

const BASE = site.domain;

const CONTENT_FIXES = [
  [/813[-\s]?434[-\s]?3238/g, '813-563-3735'],
  [/813[-\s]?565[-\s]?3735/g, '813-563-3735'],
  [/813[-\s]?588[-\s]?5150/g, '813-563-3735'],
  [/Dr\.\s*Keliszak/gi, 'Dr. Kieliszak'],
  [/Dr\.\s*Kelisak/gi, 'Dr. Kieliszak'],
  [/Plastic Suegery/gi, 'Plastic Surgery'],
  [/Get a Free Estimate/gi, 'Book a Consultation'],
  [/Free Estimate/gi, 'Consultation'],
  [/hyperhydrosis/gi, 'hyperhidrosis'],
  [/This is the text for[\s\S]*?Split ear lobe repair[\s\S]*?\./gi, ''],
];

function fixContent(html) {
  let out = html;
  for (const [re, rep] of CONTENT_FIXES) out = out.replace(re, rep);
  return out;
}

/** Shared footer extracted once from homepage. */
let shellFooter = null;

const LOGO_SRC = '/wp-content/uploads/2024/10/1000513852-removebg-preview-e1730100950292-186x81.png';

const SERVICE_PREFIXES = [
  '/services/',
  '/cosmetic-procedures/',
  '/functional/',
  '/non-surgical-procedures-2/',
  '/hair-restoration/',
  '/skincare/',
];

function normalizePath(p) {
  return p === '/' ? '/' : p.replace(/\/?$/, '/');
}

function navItemState(href, pagePath) {
  const norm = normalizePath(pagePath);
  const link = normalizePath(href);
  if (link === norm) return { active: true, ancestor: false };
  if (link === '/services/' && (SERVICE_PREFIXES.some((r) => pagePath.startsWith(r)) || /\/(rhinoplasty|facelift|necklift|lip-lift|blepharoplasty|otoplasty|browlift|buccal|chin-implant|split-ear|mohs|nasal-breathing|scar-revision)/.test(pagePath))) {
    return { active: false, ancestor: true };
  }
  return { active: false, ancestor: false };
}

function renderCustomHeader(pagePath) {
  const menuItems = navConfig.items
    .map((item) => {
      const { active, ancestor } = navItemState(item.href, pagePath);
      const liClass = [
        item.children?.length ? 'has-children' : '',
        active ? 'is-active' : '',
        ancestor ? 'is-ancestor' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const sub =
        item.children?.length ?
          `<ul class="artform-header__submenu">${item.children
            .map((c) => {
              const subState = navItemState(c.href, pagePath);
              return `<li><a href="${c.href}"${subState.active ? ' class="is-active"' : ''}>${c.label}</a></li>`;
            })
            .join('')}</ul>`
        : '';

      return `<li class="${liClass}"><a href="${item.href}">${item.label}</a>${sub}</li>`;
    })
    .join('\n');

  return `<header class="artform-header" id="artform-header">
  <div class="artform-header__bar">
    <a class="artform-header__logo" href="/">
      <img src="${LOGO_SRC}" width="168" height="73" alt="${site.name}" decoding="async">
    </a>
    <nav class="artform-header__nav" aria-label="Primary navigation">
      <ul class="artform-header__menu">
        ${menuItems}
      </ul>
    </nav>
    <div class="artform-header__ctas">
      <a class="artform-header__btn artform-header__btn--book" href="/book-consultation/">Book Consultation</a>
      <a class="artform-header__btn artform-header__btn--phone" href="tel:${site.phoneTel}">
        <span class="artform-header__phone-label">Call</span>
        ${site.phone}
      </a>
    </div>
    <button type="button" class="artform-header__toggle" aria-expanded="false" aria-label="Open menu">
      <span class="artform-header__toggle-bars" aria-hidden="true">
        <span class="artform-header__toggle-bar"></span>
        <span class="artform-header__toggle-bar"></span>
        <span class="artform-header__toggle-bar"></span>
      </span>
    </button>
  </div>
</header>`;
}

function splitPage($) {
  const header = [];
  const footer = [];
  let content = '';
  $('#page').children().each((_, el) => {
    const $el = $(el);
    const id = $el.attr('id') || '';
    const html = $.html(el);
    if (id === 'content') content = html;
    else if (id === 'colophon' || $el.hasClass('site-footer') || $el.find('#colophon').length) footer.push(html);
    else header.push(html);
  });
  return { header: header.join('\n'), content, footer: footer.join('\n') };
}

async function cacheShellTemplates(headerHtml, footer) {
  const dir = path.join(ROOT, 'templates');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'header.html'), `<!-- Custom header (generated) -->\n${headerHtml}`, 'utf8');
  await fs.writeFile(path.join(dir, 'footer.html'), `<!-- Shared footer — injected on every page -->\n${footer}`, 'utf8');
}

function toLocalHref(href) {
  if (!href) return null;
  href = href.replace(/&amp;/g, '&').trim();
  if (href.startsWith('//')) href = 'https:' + href;
  if (href.startsWith(BASE)) href = href.slice(BASE.length);
  if (href.startsWith('http')) return null;
  if (!href.startsWith('/')) href = '/' + href;
  return href.split('?')[0].split('#')[0];
}

function rewriteUrls(html) {
  return html
    .replaceAll(BASE, '')
    .replace(/https:\/\/artformplasticsurgery\.com/g, '')
    .replace(/srcset="\/wp-content/g, 'srcset="/wp-content')
    .replace(/src="\/wp-content/g, 'src="/wp-content')
    .replace(/href="\/wp-content/g, 'href="/wp-content')
    .replace(/url\(\s*\/wp-content/g, 'url(/wp-content');
}

function titleFromPath(p, scrapedTitle) {
  const map = {
    '/': `Facial Plastic Surgeon Safety Harbor & Tampa | ${site.name}`,
    '/about-us/': `About Us | ${site.name}`,
    '/book-consultation/': `Book a Consultation | ${site.name}`,
    '/contact/': `Contact | ${site.name}`,
    '/gallery/': `Before & After Gallery | ${site.name}`,
    '/services/': `Plastic Surgery Services | ${site.name}`,
    '/meet-dr-kieliszak/': `Meet Dr. Kieliszak | ${site.name}`,
    '/testimonials/': `Patient Reviews | ${site.name}`,
    '/cosmetic-procedures/': `Cosmetic Procedures | ${site.name}`,
    '/functional/': `Reconstructive & Functional Procedures | ${site.name}`,
    '/non-surgical-procedures-2/': `Non-Surgical Procedures | ${site.name}`,
    '/hair-restoration/': `Hair Restoration | ${site.name}`,
    '/skincare/': `Medical Skincare | ${site.name}`,
    '/payment-plans/': `Payment Plans & Financing | ${site.name}`,
    '/blog/': `Blog | ${site.name}`,
    '/privacy-policy/': `Privacy Policy | ${site.name}`,
    '/terms-and-conditions/': `Terms & Conditions | ${site.name}`,
  };
  if (map[p]) return map[p];
  if (scrapedTitle && !scrapedTitle.includes('artformplasticsurgery.com')) {
    return `${scrapedTitle.replace(/\s*-\s*artformplasticsurgery\.com$/i, '').trim()} | ${site.name}`;
  }
  const slug = p.replace(/^\/|\/$/g, '').split('/').pop();
  const words = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${words} | ${site.name}`;
}

function metaDescription(p) {
  const defaults = {
    '/': `Board-certified facial plastic surgeon Dr. Christopher Kieliszak offers rhinoplasty, facelifts, and non-surgical treatments in Safety Harbor and Tampa, FL. Book a consultation.`,
    '/book-consultation/': `Schedule your consultation with Dr. Kieliszak at Art Form Plastic Surgery. Call ${site.phone} or request an appointment online.`,
    '/contact/': `Contact Art Form Plastic Surgery in Safety Harbor and Tampa. Call ${site.phone} or email ${site.email}.`,
  };
  return (
    defaults[p] ||
    `Art Form Plastic Surgery — expert facial plastic surgery with Dr. Christopher Kieliszak in Tampa Bay. Call ${site.phone}.`
  );
}

function schemaJson(p) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalBusiness',
        '@id': `${BASE}/#organization`,
        name: site.name,
        url: BASE,
        telephone: site.phone,
        email: site.email,
        image: '/wp-content/uploads/2024/10/1000513852-removebg-preview-e1730100950292.png',
        address: site.addresses.map((a) => ({
          '@type': 'PostalAddress',
          streetAddress: a.street,
          addressLocality: a.city,
          addressRegion: a.state,
          postalCode: a.zip,
          addressCountry: 'US',
        })),
        sameAs: [site.instagram, site.tiktok],
      },
      {
        '@type': 'Physician',
        name: site.doctor,
        medicalSpecialty: 'Facial Plastic Surgery',
        worksFor: { '@id': `${BASE}/#organization` },
        telephone: site.phone,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          ...(p !== '/'
            ? [{ '@type': 'ListItem', position: 2, name: 'Page', item: `${BASE}${p}` }]
            : []),
        ],
      },
    ],
  });
}

function collectStylesheets($) {
  const seen = new Set();
  const out = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    let href = toLocalHref($(el).attr('href'));
    if (!href || seen.has(href)) return;
    if (!href.includes('/wp-content/')) return;
    /* One Font Awesome bundle — duplicates break icon glyphs */
    if (href.includes('/font-awesome/css/') && !href.includes('all.min.css')) return;
    if (href.includes('/elementor-icons.min.css') && [...seen].some((s) => s.includes('eicons'))) return;
    seen.add(href);
    out.push(`<link rel="stylesheet" href="${href}" media="all">`);
  });
  return out.join('\n  ');
}

function collectInlineStyles($) {
  const ids = ['wp-custom-css', 'uagb-style-frontend', 'global-styles-inline-css', 'astra-theme-css-inline-css'];
  const parts = [];
  $('style').each((_, el) => {
    const id = $(el).attr('id') || '';
    if (ids.some((x) => id.includes(x)) || id.startsWith('simple-banner')) {
      parts.push(`/* ${id} */\n${$(el).html()}`);
    }
  });
  return parts.join('\n');
}

function collectBodyClass($) {
  return ($('body').attr('class') || 'home wp-singular ast-desktop').replace(/\s+/g, ' ').trim();
}

function announcementBar() {
  return `<div class="simple-banner" role="region" aria-label="Announcement"><p class="simple-banner-text">${site.announcement}</p></div>`;
}

function cleanFragment(html) {
  const $w = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  $w('#wrap').find('script, noscript, iframe, link[rel="stylesheet"], style').remove();
  $w('#wrap').find('.poptin, [id*="popup"], #wpadminbar').remove();
  $w('#wrap .simple-banner[style*="display:none"]').removeAttr('style');
  return $w('#wrap').html() || '';
}

function renderHeroConsultForm() {
  return `<div class="artform-consult-form">
  <h3 class="artform-consult-form__title">Consultation With Our Doctor</h3>
  <p class="artform-consult-form__subtitle">Get on a call with Dr. Kieliszak</p>
  <form class="artform-consult-form__form" action="/book-consultation/" method="get" novalidate>
    <div class="artform-consult-form__field">
      <label for="artform-hero-name">Full name</label>
      <input id="artform-hero-name" name="name" type="text" autocomplete="name" required placeholder="Your name">
    </div>
    <div class="artform-consult-form__field">
      <label for="artform-hero-phone">Phone</label>
      <input id="artform-hero-phone" name="phone" type="tel" autocomplete="tel" required placeholder="${site.phone}">
    </div>
    <div class="artform-consult-form__field">
      <label for="artform-hero-email">Email</label>
      <input id="artform-hero-email" name="email" type="email" autocomplete="email" placeholder="you@email.com">
    </div>
    <div class="artform-consult-form__field">
      <label for="artform-hero-message">How can we help?</label>
      <textarea id="artform-hero-message" name="message" rows="3" placeholder="Optional message"></textarea>
    </div>
    <button type="submit" class="artform-consult-form__submit">Request Consultation</button>
  </form>
  <p class="artform-consult-form__thanks" hidden>Thank you — taking you to schedule your consultation…</p>
  <p class="artform-consult-form__phone">Prefer to call? <a href="tel:${site.phoneTel}">${site.phone}</a></p>
</div>`;
}

/** Landing wrapper, consult form, layout fixes for homepage. */
function enhanceHomepage(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  const col = $('[data-id="54fb05d4"] > .elementor-widget-wrap.elementor-element-populated').first();
  if (col.length) {
    col.empty();
    col.append(renderHeroConsultForm());
  }

  const h1 = $('[data-id="30f4f016"] .elementor-heading-title').first();
  if (h1.length) h1.addClass('artform-hero-h1');

  const btnWidget = $('[data-id="5fc4d002"]').first();
  if (btnWidget.length) {
    btnWidget.replaceWith(`<div class="elementor-element artform-hero-subcopy elementor-widget elementor-widget-heading" data-id="artform-hero-sub">
      <div class="elementor-widget-container">
        <h2 class="artform-hero-h2">Board-certified facial plastic surgery in Safety Harbor &amp; Tampa — natural, refined results with Dr. Christopher Kieliszak.</h2>
      </div>
    </div>`);
  }

  const hero = $('.elementor-element-79fd65b0').first();
  const cards = $('.elementor-element-37fbd314').first();
  if (hero.length && cards.length && !hero.parent().hasClass('artform-landing')) {
    const landing = $('<div class="artform-landing"></div>');
    hero.before(landing);
    landing.append(hero);
    landing.append(cards);
  }

  return $('#wrap').html() || html;
}

function buildPageBody($, pagePath) {
  const { content, footer } = splitPage($);
  if (!shellFooter) {
    shellFooter = cleanFragment(footer);
    const headerHtml = renderCustomHeader(pagePath);
    cacheShellTemplates(headerHtml, shellFooter).catch(() => {});
  }
  const h = renderCustomHeader(pagePath);
  let c = fixContent(rewriteUrls(cleanFragment(content)));
  if (pagePath === '/') c = enhanceHomepage(c);
  const f = fixContent(rewriteUrls(shellFooter));
  return `${announcementBar()}${h}${c}${f}`;
}

function layout({ pagePath, title, description, stylesheets, inlineStyles, bodyClass, body }) {
  const favicon = '/wp-content/uploads/2024/10/1000513861-removebg-preview-150x150.png';
  const inlineBlock = inlineStyles
    ? `<style id="replica-inline-custom">\n${inlineStyles}\n</style>`
    : '';
  return `<!DOCTYPE html>
<html lang="en-US" class="replica-build">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  <link rel="icon" href="${favicon}" sizes="32x32">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Antic+Didone&family=Inter:wght@400;600&family=Lato:wght@400;600;700&family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  ${stylesheets}
  ${inlineBlock}
  <link rel="stylesheet" href="/css/replica-fixes.css">
  <link rel="stylesheet" href="/css/artform-header.css">
  ${pagePath === '/' ? '<link rel="stylesheet" href="/css/hero-responsive.css">\n  <link rel="stylesheet" href="/css/artform-landing.css">\n  <link rel="stylesheet" href="/css/hero-typography-fx.css">\n  <link rel="stylesheet" href="/css/home-hero-cards.css">' : ''}
  <link rel="canonical" href="${BASE}${pagePath === '/' ? '/' : pagePath}">
  <script type="application/ld+json">${schemaJson(pagePath)}</script>
</head>
<body class="${bodyClass}" data-chat-src="">
  <a class="skip-link screen-reader-text" href="#content">Skip to content</a>
  <div class="hfeed site" id="page">
    ${body}
  </div>
  <script src="/wp-content/plugins/elementor/assets/lib/swiper/v8/swiper.min.js" defer></script>
  <script src="/js/header-nav.js" defer></script>
  <script src="/js/elementor-animations.js" defer></script>
  <script src="/js/swiper-init.js" defer></script>
  <script src="/js/site.js" defer></script>
  ${pagePath === '/' ? '<script src="/js/home-consult-form.js" defer></script>' : ''}
</body>
</html>`;
}

async function fetchAndParse(pagePath) {
  const url = `${BASE}${pagePath === '/' ? '/' : pagePath}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ArtFormRebuild/2.0 (migration replica)' },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedTitle = $('title').text().trim();
  const stylesheets = collectStylesheets($);
  const inlineStyles = collectInlineStyles($);
  const bodyClass = collectBodyClass($);
  const body = buildPageBody($, pagePath);
  return { scrapedTitle, stylesheets, inlineStyles, bodyClass, body };
}

async function writePage(pagePath, html) {
  const outDir = pagePath === '/' ? DIST : path.join(DIST, pagePath.replace(/^\/|\/$/g, ''));
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf8');
  console.log('  ✓', pagePath);
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function main() {
  shellFooter = null;
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  console.log('Copying public assets (wp-content, css, js)…');
  await copyDir(PUBLIC, DIST);

  console.log('Building', pages.length, 'replica pages…\n');

  for (const pagePath of pages) {
    try {
      const { scrapedTitle, stylesheets, inlineStyles, bodyClass, body } = await fetchAndParse(pagePath);
      const title = titleFromPath(pagePath, scrapedTitle);
      const description = metaDescription(pagePath);
      await writePage(
        pagePath,
        layout({ pagePath, title, description, stylesheets, inlineStyles, bodyClass, body })
      );
      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      console.error('  ✗', pagePath, err.message);
    }
  }

  console.log('\nDone → dist/');
  console.log('Run: npm run serve');
}

main();
