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

/** Shared custom footer (generated once per build). */
let shellFooter = null;

const FOOTER_QUICK_LINKS = [
  { label: 'About', href: '/about-us/' },
  { label: 'Services', href: '/services/' },
  { label: 'Gallery', href: '/gallery/' },
  { label: 'Book Consultation', href: '/book-consultation/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Payment Plans', href: '/payment-plans/' },
  { label: 'Contact', href: '/contact/' },
];

const LOGO_SRC = '/wp-content/uploads/2024/10/1000513852-removebg-preview-e1730100950292-186x81.png';

const SERVICE_PREFIXES = [
  '/services/',
  '/cosmetic-procedures/',
  '/functional/',
  '/non-surgical-procedures-2/',
  '/hair-restoration/',
  '/skincare/',
];

const APPOINTMENT_FORM_PATHS = [
  '/services/',
  '/cosmetic-procedures/',
  '/functional/',
  '/non-surgical-procedures-2/',
  '/hair-restoration/',
  '/skincare/',
];

const FORM_PAGE_PATHS = [...APPOINTMENT_FORM_PATHS, '/contact/', '/book-consultation/'];

const ANNOUNCEMENT_LINKS = [
  { label: 'Dr. Christopher Kieliszak', href: '/meet-dr-kieliszak/' },
  { label: 'Facial Plastic Surgeon', href: '/services/' },
  { label: 'Board-Certified', href: '/about-us/' },
  { label: 'Safety Harbor FL', href: '/contact/' },
  { label: 'Accepting New Patients', href: '/book-consultation/' },
  { label: 'Financing Available.', href: '/payment-plans/' },
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

function renderCustomFooter() {
  const year = new Date().getFullYear();
  const addresses = site.addresses
    .map(
      (a) =>
        `<p class="artform-footer__contact-line"><strong>${a.label}:</strong><br>${a.street}, ${a.city}, ${a.state} ${a.zip}</p>`
    )
    .join('\n          ');

  const quickLinks = FOOTER_QUICK_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join('\n          ');

  return `<footer class="artform-footer site-footer" id="colophon" role="contentinfo">
  <div class="artform-footer__inner">
    <div class="artform-footer__grid">
      <div class="artform-footer__brand">
        <a class="artform-footer__logo" href="/">
          <img src="${LOGO_SRC}" width="168" height="73" alt="${site.name}" decoding="async" loading="lazy">
        </a>
        <p class="artform-footer__tagline">${site.doctor} — facial plastic surgery in Safety Harbor &amp; Tampa Bay.</p>
      </div>
      <div class="artform-footer__col artform-footer__col--links">
        <h2 class="artform-footer__heading">Quick Links</h2>
        <nav class="artform-footer__links" aria-label="Footer navigation">
          ${quickLinks}
        </nav>
      </div>
      <div class="artform-footer__col artform-footer__col--contact">
        <h2 class="artform-footer__heading">Contact</h2>
        <div class="artform-footer__contact">
          <p class="artform-footer__contact-line"><a href="tel:${site.phoneTel}">${site.phone}</a></p>
          <p class="artform-footer__contact-line"><a href="mailto:${site.email}">${site.email}</a></p>
          ${addresses}
        </div>
        <h2 class="artform-footer__heading artform-footer__heading--sub">Connect</h2>
        <div class="artform-footer__social">
          <a class="artform-footer__social-link" href="${site.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <img src="/images/social/instagram.svg" width="44" height="44" alt="" decoding="async" loading="lazy">
          </a>
          <a class="artform-footer__social-link" href="${site.tiktok}" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <img src="/images/social/tiktok.svg" width="44" height="44" alt="" decoding="async" loading="lazy">
          </a>
        </div>
      </div>
    </div>
  </div>
  <nav class="artform-footer__legal" aria-label="Legal">
    <a href="/privacy-policy/">Privacy Policy</a>
    <span class="artform-footer__legal-sep" aria-hidden="true">&middot;</span>
    <a href="/terms-and-conditions/">Terms &amp; Conditions</a>
  </nav>
  <div class="artform-footer__bottom">
    <p class="artform-footer__copyright">&copy; 2024&ndash;${year} ${site.name}. All rights reserved.</p>
    <p class="artform-footer__credit-line">
      <a class="artform-footer__credit" href="https://knightlogics.com" target="_blank" rel="noopener noreferrer">Site by Knight Logics</a>
    </p>
  </div>
</footer>`;
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
    '/about-us/': `Learn about Art Form Plastic Surgery and our patient-first approach to facial plastic surgery in Safety Harbor and Tampa Bay.`,
    '/book-consultation/': `Schedule your consultation with Dr. Kieliszak at Art Form Plastic Surgery. Call ${site.phone} or request an appointment online.`,
    '/contact/': `Contact Art Form Plastic Surgery in Safety Harbor and Tampa. Call ${site.phone} or email ${site.email}.`,
    '/gallery/': `View before-and-after results from Dr. Christopher Kieliszak — rhinoplasty, facelifts, injectables, and more in Tampa Bay.`,
    '/services/': `Explore cosmetic, functional, non-surgical, hair restoration, and skincare services with board-certified facial plastic surgeon Dr. Kieliszak.`,
    '/meet-dr-kieliszak/': `Meet Dr. Christopher Kieliszak — board-certified facial plastic surgeon serving Safety Harbor and Tampa, FL.`,
    '/testimonials/': `Read patient reviews and testimonials for Art Form Plastic Surgery in Safety Harbor and Tampa Bay.`,
    '/cosmetic-procedures/': `Cosmetic facial surgery in Tampa Bay — rhinoplasty, facelifts, blepharoplasty, and more with Dr. Christopher Kieliszak.`,
    '/functional/': `Reconstructive and functional facial procedures including Mohs reconstruction, scar revision, and nasal breathing surgery.`,
    '/non-surgical-procedures-2/': `Non-surgical facial aesthetics — injectables, skin treatments, and rejuvenation in Safety Harbor and Tampa.`,
    '/hair-restoration/': `Hair restoration consultations and treatments with facial plastic surgeon Dr. Christopher Kieliszak in Tampa Bay.`,
    '/skincare/': `Medical skincare treatments and personalized plans at Art Form Plastic Surgery in Safety Harbor and Tampa.`,
    '/payment-plans/': `Flexible payment plans and financing options for cosmetic procedures at Art Form Plastic Surgery. Cherry, CareCredit, and PatientFi.`,
    '/blog/': `Facial plastic surgery insights, recovery tips, and practice updates from Dr. Christopher Kieliszak at Art Form Plastic Surgery.`,
    '/privacy-policy/': `Privacy policy for Art Form Plastic Surgery — how we collect, use, and protect your information.`,
    '/terms-and-conditions/': `Terms and conditions for using the Art Form Plastic Surgery website and services.`,
  };
  if (defaults[p]) return defaults[p];
  if (/\/rhinoplasty/i.test(p)) {
    return `Rhinoplasty in Tampa and Safety Harbor with Dr. Christopher Kieliszak — natural, balanced results. Book a consultation at Art Form Plastic Surgery.`;
  }
  if (/\/facelift/i.test(p)) {
    return `Facelift surgery in Tampa Bay with board-certified facial plastic surgeon Dr. Kieliszak. Restore a refreshed, natural appearance.`;
  }
  if (/\/blepharoplasty/i.test(p)) {
    return `Eyelid lift (blepharoplasty) in Safety Harbor and Tampa — brighter, more youthful eyes with Dr. Christopher Kieliszak.`;
  }
  return `Art Form Plastic Surgery — expert facial plastic surgery with Dr. Christopher Kieliszak in Tampa Bay. Call ${site.phone}.`;
}

function breadcrumbName(pagePath) {
  const names = {
    '/': 'Home',
    '/about-us/': 'About',
    '/book-consultation/': 'Book a Consultation',
    '/contact/': 'Contact',
    '/gallery/': 'Gallery',
    '/services/': 'Services',
    '/meet-dr-kieliszak/': 'Meet Dr. Kieliszak',
    '/testimonials/': 'Testimonials',
    '/cosmetic-procedures/': 'Cosmetic Procedures',
    '/functional/': 'Functional Procedures',
    '/non-surgical-procedures-2/': 'Non-Surgical Procedures',
    '/hair-restoration/': 'Hair Restoration',
    '/skincare/': 'Skincare',
    '/payment-plans/': 'Payment Plans',
    '/blog/': 'Blog',
    '/privacy-policy/': 'Privacy Policy',
    '/terms-and-conditions/': 'Terms & Conditions',
  };
  if (names[pagePath]) return names[pagePath];
  const slug = pagePath.replace(/^\/|\/$/g, '').split('/').pop() || 'Page';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function schemaJson(p) {
  const clinics = site.addresses.map((a, i) => ({
    '@type': 'MedicalClinic',
    name: `${site.name} — ${a.label}`,
    telephone: site.phone,
    image: `${BASE}/wp-content/uploads/2024/10/1000513852-removebg-preview-e1730100950292.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: a.street,
      addressLocality: a.city,
      addressRegion: a.state,
      postalCode: a.zip,
      addressCountry: 'US',
    },
    geo: site.geo?.[i]
      ? { '@type': 'GeoCoordinates', latitude: site.geo[i].lat, longitude: site.geo[i].lng }
      : undefined,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
  }));

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
        image: `${BASE}/wp-content/uploads/2024/10/1000513852-removebg-preview-e1730100950292.png`,
        address: site.addresses.map((a) => ({
          '@type': 'PostalAddress',
          streetAddress: a.street,
          addressLocality: a.city,
          addressRegion: a.state,
          postalCode: a.zip,
          addressCountry: 'US',
        })),
        openingHours: site.hours?.weekdays,
        sameAs: [site.instagram, site.tiktok],
        department: clinics,
      },
      {
        '@type': 'Physician',
        name: site.doctor,
        medicalSpecialty: 'Facial Plastic Surgery',
        worksFor: { '@id': `${BASE}/#organization` },
        telephone: site.phone,
        url: `${BASE}/meet-dr-kieliszak/`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          ...(p !== '/'
            ? [{ '@type': 'ListItem', position: 2, name: breadcrumbName(p), item: `${BASE}${p}` }]
            : []),
        ],
      },
    ],
  });
}

function elementorPageId($) {
  const bodyClass = $('body').attr('class') || '';
  const m = bodyClass.match(/elementor-page-(\d+)/);
  return m ? m[1] : null;
}

/** Lean CSS — Elementor layout + page kit only; drops WP plugin bloat (~40 files). */
function collectLeanStylesheets($) {
  const pageId = elementorPageId($);
  const seen = new Set();
  const out = [];

  const allow = [
    /\/elementor\/assets\/css\/frontend\.min\.css$/,
    /\/elementor-pro\/assets\/css\/frontend\.min\.css$/,
    /\/elementor\/assets\/lib\/eicons\/css\/elementor-icons\.min\.css$/,
    /\/elementor\/assets\/lib\/font-awesome\/css\/all\.min\.css$/,
    /\/jeg-elementor-kit\/assets\/css\/elements\/main\.css$/,
    /\/jeg-elementor-kit\/assets\/fonts\/jkiticon\/jkiticon\.css$/,
    /\/uploads\/elementor\/css\/post-969\.css$/,
    /\/elementor\/assets\/css\/widget-heading\.min\.css$/,
    /\/elementor\/assets\/css\/widget-image\.min\.css$/,
    /\/elementor\/assets\/css\/widget-image-gallery\.min\.css$/,
    /\/elementor\/assets\/css\/widget-icon-list\.min\.css$/,
    /\/elementor\/assets\/css\/widget-icon-box\.min\.css$/,
    /\/elementor\/assets\/css\/widget-button\.min\.css$/,
    /\/elementor\/assets\/css\/widget-spacer\.min\.css$/,
    /\/elementor\/assets\/css\/widget-divider\.min\.css$/,
    /\/elementor\/assets\/css\/widget-text-editor\.min\.css$/,
    /\/elementor\/assets\/lib\/animations\/styles\/fadeIn[A-Za-z]+\.min\.css$/,
    /\/elementor\/assets\/lib\/animations\/styles\/e-animation-[a-z]+\.min\.css$/,
    /\/elementor\/assets\/lib\/swiper\/v8\/css\/swiper\.min\.css$/,
    /\/elementor\/assets\/css\/conditionals\/e-swiper\.min\.css$/,
  ];

  if (pageId) allow.push(new RegExp(`/uploads/elementor/css/post-${pageId}\\.css$`));

  $('link[rel="stylesheet"]').each((_, el) => {
    let href = toLocalHref($(el).attr('href'));
    if (!href || seen.has(href) || !href.includes('/wp-content/')) return;
    if (!allow.some((re) => re.test(href))) return;
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
  const inner = ANNOUNCEMENT_LINKS.map(
    (item) => `<a href="${item.href}" class="simple-banner-link">${item.label}</a>`
  ).join('<span class="simple-banner-sep" aria-hidden="true"> | </span>');
  return `<div class="simple-banner" role="region" aria-label="Announcement"><p class="simple-banner-text">${inner}</p></div>`;
}

function cleanFragment(html) {
  const $w = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  $w('#wrap').find('script, noscript, iframe, link[rel="stylesheet"], style').remove();
  $w('#wrap').find('.poptin, [id*="popup"], #wpadminbar').remove();
  $w('#wrap .simple-banner[style*="display:none"]').removeAttr('style');
  return $w('#wrap').html() || '';
}

const CONTACT_GUARANTEES = [
  'Board-certified facial plastic surgeon',
  'One-on-one consultation with Dr. Kieliszak',
  'Safety Harbor & Tampa Bay locations',
  'Financing & payment plans available',
  'Natural, refined aesthetic results',
  'Dedicated, discreet patient care',
];

function renderContactGuaranteesPanel() {
  const items = CONTACT_GUARANTEES.map(
    (text) =>
      `<li class="artform-contact-form__guarantee"><span class="artform-contact-form__check-icon" aria-hidden="true">✓</span><span>${text}</span></li>`
  ).join('\n          ');
  return `<aside class="artform-contact-form__aside" aria-labelledby="artform-ct-guarantees-label">
    <p class="artform-contact-form__aside-title" id="artform-ct-guarantees-label">Why patients choose us</p>
    <ul class="artform-contact-form__guarantees">${items}</ul>
  </aside>`;
}

function renderGoogleMapEmbed(label, addressQuery) {
  const q = encodeURIComponent(addressQuery);
  return `<div class="artform-map">
  <h3 class="artform-map__title">${label}</h3>
  <div class="artform-map__frame">
    <iframe title="Map: ${label}" src="https://maps.google.com/maps?q=${q}&amp;hl=en&amp;z=14&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
  </div>
</div>`;
}

function renderContactMapsBlock() {
  const safety = site.addresses[0];
  const tampa = site.addresses[1];
  const safetyQ = `${safety.street}, ${safety.city}, ${safety.state} ${safety.zip}`;
  const tampaQ = `${tampa.street}, ${tampa.city}, ${tampa.state} ${tampa.zip}`;
  return `<div class="artform-contact-maps artform-contact-maps--dual">
  ${renderGoogleMapEmbed(`${safety.label} office`, safetyQ)}
  ${renderGoogleMapEmbed(`${tampa.label} office`, tampaQ)}
</div>`;
}

function renderPaymentPlansSection() {
  return `<div class="artform-financing">
  <header class="artform-financing__header">
    <p class="artform-financing__kicker">Flexible financing</p>
    <h1 class="artform-financing__title">Payment Plans</h1>
    <p class="artform-financing__subtitle">Explore monthly payment options for your procedure. Checking eligibility is quick and does not require commitment to treatment.</p>
  </header>
  <div class="artform-financing__grid">
    <article class="artform-financing__card">
      <h3>Cherry</h3>
      <p>Apply in minutes for flexible monthly plans with competitive rates.</p>
      <ul>
        <li>Quick online application</li>
        <li>Multiple term lengths</li>
        <li>Ideal for cosmetic procedures</li>
      </ul>
      <a class="artform-financing__cta" href="https://pay.withcherry.com/" target="_blank" rel="noopener noreferrer">Learn about Cherry</a>
    </article>
    <article class="artform-financing__card">
      <h3>CareCredit</h3>
      <p>Healthcare credit card accepted for surgical and non-surgical treatments.</p>
      <ul>
        <li>Widely accepted in medical aesthetics</li>
        <li>Promotional financing may apply</li>
        <li>Manage payments online</li>
      </ul>
      <a class="artform-financing__cta" href="https://www.carecredit.com/" target="_blank" rel="noopener noreferrer">Visit CareCredit</a>
    </article>
    <article class="artform-financing__card">
      <h3>PatientFi</h3>
      <p>Another option for spreading costs into manageable monthly payments.</p>
      <ul>
        <li>Simple approval process</li>
        <li>Transparent terms</li>
        <li>No hidden fees</li>
      </ul>
      <a class="artform-financing__cta" href="https://patientfi.com/" target="_blank" rel="noopener noreferrer">Explore PatientFi</a>
    </article>
  </div>
  <div class="artform-financing__mock" aria-hidden="true">
    <p class="artform-financing__mock-label">Financing application preview (not connected on static preview)</p>
    <div class="artform-financing__mock-ui">
      <span class="artform-financing__mock-pill">Check eligibility</span>
      <span class="artform-financing__mock-pill">Choose your plan</span>
      <span class="artform-financing__mock-pill">Monthly payments</span>
    </div>
  </div>
  <p class="artform-financing__note">Financing is subject to credit approval. Terms vary by provider. Call ${site.phone} to discuss options with our team.</p>
</div>`;
}

const BLOG_FALLBACK_THUMB = '/wp-content/uploads/2024/10/071224-DRCK-0895-Edit-1-scaled.jpg';

/** Services page — replaces empty MetForm shell in white appointment card. */
function renderServicesAppointmentForm() {
  return `<div class="artform-contact-form artform-contact-form--services">
  <h3 class="artform-contact-form__title">Request an Appointment</h3>
  <p class="artform-contact-form__subtitle">Tell us how to reach you and we'll follow up to schedule your visit.</p>
  <form class="artform-contact-form__form artform-contact-form__form--compact" data-source="services" action="/book-consultation/" method="get" novalidate>
    <div class="artform-contact-form__field">
      <label for="artform-svc-name">Full name <span class="artform-contact-form__req">*</span></label>
      <input id="artform-svc-name" name="name" type="text" autocomplete="name" required placeholder="Your name">
    </div>
    <div class="artform-contact-form__field">
      <label for="artform-svc-phone">Phone <span class="artform-contact-form__req">*</span></label>
      <input id="artform-svc-phone" name="phone" type="tel" autocomplete="tel" required placeholder="${site.phone}">
    </div>
    <div class="artform-contact-form__field">
      <label for="artform-svc-email">Email</label>
      <input id="artform-svc-email" name="email" type="email" autocomplete="email" placeholder="you@email.com">
    </div>
    <div class="artform-contact-form__field">
      <label for="artform-svc-message">How can we help?</label>
      <textarea id="artform-svc-message" name="message" rows="3" placeholder="Optional message"></textarea>
    </div>
    <div class="artform-contact-form__submit-row">
      <button type="submit" class="artform-contact-form__submit">Request Appointment</button>
    </div>
  </form>
  <p class="artform-contact-form__thanks" hidden>Thank you — taking you to schedule your consultation…</p>
  <p class="artform-contact-form__phone">Prefer to call? <a href="tel:${site.phoneTel}">${site.phone}</a></p>
</div>`;
}

/** Contact page — replaces WPForms with themed two-column layout. */
function renderContactPageForm() {
  return `<div class="artform-contact-form artform-contact-form--page">
  <header class="artform-contact-form__header">
    <h2 class="artform-contact-form__title">How can we help?</h2>
    <p class="artform-contact-form__subtitle">Feel free to ask a question or simply leave a comment.</p>
  </header>
  <form class="artform-contact-form__form" data-source="contact" action="/book-consultation/" method="get" novalidate>
    <div class="artform-contact-form__grid">
      <div class="artform-contact-form__fields">
        <div class="artform-contact-form__row">
          <div class="artform-contact-form__field">
            <label for="artform-ct-first">First name <span class="artform-contact-form__req">*</span></label>
            <input id="artform-ct-first" name="first" type="text" autocomplete="given-name" required placeholder="First">
          </div>
          <div class="artform-contact-form__field">
            <label for="artform-ct-last">Last name <span class="artform-contact-form__req">*</span></label>
            <input id="artform-ct-last" name="last" type="text" autocomplete="family-name" required placeholder="Last">
          </div>
        </div>
        <div class="artform-contact-form__field">
          <label for="artform-ct-email">Email <span class="artform-contact-form__req">*</span></label>
          <input id="artform-ct-email" name="email" type="email" autocomplete="email" required placeholder="you@email.com">
        </div>
        <div class="artform-contact-form__field">
          <label for="artform-ct-phone">Phone</label>
          <input id="artform-ct-phone" name="phone" type="tel" autocomplete="tel" placeholder="${site.phone}">
        </div>
        <div class="artform-contact-form__field artform-contact-form__field--message">
          <label for="artform-ct-message">Comment or message</label>
          <textarea id="artform-ct-message" name="message" rows="5" placeholder="Your message"></textarea>
        </div>
        <div class="artform-contact-form__submit-row">
          <button type="submit" class="artform-contact-form__submit">Submit</button>
        </div>
      </div>
      ${renderContactGuaranteesPanel()}
    </div>
  </form>
  <p class="artform-contact-form__thanks" hidden>Thank you — taking you to schedule your consultation…</p>
</div>`;
}

function renderHeroConsultForm() {
  return `<div class="artform-consult-form artform-consult-form--hero">
  <p class="artform-consult-form__kicker">Free consultation</p>
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

/** Static TikTok grid (replaces Smash Balloon shortcode on static hosting). */
function renderTikTokFeedWidget() {
  return `<div class="artform-tiktok" data-artform-tiktok>
  <header class="artform-tiktok__header" data-tiktok-header aria-busy="true"></header>
  <div class="artform-tiktok__grid" data-tiktok-grid aria-busy="true"></div>
</div>`;
}

/** Knight Logics–style Google Reviews widget (static shell; JS hydrates from JSON). */
function renderGoogleReviewsWidget() {
  const googleG = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.56 2.98-2.26 5.5-4.82 7.18l7.73 6c4.51-4.16 7.12-10.27 7.12-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>`;
  return `<div class="artform-greviews" data-afg-widget>
  <header class="artform-greviews__header">
    <div class="artform-greviews__brand">
      ${googleG}
      <h2 class="artform-greviews__title">Google Reviews</h2>
    </div>
    <div class="artform-greviews__summary">
      <span class="artform-greviews__stars" aria-hidden="true">★★★★★</span>
      <span data-afg-summary>5.0 • 102 reviews</span>
    </div>
  </header>
  <div class="artform-greviews__tabs" role="tablist" aria-label="Filter reviews">
    <button type="button" class="artform-greviews__tab is-active" role="tab" aria-selected="true" data-afg-tab="all">All</button>
    <button type="button" class="artform-greviews__tab" role="tab" aria-selected="false" data-afg-tab="replied">Replied</button>
    <button type="button" class="artform-greviews__tab" role="tab" aria-selected="false" data-afg-tab="unreplied">Unreplied</button>
  </div>
  <div class="artform-greviews__carousel">
    <button type="button" class="artform-greviews__nav" data-afg-prev aria-label="Previous reviews">
      <svg class="artform-greviews__nav-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="artform-greviews__viewport">
      <div class="artform-greviews__track" data-afg-track></div>
    </div>
    <button type="button" class="artform-greviews__nav" data-afg-next aria-label="Next reviews">
      <svg class="artform-greviews__nav-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M10 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
  <footer class="artform-greviews__footer">
    <a href="https://www.google.com/maps/search/Art+Form+Plastic+Surgery+801+2nd+St+N+Safety+Harbor+FL+34695" target="_blank" rel="noopener noreferrer" data-afg-maps>See our Google profile</a>
    <span aria-hidden="true">•</span>
    <a href="https://www.google.com/maps/search/Art+Form+Plastic+Surgery+801+2nd+St+N+Safety+Harbor+FL+34695" target="_blank" rel="noopener noreferrer" data-afg-write>Leave a review</a>
  </footer>
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
  if (hero.length && !hero.parent().hasClass('artform-landing')) {
    const landing = $('<div class="artform-landing"></div>');
    hero.before(landing);
    landing.append(hero);

    // Consult form → into the hero (right-side panel on desktop, stacked below the image on mobile).
    const formCol = $('.elementor-element-54fb05d4').first();
    const heroInner = hero.find('> .elementor-container').first();
    if (formCol.length && heroInner.length) {
      formCol.addClass('artform-hero-form-col');
      heroInner.append(formCol);
    }

    // "How Can We Help You" → its own full-width row BELOW the hero (same on every screen size).
    if (cards.length) {
      cards.addClass('artform-help-band');
      cards.removeClass('fadeInUp').addClass('fadeInDown');
      const settings = cards.attr('data-settings');
      if (settings) {
        cards.attr('data-settings', settings.replace(/fadeInUp/g, 'fadeInDown'));
      }
      landing.after(cards);
    }
  }

  // Google Reviews (photo + carousel) directly above Our Services; stats bar tucked under reviews only.
  const section3965 = $('.elementor-element-3965ab9f').first();
  const section63d6 = $('.elementor-element-63d63482').first();
  const ourServices = $('.elementor-element-5b9d1682').first();

  if (section63d6.length && ourServices.length) {
    ourServices.before(section63d6);
  }
  if (section3965.length && section63d6.length) {
    section63d6.after(section3965);
    section3965.addClass('artform-stats-band');
  }

  const reviewsWidget = $('.elementor-element-7691a215 .jkit-testimonials').first();
  if (reviewsWidget.length) {
    reviewsWidget.replaceWith(renderGoogleReviewsWidget());
  } else {
    const widgetWrap = $('[data-id="6a3d4f6f"] .elementor-widget-container').first();
    if (widgetWrap.length) {
      widgetWrap.html(renderGoogleReviewsWidget());
    }
  }

  const tiktokFeed = $('.sbtt-tiktok-feed').first();
  if (tiktokFeed.length) {
    tiktokFeed.replaceWith(renderTikTokFeedWidget());
  } else {
    const tiktokShortcode = $('[data-id="e4515a6"] .elementor-shortcode').first();
    if (tiktokShortcode.length) {
      tiktokShortcode.html(renderTikTokFeedWidget());
    }
  }

  return enhancePhotoCollage(enhancePortfolioGallery($('#wrap').html() || html));
}

/** Homepage portfolio gallery — normalize panels + local image URLs. */
function enhancePortfolioGallery(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const gallery = $('.jkit-portfolio-gallery').first();
  if (!gallery.length) return html;

  gallery.find('.row-item.current-item').removeClass('current-item');
  gallery.find('.row-item').first().addClass('current-item');
  gallery.find('.image-item.current-item').removeClass('current-item');
  gallery.find('.image-item').first().addClass('current-item');

  gallery.find('.image-item').each((_, el) => {
    const $el = $(el);
    let bg = ($el.attr('data-background') || '').replace(BASE, '').replace(/https:\/\/artformplasticsurgery\.com/g, '');
    if (!bg) return;
    $el.attr('data-background', bg);
    $el.attr('style', `background-image:url(${bg});`);
  });

  return $('#wrap').html() || html;
}

/** Meet Dr. page — hero consult form, checkmark bullets, photo slide-ins. */
function decodeDataSettings(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  } catch {
    return {};
  }
}

function encodeDataSettings(obj) {
  return JSON.stringify(obj).replace(/"/g, '&quot;');
}

function applySlideAnim($, $el, anim, classPrefix) {
  if (!$el.length) return;
  const parsed = decodeDataSettings($el.attr('data-settings'));
  parsed.animation = anim;
  $el.attr('data-settings', encodeDataSettings(parsed));
  $el.addClass(`${classPrefix}-${anim === 'fadeInLeft' ? 'left' : 'right'}`);
}

/** Shared photo collage — slide-in animations (homepage, About, Meet Dr.). */
function enhancePhotoCollage(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  applySlideAnim($, $('.elementor-element-64b09308').first(), 'fadeInLeft', 'artform-photo-slide');
  applySlideAnim($, $('.elementor-element-1475b12c').first(), 'fadeInRight', 'artform-photo-slide');
  applySlideAnim($, $('.elementor-element-7e9b034a').first(), 'fadeInRight', 'artform-photo-slide');
  applySlideAnim($, $('.elementor-element-7c9abc07').first(), 'fadeInLeft', 'artform-photo-slide');
  applySlideAnim($, $('.elementor-element-6728fa43').first(), 'fadeInRight', 'artform-photo-slide');
  applySlideAnim($, $('.elementor-element-3baa2c4a').first(), 'fadeInRight', 'artform-photo-slide');

  return $('#wrap').html() || html;
}

/** About Us — hero tag + photo collage. */
function enhanceAboutPage(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  $('.elementor-element-21cec6').first().addClass('artform-about-hero');

  return enhancePhotoCollage($('#wrap').html() || html);
}

function enhanceMeetDrPage(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  let formCol = $('.elementor-element-54fb05d4').first();
  if (formCol.length) {
    formCol.remove();
  } else {
    formCol = $(`<div class="elementor-column elementor-col-50 elementor-top-column elementor-element elementor-element-54fb05d4 artform-hero-form-col" data-id="54fb05d4" data-element_type="column" data-e-type="column">
      <div class="elementor-widget-wrap elementor-element-populated"></div>
    </div>`);
  }

  let formWrap = formCol.children('.elementor-widget-wrap.elementor-element-populated').first();
  if (!formWrap.length) {
    formWrap = $('<div class="elementor-widget-wrap elementor-element-populated"></div>');
    formCol.append(formWrap);
  }
  formWrap.empty().append(renderHeroConsultForm());
  formCol.addClass('artform-hero-form-col');

  $('.elementor-element-37fbd314.elementor-hidden-desktop').remove();
  $('.elementor-element-56d013c7').remove();

  const hero = $('.elementor-element-79fd65b0').first();
  if (hero.length && !hero.parent().hasClass('artform-landing')) {
    const landing = $('<div class="artform-landing artform-meet-dr-landing"></div>');
    hero.before(landing);
    landing.append(hero);

    const heroInner = hero.find('> .elementor-container').first();
    if (heroInner.length) heroInner.append(formCol);
  }

  $('[data-id="5fc4d002"] a.elementor-button')
    .attr('href', '/book-consultation/')
    .addClass('artform-btn-book');

  const checkSvg =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
  $('.elementor-widget-jkit_icon_box .icon.style-color').each((_, el) => {
    $(el).empty().addClass('artform-icon-check').html(checkSvg);
  });
  $('.elementor-widget-jkit_icon_box .jkit-icon-box-wrapper').removeClass('hover-from-left');

  return enhancePhotoCollage($('#wrap').html() || html);
}

function renderServiceIntroButton(kind) {
  const isPricing = kind === 'pricing';
  const id = isPricing ? '9a2dc63' : '0822c17';
  const href = isPricing
    ? 'https://art-form-plastic-surgery.kit.com/8eb8f54814'
    : `tel:${site.phoneTel}`;
  const target = isPricing ? ' target="_blank" rel="noopener noreferrer"' : '';
  const cls = isPricing ? 'artform-btn-gold-solid' : 'artform-btn-gold-outline';
  const label = isPricing ? 'View Pricing Information Here' : site.phone;

  return `<div class="elementor-element elementor-element-${id} elementor-widget elementor-widget-button" data-id="${id}" data-element_type="widget" data-widget_type="button.default">
    <div class="elementor-widget-container">
      <div class="elementor-button-wrapper">
        <a class="elementor-button elementor-button-link elementor-size-sm ${cls}" href="${href}"${target}>
          <span class="elementor-button-content-wrapper"><span class="elementor-button-text">${label}</span></span>
        </a>
      </div>
    </div>
  </div>`;
}

function findServiceIntroSections($, root) {
  const intros = [];
  root.find('.elementor-inner-section').each((_, el) => {
    const $intro = $(el);
    const hasOfferHeading = $intro
      .find('h2.elementor-heading-title')
      .toArray()
      .some((h) => /what services we offer/i.test($(h).text()));
    if (hasOfferHeading) intros.push($intro);
  });
  return intros;
}

function applyServiceIntroLayout($, intro) {
  intro.addClass('artform-service-intro');

  // Remove empty spacer columns from /services/ hub (they caused a huge dead zone).
  intro.find('.elementor-element-c1ba743, .elementor-element-34117d92').remove();

  const headCol = intro.find('.elementor-inner-column').first();
  headCol.removeClass('elementor-col-25 elementor-col-50').addClass('elementor-col-100');

  intro.find('.artform-service-intro__ctas').remove();

  const heading = intro
    .find('h2.elementor-heading-title')
    .filter((_, h) => /what services we offer/i.test($(h).text()))
    .first()
    .closest('.elementor-widget-heading');
  const wrap = headCol.find('> .elementor-element-populated > .elementor-widget-wrap').first();

  const pricingButtons = [];
  const phoneButtons = [];
  intro.find('.elementor-widget-button').each((_, el) => {
    const $btn = $(el);
    const text = $btn.text().replace(/\s+/g, ' ').trim();
    if (/view pricing/i.test(text)) pricingButtons.push($btn);
    else if (/\(813\)|563-3735|5633735/.test(text)) phoneButtons.push($btn);
  });

  pricingButtons.slice(1).forEach((el) => $(el).remove());
  phoneButtons.slice(1).forEach((el) => $(el).remove());

  let pricing = pricingButtons[0] ? $(pricingButtons[0]) : null;
  let phone = phoneButtons[0] ? $(phoneButtons[0]) : null;

  if (!pricing) pricing = $(renderServiceIntroButton('pricing'));
  if (!phone) phone = $(renderServiceIntroButton('phone'));

  pricing.removeClass('elementor-align-center');
  phone.removeClass('elementor-align-center');

  const ctaRow = $('<div class="artform-service-intro__ctas"></div>');
  ctaRow.append(pricing);
  ctaRow.append(phone);

  if (heading.length) heading.after(ctaRow);
  else wrap.append(ctaRow);
}

/** Service intro — full-width headings + deduped CTA row above cards (all category page variants). */
function enhanceServiceIntro(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const intros = findServiceIntroSections($, $('#wrap'));
  if (!intros.length) return html;

  intros.forEach((intro) => applyServiceIntroLayout($, intro));

  return $('#wrap').html() || html;
}

/** Remove JKit demo partner logos (Vital Tree, Life Care, etc.) beside appointment forms. */
function removePlaceholderLogos(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  $('.elementor-widget-jkit_client_logo').each((_, widget) => {
    const $w = $(widget);
    const src = $w.find('img').attr('src') || '';
    if (/tree\.png|lifecare\.png|heartcare\.png/i.test(src) || $w.find('img[alt="Title"]').length) {
      const col = $w.closest('.elementor-column');
      $w.remove();
      if (col.length && !col.find('.elementor-widget').length) col.remove();
    }
  });

  $('.elementor-element-169898a1 .elementor-element-7b89c6d0').remove();
  $('.elementor-element-232658a, .elementor-element-69743078')
    .closest('.elementor-column')
    .addClass('artform-appointment-form-col--full');

  return $('#wrap').html() || html;
}

/** Replace empty MetForm shells in appointment sections (services + category pages). */
function enhanceAppointmentForms(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const formHtml = renderServicesAppointmentForm();

  $('.mf-form-wrapper').each((_, el) => {
    $(el).replaceWith(formHtml);
  });

  if (!$('.artform-contact-form--services').length) {
    const widget = $('[data-widget_type="metform.default"] .elementor-widget-container').first();
    if (widget.length) widget.html(formHtml);
  }

  return removePlaceholderLogos($('#wrap').html() || html);
}

/** Book Consultation — ensure IntakeQ mount point survives static clean. */
function enhanceBookConsultation(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const widget = $('[data-id="205bff1"] .elementor-widget-container').first();
  if (widget.length) {
    widget.html('<div id="intakeq" style="max-width:720px;width:100%;margin:0 auto;"></div>');
  } else if (!$('#intakeq').length) {
    $('[data-id="e8fe17f"]').after(
      `<div class="elementor-element elementor-element-artform-intakeq elementor-widget" data-id="artform-intakeq" data-element_type="widget">
        <div class="elementor-widget-container"><div id="intakeq" style="max-width:720px;width:100%;margin:0 auto;"></div></div>
      </div>`
    );
  }
  return $('#wrap').html() || html;
}

/** Replace WPForms on /contact/ with static themed form + guarantees + maps. */
function enhanceContact(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const formHtml = renderContactPageForm();

  const wpforms = $('.elementor-widget-wpforms[data-id="46c3601"]').first();
  if (wpforms.length) {
    wpforms.replaceWith(
      `<div class="elementor-element elementor-element-artform-contact elementor-widget" data-id="artform-contact" data-element_type="widget">
        <div class="elementor-widget-container">${formHtml}</div>
      </div>`
    );
  } else {
    const container = $('.wpforms-container').first();
    if (container.length) container.replaceWith(formHtml);
  }

  const contactSection = $('[data-id="799aee1"]').first();
  contactSection.addClass('artform-contact-section');

  /* Restore Safety Harbor map embed stripped by cleanFragment */
  const mapWidget = $('.elementor-widget-google_maps .elementor-custom-embed').first();
  if (mapWidget.length) {
    const safety = site.addresses[0];
    const safetyQ = `${safety.street}, ${safety.city}, ${safety.state} ${safety.zip}`;
    mapWidget.html(renderGoogleMapEmbed(`${safety.label} office`, safetyQ));
  }

  return $('#wrap').html() || html;
}

/** Payment plans — replace empty Cherry widget shell with financing cards. */
function enhancePaymentPlans(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const widget = $('[data-id="1c1c2e1"] .elementor-widget-container').first();
  if (widget.length) {
    widget.html(renderPaymentPlansSection());
  } else {
    $('#all').parent().html(renderPaymentPlansSection());
  }
  $('[data-id="46589a3"]').remove();
  return $('#wrap').html() || html;
}

const BLOG_PAGE_SIZE = 6;

/** Blog — fallback thumbnails + paginate posts for static Load More. */
function enhanceBlog(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  $('.thumbnail-container.no_thumbnail').each((_, el) => {
    const $el = $(el);
    const label = $el.closest('a').attr('aria-label') || 'Blog post';
    $el.removeClass('no_thumbnail').addClass('artform-blog-fallback');
    $el.html(
      `<img src="${BLOG_FALLBACK_THUMB}" alt="${label.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" width="800" height="450">`
    );
  });

  const posts = $('#wrap .jkit-post').toArray();
  posts.forEach((el, index) => {
    if (index >= BLOG_PAGE_SIZE) $(el).addClass('artform-blog-post--hidden').attr('hidden', '');
  });

  const loadMore = $('#wrap .jkit-pagination-button.jkit-block-loadmore').first();
  if (loadMore.length) {
    if (posts.length <= BLOG_PAGE_SIZE) {
      loadMore.closest('.jkit-block-pagination').remove();
    } else {
      loadMore.attr('data-artform-blog-loadmore', 'true');
    }
  }

  return $('#wrap').html() || html;
}

/**
 * Astra entry-header H1 duplicates Elementor page heroes on some service pages.
 * Keep the visible Elementor H1 and drop the hidden entry-title block.
 */
function stripDuplicateEntryTitle(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const $entryHeader = $('#wrap header.entry-header');
  const $entryH1 = $entryHeader.find('h1.entry-title');
  const $elementorH1 = $('#wrap .entry-content .elementor h1').first();

  if (!$entryH1.length || !$elementorH1.length) return html;

  $entryHeader.find('.artform-hero-desc').remove();
  $entryH1.remove();

  if (!$entryHeader.text().trim()) {
    $entryHeader.addClass('ast-no-title');
  }

  return $('#wrap').html() || html;
}

const SERVICE_HERO_PATHS = ['/services/', ...APPOINTMENT_FORM_PATHS];

/** Tag category hero bands + drop empty spacer sections above them. */
function enhanceServiceHero(html, pagePath) {
  if (!SERVICE_HERO_PATHS.includes(pagePath)) return html;

  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const $elementor = $('#wrap .entry-content .elementor').first();
  if (!$elementor.length) return $('#wrap').html() || html;

  const isHeroBand = ($sec) => {
    const settings = $sec.attr('data-settings') || '';
    const hasBg =
      /background/i.test(settings) || $sec.find('.elementor-background-overlay').length > 0;
    const hasTitle = $sec.find('h1.elementor-heading-title').length > 0;
    return hasBg && hasTitle;
  };

  let heroTagged = false;
  $elementor.children('section.elementor-top-section').each((_, sec) => {
    const $sec = $(sec);
    if (isHeroBand($sec)) {
      $sec.addClass('artform-service-hero');
      heroTagged = true;
      return false;
    }
    if (heroTagged) return false;
    const empty =
      !$sec.text().replace(/\s+/g, '').length && !$sec.find('img, iframe, video, form').length;
    if (empty) $sec.remove();
  });

  return $('#wrap').html() || html;
}

/** White glimmer class on page hero H1s (non-homepage). */
function enhanceHeroH1Markup(html, pagePath) {
  if (pagePath === '/') return html;

  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  $('#wrap #content h1.elementor-heading-title').addClass('artform-hero-h1');
  return $('#wrap').html() || html;
}

/** Gallery hero: keep one intro paragraph under the H1 (drop duplicate right column copy). */
function enhanceGallery(html, pagePath) {
  if (pagePath !== '/gallery/') return html;

  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  $('#wrap .elementor-element-79fd65b0 .elementor-element-56d013c7').remove();
  const $leftCol = $('#wrap .elementor-element-79fd65b0 .elementor-element-54fe6ad8');
  $leftCol.removeClass('elementor-col-50').addClass('elementor-col-100');

  return $('#wrap').html() || html;
}

/** Add a short description under each page hero H1 (except homepage / pages with one already). */
function enhanceHeroDescriptions(html, pagePath) {
  if (pagePath === '/') return html;

  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const h1 =
    $('#wrap .entry-content .elementor h1.elementor-heading-title').first().length > 0
      ? $('#wrap .entry-content .elementor h1.elementor-heading-title').first()
      : $('#wrap #content h1, #wrap #main h1').first();
  if (!h1.length) return html;
  if (h1.next('.artform-hero-desc, .artform-financing__subtitle').length) return html;
  if (h1.parent().siblings('.artform-hero-desc').length) return html;

  const widget = h1.closest('.elementor-widget-heading');
  if (widget.length && widget.next('.artform-hero-desc').length) return html;

  const desc = metaDescription(pagePath);
  h1.after(`<p class="artform-hero-desc">${desc}</p>`);

  return $('#wrap').html() || html;
}

const PROCEDURE_PAGE_PATTERN =
  /\/(rhinoplasty|facelift|blepharoplasty|browlift|buccal|chin-implant|lip-lift|split-ear|mohs|nasal-breathing|scar-revision)/;

const ALT_FROM_SRC = [
  [/071224-DRCK-0895/i, 'Dr. Christopher Kieliszak — facial plastic surgeon'],
  [/071224-DRCK-0015/i, 'Art Form Plastic Surgery patient care'],
  [/1000513852/i, 'Art Form Plastic Surgery logo'],
  [/1000513861/i, 'Art Form Plastic Surgery'],
  [/tree\.png|lifecare\.png|heartcare\.png/i, ''],
];

/** Improve generic Elementor alt text (Title, empty) without changing layout. */
function enhanceImageAlts(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  $('#wrap img').each((_, img) => {
    const $img = $(img);
    const src = $img.attr('src') || '';
    const alt = ($img.attr('alt') || '').trim();
    if (alt && alt !== 'Title') return;

    for (const [re, replacement] of ALT_FROM_SRC) {
      if (re.test(src)) {
        if (replacement) $img.attr('alt', replacement);
        else $img.attr('alt', '').attr('role', 'presentation');
        return;
      }
    }

    const widget = $img.closest('.elementor-widget');
    const heading = widget.find('.elementor-heading-title').first().text().trim();
    if (heading && heading.length < 80) {
      $img.attr('alt', heading);
      return;
    }

    if (!alt || alt === 'Title') {
      const file = src.split('/').pop()?.replace(/\.[a-z]+$/i, '').replace(/[-_]/g, ' ');
      if (file && file.length > 3) $img.attr('alt', file);
    }
  });

  return $('#wrap').html() || html;
}

/**
 * Fix Elementor heading semantics without changing visual size.
 * Kickers (h5/h6 used as small gold labels) → <p> with same widget CSS classes.
 * Missing page H1 → promote first content h2 to h1.
 */
function enhanceHeadingHierarchy(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const $content = $('#wrap');
  const $headingWidgets = $content.find('.elementor-widget-heading .elementor-heading-title');

  let hasH1 = $headingWidgets.filter('h1').length > 0;

  $headingWidgets.each((_, el) => {
    const $el = $(el);
    const tag = ($el.prop('tagName') || '').toLowerCase();
    const cls = $el.attr('class') || 'elementor-heading-title elementor-size-default';
    const inner = $el.html() || '';

    if (tag === 'h5' || tag === 'h6') {
      $el.replaceWith(
        `<p class="${cls} artform-heading-kicker" role="doc-subtitle">${inner}</p>`
      );
      return;
    }

    if (!hasH1 && tag === 'h2') {
      $el.replaceWith(`<h1 class="${cls}">${inner}</h1>`);
      hasH1 = true;
    }
  });

  return $content.html() || html;
}

/** Gold outline pricing/phone CTAs + homepage-style Book Consultation bubbles. */
function enhanceSharedButtons(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  $('a.elementor-button').each((_, el) => {
    const $a = $(el);
    const text = $a.find('.elementor-button-text').text().replace(/\s+/g, ' ').trim();
    if (/view pricing/i.test(text)) {
      $a.addClass('artform-btn-gold-solid');
    }
    if (/\(813\)|563-3735|5633735/.test(text)) {
      $a.addClass('artform-btn-gold-outline');
      $a.attr('href', `tel:${site.phoneTel}`);
    }
    if (/book consultation/i.test(text)) {
      const sectionText = $a.closest('section').text().replace(/\s+/g, ' ');
      if (/schedule an appointment|book a consultation/i.test(sectionText)) {
        $a.addClass('artform-btn-book');
        $a.attr('href', '/book-consultation/');
      }
    }
  });

  return $('#wrap').html() || html;
}

function buildPageBody($, pagePath) {
  const { content } = splitPage($);
  if (!shellFooter) {
    shellFooter = renderCustomFooter();
    cacheShellTemplates(renderCustomHeader(pagePath), shellFooter).catch(() => {});
  }
  const h = renderCustomHeader(pagePath);
  let c = fixContent(rewriteUrls(cleanFragment(content)));
  if (pagePath === '/') c = enhanceHomepage(c);
  else c = enhanceSharedButtons(c);
  if (pagePath === '/about-us/') c = enhanceAboutPage(c);
  if (pagePath === '/meet-dr-kieliszak/') c = enhanceMeetDrPage(c);
  if (APPOINTMENT_FORM_PATHS.includes(pagePath)) c = enhanceAppointmentForms(c);
  if (
    pagePath === '/services/' ||
    APPOINTMENT_FORM_PATHS.includes(pagePath) ||
    PROCEDURE_PAGE_PATTERN.test(pagePath)
  ) {
    c = enhanceServiceIntro(c);
  }
  if (pagePath === '/contact/') c = enhanceContact(c);
  if (pagePath === '/book-consultation/') c = enhanceBookConsultation(c);
  if (pagePath === '/payment-plans/') c = enhancePaymentPlans(c);
  if (pagePath === '/blog/') c = enhanceBlog(c);
  if (pagePath === '/gallery/') c = enhanceGallery(c, pagePath);
  c = enhanceHeadingHierarchy(c);
  c = stripDuplicateEntryTitle(c);
  c = enhanceHeroDescriptions(c, pagePath);
  c = enhanceHeroH1Markup(c, pagePath);
  if (SERVICE_HERO_PATHS.includes(pagePath)) c = enhanceServiceHero(c, pagePath);
  c = enhanceImageAlts(c);
  return `${announcementBar()}${h}${c}${shellFooter}`;
}

function augmentBodyClass(bodyClass, pagePath) {
  let cls = bodyClass;
  if (
    pagePath === '/services/' ||
    APPOINTMENT_FORM_PATHS.includes(pagePath) ||
    PROCEDURE_PAGE_PATTERN.test(pagePath)
  ) {
    cls += ' artform-service-page';
  }
  if (pagePath === '/about-us/') cls += ' artform-about-page';
  if (pagePath === '/meet-dr-kieliszak/') cls += ' artform-meet-dr-page';
  return cls;
}

function leanScriptsForPage(pagePath) {
  const needsSwiper = pagePath === '/' || pagePath === '/gallery/';
  const scripts = ['<script src="/js/header-nav.js" defer></script>'];
  if (needsSwiper) {
    scripts.unshift('<script src="/wp-content/plugins/elementor/assets/lib/swiper/v8/swiper.min.js" defer></script>');
    scripts.push('<script src="/js/swiper-init.js" defer></script>');
  }
  scripts.push('<script src="/js/elementor-animations.js" defer></script>');
  scripts.push('<script src="/js/site.js" defer></script>');
  if (pagePath === '/' || pagePath === '/meet-dr-kieliszak/') {
    scripts.push('<script src="/js/home-consult-form.js" defer></script>');
  }
  if (pagePath === '/') {
    scripts.push('<script src="/js/artform-portfolio-gallery.js" defer></script>');
    scripts.push('<script src="/js/artform-google-reviews.js" defer></script>');
    scripts.push('<script src="/js/artform-tiktok-feed.js" defer></script>');
  }
  if (FORM_PAGE_PATHS.includes(pagePath)) {
    scripts.push('<script src="/js/artform-contact-form.js" defer></script>');
  }
  if (pagePath === '/book-consultation/') {
    scripts.push('<script src="/js/artform-intakeq.js" defer></script>');
  }
  if (pagePath === '/blog/') {
    scripts.push('<script src="/js/artform-blog.js" defer></script>');
  }
  return scripts.join('\n  ');
}

function lcpPreload(pagePath) {
  if (pagePath !== '/') return '';
  const hero = site.heroImage || '/wp-content/uploads/2024/10/071224-DRCK-0895-Edit-1-scaled.jpg';
  return `<link rel="preload" as="image" href="${hero}" fetchpriority="high">`;
}

function layout({ pagePath, title, description, stylesheets, inlineStyles, bodyClass, body }) {
  const pageBodyClass = augmentBodyClass(bodyClass, pagePath);
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
  ${lcpPreload(pagePath)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Antic+Didone&family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
  ${stylesheets}
  ${inlineBlock}
  <link rel="stylesheet" href="/css/replica-fixes.css">
  <link rel="stylesheet" href="/css/artform-layout.css">
  <link rel="stylesheet" href="/css/artform-header.css">
  <link rel="stylesheet" href="/css/artform-footer.css">
  <link rel="stylesheet" href="/css/artform-page-fixes.css">
  <link rel="stylesheet" href="/css/artform-content-typography.css">
  ${pagePath !== '/' ? '<link rel="stylesheet" href="/css/artform-hero-h1.css">' : ''}
  ${pagePath === '/' ? '<link rel="stylesheet" href="/css/hero-responsive.css">\n  <link rel="stylesheet" href="/css/artform-landing.css">\n  <link rel="stylesheet" href="/css/hero-typography-fx.css">\n  <link rel="stylesheet" href="/css/home-hero-cards.css">\n  <link rel="stylesheet" href="/css/artform-portfolio-gallery.css">\n  <link rel="stylesheet" href="/css/artform-google-reviews.css">\n  <link rel="stylesheet" href="/css/artform-services.css">\n  <link rel="stylesheet" href="/css/artform-tiktok-feed.css">' : ''}
  ${pagePath === '/' || pagePath === '/about-us/' || pagePath === '/meet-dr-kieliszak/' ? '<link rel="stylesheet" href="/css/artform-photo-collage.css">' : ''}
  ${pagePath === '/about-us/' ? '<link rel="stylesheet" href="/css/artform-about.css">' : ''}
  ${pagePath === '/meet-dr-kieliszak/' ? '<link rel="stylesheet" href="/css/hero-responsive.css">\n  <link rel="stylesheet" href="/css/artform-landing.css">\n  <link rel="stylesheet" href="/css/home-hero-cards.css">\n  <link rel="stylesheet" href="/css/artform-meet-dr.css">' : ''}
  ${pagePath === '/services/' || APPOINTMENT_FORM_PATHS.includes(pagePath) ? '<link rel="stylesheet" href="/css/artform-forms.css">' : ''}
  ${SERVICE_HERO_PATHS.includes(pagePath) ? '<link rel="stylesheet" href="/css/artform-service-hero.css">' : ''}
  ${pagePath === '/services/' || APPOINTMENT_FORM_PATHS.includes(pagePath) || PROCEDURE_PAGE_PATTERN.test(pagePath) ? '<link rel="stylesheet" href="/css/artform-service-intro.css">' : ''}
  ${pagePath === '/book-consultation/' ? '<link rel="stylesheet" href="/css/artform-book-consultation.css">' : ''}
  <link rel="canonical" href="${BASE}${pagePath === '/' ? '/' : pagePath}">
  <script type="application/ld+json">${schemaJson(pagePath)}</script>
</head>
<body class="${pageBodyClass}" data-chat-src="">
  <a class="skip-link screen-reader-text" href="#content">Skip to content</a>
  <div class="hfeed site" id="page">
    ${body}
  </div>
  ${leanScriptsForPage(pagePath)}
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
  const stylesheets = collectLeanStylesheets($);
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
