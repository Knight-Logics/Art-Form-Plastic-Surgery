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
      <div class="artform-footer__col">
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

  return $('#wrap').html() || html;
}

/** Replace empty MetForm wrapper on /services/ appointment section. */
function enhanceServices(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const formHtml = renderServicesAppointmentForm();

  const metform = $('.mf-form-wrapper[data-form-id="581"]').first();
  if (metform.length) {
    metform.replaceWith(formHtml);
  } else {
    const widget = $('[data-id="69743078"] .elementor-widget-container').first();
    if (widget.length) widget.html(formHtml);
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

  /* Restore map embed stripped by cleanFragment; add second map below form section */
  const mapWidget = $('.elementor-widget-google_maps .elementor-custom-embed').first();
  if (mapWidget.length) {
    const safety = site.addresses[0];
    const safetyQ = `${safety.street}, ${safety.city}, ${safety.state} ${safety.zip}`;
    mapWidget.html(renderGoogleMapEmbed(`${safety.label} office`, safetyQ));
  }

  if (contactSection.length) {
    const tampa = site.addresses[1];
    const tampaQ = `${tampa.street}, ${tampa.city}, ${tampa.state} ${tampa.zip}`;
    contactSection.after(
      `<div class="artform-contact-maps">${renderGoogleMapEmbed(`${tampa.label} office`, tampaQ)}</div>`
    );
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

/** Blog — fallback image for posts missing thumbnails. */
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
  return $('#wrap').html() || html;
}

/** Gold outline pricing/phone CTAs + homepage-style Book Consultation bubbles. */
function enhanceSharedButtons(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  $('a.elementor-button').each((_, el) => {
    const $a = $(el);
    const text = $a.find('.elementor-button-text').text().replace(/\s+/g, ' ').trim();
    if (/view pricing/i.test(text)) {
      $a.addClass('artform-btn-gold-outline');
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
  if (pagePath === '/services/') c = enhanceServices(c);
  if (pagePath === '/contact/') c = enhanceContact(c);
  if (pagePath === '/payment-plans/') c = enhancePaymentPlans(c);
  if (pagePath === '/blog/') c = enhanceBlog(c);
  return `${announcementBar()}${h}${c}${shellFooter}`;
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
  <link rel="stylesheet" href="/css/artform-footer.css">
  <link rel="stylesheet" href="/css/artform-page-fixes.css">
  ${pagePath === '/' ? '<link rel="stylesheet" href="/css/hero-responsive.css">\n  <link rel="stylesheet" href="/css/artform-landing.css">\n  <link rel="stylesheet" href="/css/hero-typography-fx.css">\n  <link rel="stylesheet" href="/css/home-hero-cards.css">\n  <link rel="stylesheet" href="/css/artform-google-reviews.css">\n  <link rel="stylesheet" href="/css/artform-services.css">\n  <link rel="stylesheet" href="/css/artform-tiktok-feed.css">' : ''}
  ${pagePath === '/services/' || pagePath === '/contact/' ? '<link rel="stylesheet" href="/css/artform-forms.css">' : ''}
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
  ${pagePath === '/' ? '<script src="/js/home-consult-form.js" defer></script>\n  <script src="/js/artform-google-reviews.js" defer></script>\n  <script src="/js/artform-tiktok-feed.js" defer></script>' : ''}
  ${pagePath === '/services/' || pagePath === '/contact/' ? '<script src="/js/artform-contact-form.js" defer></script>' : ''}
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
