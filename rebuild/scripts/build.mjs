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
const googleReviews = JSON.parse(
  await fs.readFile(path.join(PUBLIC, 'data/google-reviews.json'), 'utf8')
);

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
  { label: 'Meet Dr. Kieliszak', href: '/meet-dr-kieliszak/' },
  { label: 'Services', href: '/services/' },
  { label: 'Gallery', href: '/gallery/' },
  { label: 'Reviews', href: '/testimonials/' },
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

const PROCEDURE_PAGE_PATTERN =
  /\/(rhinoplasty|facelift|blepharoplasty|browlift|buccal|chin-implant|lip-lift|split-ear|mohs|nasal-breathing|scar-revision)/;

const ANNOUNCEMENT_LINKS = [
  { label: 'Dr. Christopher Kieliszak', href: '/meet-dr-kieliszak/' },
  { label: 'Facial Plastic Surgeon', href: '/services/' },
  {
    label: 'Board-Certified',
    href: 'https://doctors.mylrh.org/LRHPhysicianGroup/details/254158/christopher-kieliszak-otolaryngology-lakeland?Languages=1%2C26&Practices=102484%2C388&SortBy=GivenName&SortDirection=Asc&Specialties=20%2C43%2C73%2C10%2C15%2C51%2C8%2C56%2C53',
    external: true,
  },
  {
    label: 'Safety Harbor FL',
    href: 'https://business.safetyharborchamber.com/list/member/art-form-plastic-surgery-4421',
    external: true,
  },
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
  const previewNotice = site.previewNotice ?
    `<p class="artform-footer__preview-notice">${site.previewNotice}</p>`
  : '';
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
    ${previewNotice}
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
    .replace(/https?:\/\/artformplasticsurgery-com\.preview-domain\.com\/registration\/?/g, '/book-consultation/')
    .replace(/https?:\/\/artformplasticsurgery-com\.preview-domain\.com/g, '')
    .replace(/href="\/registration\/?"/g, 'href="/book-consultation/"')
    .replace(/srcset="\/wp-content/g, 'srcset="/wp-content')
    .replace(/src="\/wp-content/g, 'src="/wp-content')
    .replace(/href="\/wp-content/g, 'href="/wp-content')
    .replace(/url\(\s*\/wp-content/g, 'url(/wp-content');
}

const SERVICE_AREAS = [
  'Safety Harbor',
  'Tampa',
  'Tampa Bay',
  'Clearwater',
  'St. Petersburg',
  'Palm Harbor',
  'Dunedin',
  'Westchase',
  'Brandon',
];

const DEFAULT_LOCAL_LINKS = [
  { label: 'Book a consultation', href: '/book-consultation/' },
  { label: 'Meet Dr. Kieliszak', href: '/meet-dr-kieliszak/' },
  { label: 'View before and after gallery', href: '/gallery/' },
  { label: 'Contact Safety Harbor and Tampa offices', href: '/contact/' },
];

const SEO_PROFILES = {
  '/': {
    title: `Facial Plastic Surgeon Safety Harbor & Tampa | ${site.name}`,
    h1: 'Facial Plastic Surgeon in Safety Harbor & Tampa',
    breadcrumb: 'Home',
    description:
      'Board-certified facial plastic surgeon Dr. Christopher Kieliszak offers rhinoplasty, facelifts, eyelid surgery, injectables, hair restoration, and skincare in Safety Harbor and Tampa.',
    heroDescription:
      'Natural-looking facial plastic surgery, non-surgical aesthetics, hair restoration, and medical skincare for patients in Safety Harbor, Tampa, Clearwater, St. Petersburg, and Tampa Bay.',
    serviceName: 'Facial plastic surgery',
    keywords: [
      'facial plastic surgeon Safety Harbor',
      'facial plastic surgeon Tampa',
      'plastic surgeon near me',
      'rhinoplasty Tampa',
      'facelift Tampa',
      'blepharoplasty Tampa',
      'Botox Tampa',
      'dermal fillers Tampa',
      'hair restoration Tampa',
      'medical skincare Tampa Bay',
    ],
    content: {
      kicker: 'Tampa Bay facial plastic surgery',
      title: 'Natural-looking facial plastic surgery for Safety Harbor, Tampa and Tampa Bay',
      body: [
        'Art Form Plastic Surgery helps patients who are searching for a board-certified facial plastic surgeon near Safety Harbor, Tampa, Clearwater, St. Petersburg and the greater Tampa Bay area. Dr. Christopher Kieliszak focuses on facial balance, refined outcomes and treatment plans that fit each patient instead of chasing an overdone look.',
        'The practice brings surgical and non-surgical facial aesthetics together in one local setting, including rhinoplasty, facelift surgery, blepharoplasty, brow lift, chin implant, lip lift, Mohs reconstruction, scar revision, Botox, dermal fillers, PRP hair restoration and medical skincare.',
      ],
      bullets: [
        'Safety Harbor and Tampa office locations for local consultation access',
        'Procedure planning for cost, recovery, candidacy and natural-looking results',
        'Financing options for cosmetic surgery, injectables, hair restoration and skincare',
      ],
      links: [
        { label: 'Explore facial plastic surgery services', href: '/services/' },
        { label: 'View rhinoplasty, facelift and eyelid results', href: '/gallery/' },
        { label: 'Schedule a consultation in Safety Harbor or Tampa', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'What areas does Art Form Plastic Surgery serve?',
          a: 'Art Form Plastic Surgery serves Safety Harbor, Tampa, Tampa Bay, Clearwater, St. Petersburg, Palm Harbor, Dunedin, Westchase, Brandon and nearby Florida communities.',
        },
        {
          q: 'What facial procedures are most requested locally?',
          a: 'Common local searches include rhinoplasty, facelift, blepharoplasty, Botox, dermal fillers, hair restoration, scar revision and medical skincare treatments.',
        },
      ],
    },
  },
  '/about-us/': {
    title: `About Art Form Plastic Surgery | Safety Harbor & Tampa`,
    h1: 'About Art Form Plastic Surgery',
    breadcrumb: 'About',
    description:
      'Learn about Art Form Plastic Surgery, a Safety Harbor and Tampa facial plastic surgery practice focused on natural-looking results, patient education, and discreet care.',
    serviceName: 'Facial plastic surgery consultation',
    keywords: ['Art Form Plastic Surgery Safety Harbor', 'facial plastic surgery Tampa Bay', 'board-certified facial plastic surgeon'],
    content: {
      kicker: 'About the practice',
      title: 'A Tampa Bay facial plastic surgery practice built around thoughtful planning',
      body: [
        'Patients from Safety Harbor, Tampa, Clearwater and St. Petersburg choose Art Form Plastic Surgery for individualized facial plastic surgery and aesthetic care. The practice emphasizes consultation, education and realistic expectations so patients understand procedure options, recovery and financing before moving forward.',
        'This local focus supports both cosmetic and functional goals, including natural-looking facial rejuvenation, nasal breathing improvement, skin cancer reconstruction, hair restoration and non-surgical facial aesthetics.',
      ],
      bullets: ['Safety Harbor and Tampa offices', 'Facial plastic surgery specialty focus', 'Consultation-centered care for Tampa Bay patients'],
      links: DEFAULT_LOCAL_LINKS,
      faqs: [
        {
          q: 'Why choose a facial plastic surgery practice?',
          a: 'A facial plastic surgery practice focuses on the face, nose, eyelids, neck, skin and hairline, which supports more specialized planning for facial balance and natural-looking results.',
        },
      ],
    },
  },
  '/book-consultation/': {
    title: `Book Facial Plastic Surgery Consultation | Safety Harbor & Tampa`,
    h1: 'Book a Consultation in Safety Harbor or Tampa',
    breadcrumb: 'Book a Consultation',
    description:
      `Request a facial plastic surgery consultation with ${site.doctor} in Safety Harbor or Tampa. Discuss rhinoplasty, facelift, eyelid surgery, injectables, hair restoration, skincare, cost, recovery, and financing.`,
    serviceName: 'Facial plastic surgery consultation',
    keywords: ['book plastic surgery consultation Tampa', 'facial plastic surgery consultation Safety Harbor', 'cosmetic surgery financing Tampa'],
    content: {
      kicker: 'Consultation planning',
      title: 'Start with a local consultation for procedure goals, cost and recovery',
      body: [
        'A consultation is the best next step for patients comparing rhinoplasty, facelift, blepharoplasty, Botox, fillers, scar revision, hair restoration or medical skincare in the Tampa Bay area. The team reviews your goals, timeline, medical history and office preference before recommending a plan.',
        'Patients can ask about recovery time, before-and-after expectations, financing through Cherry, CareCredit or PatientFi, and whether a Safety Harbor or Tampa appointment is more convenient.',
      ],
      bullets: ['Discuss candidacy and realistic outcomes', 'Review cost ranges and financing options', 'Choose Safety Harbor or Tampa office access'],
      links: [
        { label: 'View financing options', href: '/payment-plans/' },
        { label: 'Contact both office locations', href: '/contact/' },
        { label: 'Read patient reviews', href: '/testimonials/' },
      ],
      faqs: [
        {
          q: 'What should I ask during a consultation?',
          a: 'Ask about candidacy, surgical or non-surgical options, recovery time, cost, financing, risks, before-and-after examples, and whether treatment is available in Safety Harbor or Tampa.',
        },
      ],
    },
  },
  '/contact/': {
    title: `Contact Facial Plastic Surgeon | Safety Harbor & Tampa`,
    h1: 'Contact Art Form Plastic Surgery',
    breadcrumb: 'Contact',
    description:
      `Contact Art Form Plastic Surgery in Safety Harbor and Tampa. Call ${site.phone}, email ${site.email}, or request a consultation for facial plastic surgery and aesthetic treatments.`,
    serviceName: 'Facial plastic surgery office',
    keywords: ['plastic surgeon Safety Harbor phone', 'plastic surgeon Tampa office', 'facial plastic surgery near me'],
    content: {
      kicker: 'Two Tampa Bay offices',
      title: 'Convenient contact options for Safety Harbor, Tampa and nearby communities',
      body: [
        'Art Form Plastic Surgery welcomes consultation requests from Safety Harbor, Tampa, Clearwater, St. Petersburg, Palm Harbor, Dunedin, Westchase, Brandon and surrounding Tampa Bay communities. Patients can call, email or use the contact form to ask about facial plastic surgery, injectables, hair restoration, skincare and financing.',
      ],
      bullets: ['Safety Harbor office near North Pinellas communities', 'Tampa office convenient to South Tampa and Hyde Park', 'Appointment requests for cosmetic, functional and non-surgical care'],
      links: [
        { label: 'Book consultation online', href: '/book-consultation/' },
        { label: 'Explore services', href: '/services/' },
        { label: 'View payment plans', href: '/payment-plans/' },
      ],
      faqs: [
        {
          q: 'Which office should I contact?',
          a: 'Patients may contact the same practice phone or email for either the Safety Harbor or Tampa office. The team can help route appointment requests based on location and procedure interest.',
        },
      ],
    },
  },
  '/gallery/': {
    title: `Before & After Gallery | Rhinoplasty, Facelift, Eyelid Surgery Tampa`,
    h1: 'Before & After Gallery',
    breadcrumb: 'Gallery',
    description:
      'View facial plastic surgery before-and-after photos including rhinoplasty, facelift, eyelid surgery, injectables, and facial rejuvenation for Tampa Bay patients.',
    serviceName: 'Before and after gallery',
    keywords: ['rhinoplasty before and after Tampa', 'facelift before and after Tampa', 'blepharoplasty before and after Tampa'],
    content: {
      kicker: 'Before and after research',
      title: 'Review natural-looking results before your Tampa Bay consultation',
      body: [
        'Before-and-after photos help patients compare rhinoplasty, facelift, blepharoplasty, injectables and facial rejuvenation outcomes before scheduling a consultation. Look for changes that appear balanced, refreshed and consistent with the patient’s natural features.',
        'Patients from Safety Harbor, Tampa, Clearwater and St. Petersburg often use the gallery to prepare questions about candidacy, downtime, scars, recovery and expected refinement.',
      ],
      bullets: ['Compare procedure-specific outcomes', 'Use gallery examples to guide consultation questions', 'Focus on natural-looking facial balance rather than overdone change'],
      links: [
        { label: 'Rhinoplasty in Tampa and Safety Harbor', href: '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/' },
        { label: 'Facelift in Tampa Bay', href: '/facelift-rhytidectomy-rejuvenate-your-appearance-and-renew-confidence/' },
        { label: 'Eyelid surgery in Tampa', href: '/blepharoplasty-eyelid-lift-refresh-and-brighten-your-eyes-with-a-youthful-look/' },
      ],
      faqs: [
        {
          q: 'What should I look for in before-and-after photos?',
          a: 'Look for facial balance, natural expression, scar placement, profile changes, eye rejuvenation, neck contour and whether the result fits the patient rather than looking overcorrected.',
        },
      ],
    },
  },
  '/services/': {
    title: `Facial Plastic Surgery Services | Safety Harbor & Tampa`,
    h1: 'Facial Plastic Surgery Services in Tampa Bay',
    breadcrumb: 'Services',
    description:
      'Explore facial plastic surgery, rhinoplasty, facelift, eyelid surgery, injectables, hair restoration, and medical skincare services in Safety Harbor and Tampa.',
    serviceName: 'Facial plastic surgery services',
    keywords: ['plastic surgery services Tampa', 'cosmetic facial surgery Safety Harbor', 'facial rejuvenation Tampa Bay'],
    content: {
      kicker: 'Service overview',
      title: 'Surgical and non-surgical facial aesthetics for Tampa Bay patients',
      body: [
        'Art Form Plastic Surgery organizes care around the face, nose, neck, hairline and skin. Patients searching for facial plastic surgery services in Safety Harbor or Tampa can compare cosmetic procedures, reconstructive and functional procedures, injectables, hair restoration and skincare in one place.',
        'Each service pathway supports common patient questions about candidacy, cost, recovery time, financing, before-and-after expectations and natural-looking results.',
      ],
      bullets: ['Cosmetic facial surgery: rhinoplasty, facelift, blepharoplasty, brow lift, chin implant and lip lift', 'Functional and reconstructive care: Mohs reconstruction, nasal breathing surgery, scar revision and split earlobe repair', 'Non-surgical options: Botox, dermal fillers, PRP hair restoration and medical skincare'],
      links: [
        { label: 'Cosmetic procedures', href: '/cosmetic-procedures/' },
        { label: 'Functional and reconstructive procedures', href: '/functional/' },
        { label: 'Non-surgical procedures', href: '/non-surgical-procedures-2/' },
        { label: 'Hair restoration', href: '/hair-restoration/' },
        { label: 'Skincare', href: '/skincare/' },
      ],
      faqs: [
        {
          q: 'Which service page should I start with?',
          a: 'Start with cosmetic procedures for appearance-focused surgery, functional for breathing or reconstruction, non-surgical for Botox and fillers, hair restoration for thinning hair, and skincare for texture, pigmentation and maintenance.',
        },
      ],
    },
  },
  '/cosmetic-procedures/': {
    title: `Cosmetic Facial Surgery Tampa Bay | Rhinoplasty, Facelift, Blepharoplasty`,
    h1: 'Cosmetic Facial Surgery in Safety Harbor & Tampa',
    breadcrumb: 'Cosmetic Procedures',
    description:
      'Cosmetic facial surgery in Tampa Bay including rhinoplasty, facelift, blepharoplasty, brow lift, buccal fat removal, chin implant, and lip lift with Dr. Kieliszak.',
    serviceName: 'Cosmetic facial surgery',
    keywords: ['cosmetic facial surgery Tampa', 'rhinoplasty Tampa', 'facelift Tampa', 'blepharoplasty Safety Harbor', 'chin implant Tampa'],
    content: {
      kicker: 'Cosmetic facial procedures',
      title: 'Procedure-specific cosmetic surgery for facial balance and natural refinement',
      body: [
        'Cosmetic facial surgery searches in Tampa Bay often focus on rhinoplasty cost, facelift recovery, blepharoplasty before and after, chin augmentation, lip lift, buccal fat removal and brow lift options. Art Form Plastic Surgery adds local consultation planning to those questions so patients understand what is realistic for their anatomy and lifestyle.',
        'Rather than treating each feature in isolation, Dr. Kieliszak considers facial balance, profile, skin quality and long-term aging patterns for patients from Safety Harbor, Tampa, Clearwater and St. Petersburg.',
      ],
      bullets: ['Rhinoplasty and chin implant can be discussed together for profile balance', 'Facelift, neck lift, brow lift and blepharoplasty may be combined for facial rejuvenation', 'Lip lift and buccal fat removal are tailored to subtle contouring goals'],
      links: [
        { label: 'Rhinoplasty (nose job)', href: '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/' },
        { label: 'Facelift surgery', href: '/facelift-rhytidectomy-rejuvenate-your-appearance-and-renew-confidence/' },
        { label: 'Blepharoplasty eyelid lift', href: '/blepharoplasty-eyelid-lift-refresh-and-brighten-your-eyes-with-a-youthful-look/' },
        { label: 'Chin implant', href: '/chin-implant-enhance-your-profile-with-a-balanced-defined-chin/' },
        { label: 'Lip lift', href: '/lip-lift-enhance-your-smile-and-achieve-fuller-youthful-lips/' },
      ],
      faqs: [
        {
          q: 'What cosmetic facial surgery is popular in Tampa Bay?',
          a: 'High-intent local searches commonly include rhinoplasty, facelift, mini facelift, blepharoplasty, brow lift, chin implant, lip lift, buccal fat removal and before-and-after photos.',
        },
      ],
    },
  },
  '/functional/': {
    title: `Functional & Reconstructive Facial Surgery | Tampa & Safety Harbor`,
    h1: 'Functional & Reconstructive Facial Procedures',
    breadcrumb: 'Functional Procedures',
    description:
      'Functional and reconstructive facial procedures in Safety Harbor and Tampa, including Mohs reconstruction, scar revision, split earlobe repair, nasal breathing surgery, and functional rhinoplasty.',
    serviceName: 'Functional and reconstructive facial surgery',
    keywords: ['functional rhinoplasty Tampa', 'Mohs reconstruction Tampa', 'scar revision Tampa', 'nasal breathing surgery Safety Harbor'],
    content: {
      kicker: 'Functional and reconstructive care',
      title: 'Local reconstructive and functional facial care for breathing, scars and skin cancer repair',
      body: [
        'Functional and reconstructive facial surgery supports patients dealing with nasal obstruction, deviated septum symptoms, nasal valve collapse, Mohs surgery defects, visible scars, keloids, hypertrophic scars and split earlobes. These concerns often affect comfort, confidence and daily function.',
        'Art Form Plastic Surgery serves Safety Harbor, Tampa and Tampa Bay patients who need thoughtful repair with attention to both function and appearance.',
      ],
      bullets: ['Nasal breathing procedures may include functional rhinoplasty, septoplasty concepts or nasal valve support', 'Mohs reconstruction helps restore facial form after skin cancer removal', 'Scar revision and split earlobe repair focus on improved contour and discreet healing'],
      links: [
        { label: 'Nasal breathing procedures', href: '/nasal-breathing-procedures-achieve-lasting-relief-from-nasal-obstruction/' },
        { label: 'Mohs reconstruction', href: '/mohs-reconstruction-restoring-natural-beauty-after-skin-cancer-removal/' },
        { label: 'Scar revision', href: '/scar-revision-minimizing-scars-for-smoother-natural-looking-skin/' },
        { label: 'Split earlobe repair', href: '/split-earlobe-repair-restore-the-natural-look-of-your-earlobes/' },
      ],
      faqs: [
        {
          q: 'Can functional facial surgery also improve appearance?',
          a: 'Many functional or reconstructive procedures are planned with both goals in mind: improving breathing, comfort or closure while preserving natural facial shape and minimizing visible scars.',
        },
      ],
    },
  },
  '/non-surgical-procedures-2/': {
    title: `Non-Surgical Facial Aesthetics Tampa | Botox, Fillers & Injectables`,
    h1: 'Non-Surgical Facial Aesthetics in Safety Harbor & Tampa',
    breadcrumb: 'Non-Surgical Procedures',
    description:
      'Non-surgical facial aesthetics in Safety Harbor and Tampa, including Botox, Jeuveau, Dysport, Xeomin, Juvederm, Restylane, dermal fillers, and non-surgical rhinoplasty options.',
    serviceName: 'Non-surgical facial aesthetics',
    keywords: ['Botox Tampa', 'dermal fillers Tampa', 'injectables Safety Harbor', 'non-surgical rhinoplasty Tampa', 'Jeuveau Dysport Xeomin Tampa'],
    content: {
      kicker: 'Injectables and subtle refinement',
      title: 'Botox, wrinkle relaxers and dermal fillers for natural-looking facial rejuvenation',
      body: [
        'Patients searching for Botox near Tampa, dermal fillers in Safety Harbor or non-surgical rhinoplasty options often want visible improvement without surgical downtime. Art Form Plastic Surgery offers wrinkle relaxers such as Botox, Jeuveau, Dysport and Xeomin, plus fillers such as Juvederm, Restylane and other products.',
        'The goal is conservative, personalized correction: smoothing lines, restoring volume, refining facial contours and supporting a refreshed appearance that still looks like you.',
      ],
      bullets: ['Wrinkle relaxers for forehead lines, frown lines and crow’s feet', 'Dermal fillers for lips, cheeks, chin, jawline, under-eye hollowing and facial balancing', 'Non-surgical rhinoplasty may be discussed for select temporary contour concerns'],
      links: [
        { label: 'Book an injectable consultation', href: '/book-consultation/' },
        { label: 'View facial rejuvenation gallery', href: '/gallery/' },
        { label: 'Explore medical skincare', href: '/skincare/' },
      ],
      faqs: [
        {
          q: 'How long do Botox and fillers last?',
          a: 'Wrinkle relaxers often last several months, while dermal filler longevity varies by product, placement and metabolism. Your consultation will cover expected duration and maintenance timing.',
        },
        {
          q: 'Can injectables look natural?',
          a: 'Yes. Conservative dosing, precise placement and facial-balance planning help avoid an overfilled or frozen appearance.',
        },
      ],
    },
  },
  '/hair-restoration/': {
    title: `Hair Restoration Tampa Bay | PRP, FUE & Hair Loss Treatment`,
    h1: 'Hair Restoration in Safety Harbor & Tampa',
    breadcrumb: 'Hair Restoration',
    description:
      'Hair restoration consultations in Tampa Bay for thinning hair, PRP hair restoration, FUE/FUT hair transplant planning, PDO threads for hair loss, and natural hairline goals.',
    serviceName: 'Hair restoration',
    keywords: ['hair restoration Tampa', 'PRP hair restoration Tampa', 'FUE hair transplant Tampa Bay', 'hair loss treatment Safety Harbor'],
    content: {
      kicker: 'Hair loss treatment',
      title: 'Hair restoration options for thinning hair, PRP and transplant planning',
      body: [
        'Hair restoration searches in Tampa Bay often include PRP hair restoration, FUE hair transplant, FUT hair transplant, hairline restoration, hair loss treatment and natural-looking density. Art Form Plastic Surgery helps patients compare surgical and non-surgical options based on pattern, goals and maintenance needs.',
        'Treatment planning may include PRP, transplant referral or planning, PDO thread support for scalp health and medical strategies that protect existing hair.',
      ],
      bullets: ['PRP hair restoration uses concentrated growth factors from your blood', 'FUE and FUT hair transplant questions can be reviewed during consultation', 'PDO threads for hair loss may support scalp health and collagen response'],
      links: [
        { label: 'Schedule hair restoration consultation', href: '/book-consultation/' },
        { label: 'Meet Dr. Kieliszak', href: '/meet-dr-kieliszak/' },
        { label: 'Explore payment plans', href: '/payment-plans/' },
      ],
      faqs: [
        {
          q: 'What is the difference between PRP and a hair transplant?',
          a: 'PRP is a non-surgical injection series intended to support follicle health, while a hair transplant relocates follicles from a donor area to thinning areas. Some patients benefit from both approaches.',
        },
      ],
    },
  },
  '/skincare/': {
    title: `Medical Skincare Tampa Bay | Chemical Peels, Texture & Sun Damage`,
    h1: 'Medical Skincare in Safety Harbor & Tampa',
    breadcrumb: 'Skincare',
    description:
      'Medical skincare in Safety Harbor and Tampa for texture, pigmentation, sun damage, acne scarring, chemical peels, collagen support, and facial rejuvenation maintenance.',
    serviceName: 'Medical skincare',
    keywords: ['medical skincare Tampa', 'chemical peel Tampa', 'skin rejuvenation Safety Harbor', 'sun damage treatment Tampa Bay'],
    content: {
      kicker: 'Skin quality and maintenance',
      title: 'Medical skincare for texture, pigmentation, sun damage and long-term skin quality',
      body: [
        'Florida sun exposure makes skincare especially important for patients in Safety Harbor, Tampa, Clearwater and St. Petersburg. Medical skincare can support smoother texture, more even tone, collagen health, acne-scar improvement, pigmentation care and maintenance after facial procedures.',
        'Depending on skin type and goals, a personalized plan may include medical-grade products, chemical peels, resurfacing discussions, pigment control and maintenance treatments that complement injectables or surgery.',
      ],
      bullets: ['Support for sun damage, fine lines, uneven tone and texture', 'Chemical peels and medical-grade products for ongoing maintenance', 'Skincare planning before and after facial plastic surgery or injectables'],
      links: [
        { label: 'Explore non-surgical facial aesthetics', href: '/non-surgical-procedures-2/' },
        { label: 'Book skincare consultation', href: '/book-consultation/' },
        { label: 'View gallery', href: '/gallery/' },
      ],
      faqs: [
        {
          q: 'Why pair skincare with facial procedures?',
          a: 'Healthy skin can improve the look of facial rejuvenation results by supporting texture, tone, collagen quality and long-term maintenance.',
        },
      ],
    },
  },
  '/payment-plans/': {
    title: `Cosmetic Surgery Financing Tampa Bay | Payment Plans`,
    h1: 'Payment Plans for Cosmetic Procedures',
    breadcrumb: 'Payment Plans',
    description:
      'Explore cosmetic surgery financing and payment plans in Tampa Bay, including Cherry, CareCredit, and PatientFi options for facial plastic surgery, injectables, hair restoration, and skincare.',
    serviceName: 'Cosmetic procedure financing',
    keywords: ['cosmetic surgery financing Tampa', 'plastic surgery payment plans Tampa Bay', 'CareCredit facial plastic surgery'],
    content: {
      kicker: 'Financing options',
      title: 'Flexible payment planning for facial plastic surgery and aesthetics',
      body: [
        'Patients researching rhinoplasty cost, facelift cost, blepharoplasty cost, hair restoration cost or injectable pricing in Tampa Bay often want to understand financing before booking. Art Form Plastic Surgery provides information about Cherry, CareCredit and PatientFi so patients can evaluate monthly payment options.',
      ],
      bullets: ['Financing may be available for surgical and non-surgical procedures', 'Discuss cost ranges during a consultation', 'Payment terms vary by provider and credit approval'],
      links: [
        { label: 'Book consultation', href: '/book-consultation/' },
        { label: 'Explore services', href: '/services/' },
        { label: 'Contact the office', href: '/contact/' },
      ],
      faqs: [
        {
          q: 'Can financing be discussed before treatment?',
          a: 'Yes. Financing options can be reviewed during consultation planning so patients understand potential payment pathways before committing to care.',
        },
      ],
    },
  },
  '/blog/': {
    title: `Facial Plastic Surgery Blog Tampa Bay | Recovery, Cost & Results`,
    h1: 'Facial Plastic Surgery Blog',
    breadcrumb: 'Blog',
    description:
      'Read Tampa Bay facial plastic surgery articles about rhinoplasty, facelift, blepharoplasty, scar revision, split earlobe repair, recovery, cost, and natural-looking results.',
    serviceName: 'Facial plastic surgery education',
    keywords: ['facial plastic surgery blog Tampa', 'rhinoplasty recovery Tampa', 'facelift recovery Tampa', 'scar revision Tampa'],
    content: {
      kicker: 'Patient education',
      title: 'Local procedure guides for Tampa Bay patients researching facial plastic surgery',
      body: [
        'The Art Form Plastic Surgery blog helps patients compare procedure options before a consultation. Topics include rhinoplasty recovery, facelift planning, blepharoplasty, scar revision, split earlobe repair, procedure costs, financing and questions to ask before surgery.',
      ],
      bullets: ['Research procedure recovery before booking', 'Compare surgical and non-surgical options', 'Use articles to prepare consultation questions'],
      links: [
        { label: 'Rhinoplasty guide', href: '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/' },
        { label: 'Scar revision guide', href: '/scar-revision-minimizing-scars-for-smoother-natural-looking-skin/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'Can blog articles replace a consultation?',
          a: 'No. Articles are for education. A consultation is needed to assess anatomy, medical history, candidacy, cost and treatment planning.',
        },
      ],
    },
  },
  '/meet-dr-kieliszak/': {
    title: `Meet Dr. Christopher Kieliszak | Facial Plastic Surgeon Tampa Bay`,
    h1: 'Meet Dr. Christopher Kieliszak',
    breadcrumb: 'Meet Dr. Kieliszak',
    description:
      'Meet Dr. Christopher Kieliszak, board-certified facial plastic surgeon serving Safety Harbor, Tampa, Clearwater, St. Petersburg, and Tampa Bay patients.',
    serviceName: 'Facial plastic surgeon',
    keywords: ['Dr Christopher Kieliszak Tampa', 'facial plastic surgeon Safety Harbor', 'board-certified facial plastic surgeon Tampa Bay'],
    content: {
      kicker: 'Surgeon expertise',
      title: 'A facial plastic surgeon focused on natural-looking, individualized results',
      body: [
        'Patients choosing a facial plastic surgeon in Tampa Bay often compare training, board certification, before-and-after results and communication style. Dr. Christopher Kieliszak brings a face-focused perspective to rhinoplasty, facial rejuvenation, reconstruction, injectables, hair restoration and skincare planning.',
        'His consultation approach emphasizes facial balance, patient education and long-term planning for Safety Harbor and Tampa patients who want to look refreshed rather than overdone.',
      ],
      bullets: ['Facial plastic surgery specialty focus', 'Safety Harbor and Tampa patient access', 'Planning around natural-looking results and recovery'],
      links: [
        { label: 'Explore services', href: '/services/' },
        { label: 'Read patient reviews', href: '/testimonials/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'Why does surgeon selection matter for facial procedures?',
          a: 'Facial procedures require detailed knowledge of anatomy, symmetry, scars, expression and aging patterns. Surgeon selection influences planning, safety and how natural the result appears.',
        },
      ],
    },
  },
  '/testimonials/': {
    title: `Patient Reviews | Art Form Plastic Surgery Safety Harbor & Tampa`,
    h1: 'Patient Reviews for Art Form Plastic Surgery',
    breadcrumb: 'Patient Reviews',
    description:
      'Read patient reviews for Art Form Plastic Surgery in Safety Harbor and Tampa. Learn why Tampa Bay patients choose Dr. Kieliszak for facial plastic surgery and aesthetics.',
    serviceName: 'Patient reviews',
    keywords: ['Art Form Plastic Surgery reviews', 'plastic surgeon reviews Safety Harbor', 'facial plastic surgeon reviews Tampa'],
    content: {
      kicker: 'Patient experience',
      title: 'Reviews help Tampa Bay patients choose a facial plastic surgery practice',
      body: [
        'Patient testimonials offer insight into consultation experience, communication, recovery support and trust. Reviews are especially helpful for people comparing facial plastic surgery near Safety Harbor, Tampa, Clearwater and St. Petersburg.',
      ],
      bullets: ['Read about consultation and care experience', 'Compare local patient feedback', 'Use reviews with gallery photos and surgeon credentials'],
      links: DEFAULT_LOCAL_LINKS,
      faqs: [
        {
          q: 'How should I use patient reviews?',
          a: 'Use reviews as one part of research along with surgeon credentials, procedure education, before-and-after photos and an in-person or virtual consultation.',
        },
      ],
    },
  },
  '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/': {
    title: `Rhinoplasty Tampa & Safety Harbor | Nose Job Surgeon`,
    h1: 'Rhinoplasty (Nose Job) in Tampa & Safety Harbor',
    breadcrumb: 'Rhinoplasty',
    description:
      'Rhinoplasty and nose job consultations in Tampa and Safety Harbor with Dr. Kieliszak. Discuss facial harmony, breathing, recovery, cost, revision rhinoplasty, and natural-looking results.',
    serviceName: 'Rhinoplasty',
    keywords: ['rhinoplasty Tampa', 'nose job Tampa', 'rhinoplasty cost Tampa', 'rhinoplasty recovery Tampa', 'best rhinoplasty surgeon Tampa', 'revision rhinoplasty Tampa'],
    content: {
      kicker: 'Rhinoplasty and nasal balance',
      title: 'Rhinoplasty planning for facial harmony, profile balance and breathing questions',
      body: [
        'Rhinoplasty is one of the most searched facial plastic surgery procedures in Tampa Bay. Patients often research nose job cost, recovery time, dorsal hump reduction, nasal tip refinement, crooked nose correction, revision rhinoplasty and whether cosmetic rhinoplasty can be combined with breathing improvement.',
        'Dr. Kieliszak evaluates the nose in relation to the chin, lips, cheeks and overall facial balance so results look natural from the front, side and three-quarter view.',
      ],
      bullets: ['Primary and revision rhinoplasty consultation questions', 'Cosmetic and functional nasal concerns including airflow and deviated septum symptoms', 'Related profile-balancing options such as chin implant or non-surgical filler discussion'],
      links: [
        { label: 'Nasal breathing procedures', href: '/nasal-breathing-procedures-achieve-lasting-relief-from-nasal-obstruction/' },
        { label: 'Chin implant for profile balance', href: '/chin-implant-enhance-your-profile-with-a-balanced-defined-chin/' },
        { label: 'Rhinoplasty before and after gallery', href: '/gallery/' },
      ],
      faqs: [
        {
          q: 'How long is rhinoplasty recovery?',
          a: 'Many patients plan for one to two weeks of visible swelling or bruising, with activity restrictions for several weeks and subtle refinement continuing for months.',
        },
        {
          q: 'Can rhinoplasty improve breathing?',
          a: 'If nasal obstruction is related to structure, functional rhinoplasty concepts may be discussed along with cosmetic goals during consultation.',
        },
      ],
    },
  },
  '/facelift-rhytidectomy-rejuvenate-your-appearance-and-renew-confidence/': {
    title: `Facelift Tampa Bay | Mini Facelift, Neck Lift & Rhytidectomy`,
    h1: 'Facelift (Rhytidectomy) in Tampa & Safety Harbor',
    breadcrumb: 'Facelift',
    description:
      'Facelift, mini facelift, rhytidectomy, and neck lift consultations in Tampa Bay. Discuss jowls, jawline definition, recovery, cost, and natural-looking facial rejuvenation.',
    serviceName: 'Facelift',
    keywords: ['facelift Tampa', 'mini facelift Tampa', 'deep plane facelift Tampa', 'neck lift Tampa', 'facelift cost Tampa', 'facelift recovery Tampa'],
    content: {
      kicker: 'Facial rejuvenation',
      title: 'Facelift and neck lift planning for jowls, jawline and natural-looking rejuvenation',
      body: [
        'Facelift searches in Tampa Bay often include mini facelift, deep plane facelift, neck lift, jowl treatment, jawline definition, recovery time and cost. The right approach depends on skin laxity, facial structure, neck changes, goals and downtime tolerance.',
        'Dr. Kieliszak helps patients compare surgical facial rejuvenation with related options such as blepharoplasty, brow lift, skincare and injectables for balanced, refreshed results.',
      ],
      bullets: ['Mini facelift questions for early jowling and shorter recovery goals', 'Facelift and neck lift planning for lower face and neck laxity', 'Combination options with eyelid surgery, brow lift or skincare'],
      links: [
        { label: 'Blepharoplasty eyelid lift', href: '/blepharoplasty-eyelid-lift-refresh-and-brighten-your-eyes-with-a-youthful-look/' },
        { label: 'Brow lift', href: '/browlift-restore-a-youthful-look-with-a-smooth-elevated-brow/' },
        { label: 'Facelift before and after gallery', href: '/gallery/' },
      ],
      faqs: [
        {
          q: 'What is the difference between a facelift and mini facelift?',
          a: 'A mini facelift usually targets earlier lower-face laxity with a shorter recovery, while a more comprehensive facelift may address deeper jowling, jawline and neck changes.',
        },
        {
          q: 'How long should I plan for facelift recovery?',
          a: 'Recovery varies, but many patients plan for two or more weeks before social activities, with swelling and refinement improving over time.',
        },
      ],
    },
  },
  '/blepharoplasty-eyelid-lift-refresh-and-brighten-your-eyes-with-a-youthful-look/': {
    title: `Blepharoplasty Tampa | Eyelid Surgery & Eyelid Lift`,
    h1: 'Blepharoplasty (Eyelid Surgery) in Tampa & Safety Harbor',
    breadcrumb: 'Blepharoplasty',
    description:
      'Blepharoplasty and eyelid lift consultations in Tampa and Safety Harbor for upper eyelid hooding, lower eyelid bags, tired eyes, recovery, cost, and natural-looking results.',
    serviceName: 'Blepharoplasty',
    keywords: ['blepharoplasty Tampa', 'eyelid surgery Tampa', 'upper eyelid surgery Tampa', 'lower blepharoplasty Tampa', 'eyelid lift Safety Harbor'],
    content: {
      kicker: 'Eyelid surgery',
      title: 'Upper and lower eyelid surgery for a rested, refreshed look',
      body: [
        'Blepharoplasty patients often search for eyelid surgery cost, upper eyelid hooding, lower eyelid bags, puffy eyes, tired eyes, vision obstruction and recovery time. The goal is a brighter, more rested look that does not appear surprised or overcorrected.',
      ],
      bullets: ['Upper blepharoplasty for heavy or hooded eyelids', 'Lower blepharoplasty for under-eye bags and contour', 'May be paired with brow lift, facelift, skincare or injectables'],
      links: [
        { label: 'Brow lift', href: '/browlift-restore-a-youthful-look-with-a-smooth-elevated-brow/' },
        { label: 'Facelift', href: '/facelift-rhytidectomy-rejuvenate-your-appearance-and-renew-confidence/' },
        { label: 'View eyelid results', href: '/gallery/' },
      ],
      faqs: [
        {
          q: 'Is blepharoplasty for upper lids, lower lids or both?',
          a: 'Blepharoplasty may address upper eyelid hooding, lower eyelid bags or both, depending on anatomy and goals.',
        },
      ],
    },
  },
  '/browlift-restore-a-youthful-look-with-a-smooth-elevated-brow/': {
    title: `Brow Lift Tampa Bay | Forehead Lift & Tired Eye Rejuvenation`,
    h1: 'Brow Lift in Tampa & Safety Harbor',
    breadcrumb: 'Brow Lift',
    description:
      'Brow lift and forehead lift consultations in Tampa Bay for heavy brows, forehead lines, tired eyes, eyelid heaviness, recovery, and natural-looking rejuvenation.',
    serviceName: 'Brow lift',
    keywords: ['brow lift Tampa', 'forehead lift Tampa', 'heavy brow correction Tampa', 'endoscopic brow lift Tampa'],
    content: {
      kicker: 'Brow and forehead rejuvenation',
      title: 'Brow lift planning for heavy brows, forehead lines and tired eyes',
      body: [
        'A brow lift may help patients bothered by low brows, forehead heaviness, tired eyes or upper-face aging. In Tampa Bay searches, brow lift is often compared with Botox, upper blepharoplasty and facelift surgery.',
      ],
      bullets: ['Discuss brow position, eyelid heaviness and facial expression', 'Compare surgical brow lift with Botox or blepharoplasty', 'Plan recovery and scar placement during consultation'],
      links: [
        { label: 'Blepharoplasty eyelid lift', href: '/blepharoplasty-eyelid-lift-refresh-and-brighten-your-eyes-with-a-youthful-look/' },
        { label: 'Non-surgical wrinkle relaxers', href: '/non-surgical-procedures-2/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'Is a brow lift the same as eyelid surgery?',
          a: 'No. Brow lift changes brow position and forehead support, while blepharoplasty removes or repositions eyelid skin and fat. Some patients benefit from both.',
        },
      ],
    },
  },
  '/buccal-fat-removal-sculpt-your-cheeks-for-a-slimmer-contoured-look/': {
    title: `Buccal Fat Removal Tampa | Cheek Contouring Safety Harbor`,
    h1: 'Buccal Fat Removal in Tampa & Safety Harbor',
    breadcrumb: 'Buccal Fat Removal',
    description:
      'Buccal fat removal and cheek contouring consultations in Tampa Bay. Discuss candidacy, recovery, cost, facial slimming, and whether the result will age naturally.',
    serviceName: 'Buccal fat removal',
    keywords: ['buccal fat removal Tampa', 'cheek contouring Tampa', 'facial slimming Safety Harbor', 'buccal fat removal cost Tampa'],
    content: {
      kicker: 'Cheek contouring',
      title: 'Buccal fat removal for carefully selected cheek-slimming candidates',
      body: [
        'Buccal fat removal is a facial contouring procedure for select patients who want more cheek definition. Because over-removal can age the face, consultation should focus on anatomy, long-term facial volume and whether buccal fat removal or another contouring option is best.',
      ],
      bullets: ['Discuss cheek fullness and facial structure', 'Review recovery, swelling and long-term volume considerations', 'Compare with chin implant, jawline filler or skincare options'],
      links: [
        { label: 'Chin implant', href: '/chin-implant-enhance-your-profile-with-a-balanced-defined-chin/' },
        { label: 'Dermal fillers', href: '/non-surgical-procedures-2/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'Is buccal fat removal permanent?',
          a: 'Buccal fat removal is generally considered permanent, which is why candidacy and long-term facial aging should be discussed carefully during consultation.',
        },
      ],
    },
  },
  '/chin-implant-enhance-your-profile-with-a-balanced-defined-chin/': {
    title: `Chin Implant Tampa | Chin Augmentation & Profile Balance`,
    h1: 'Chin Implant & Chin Augmentation in Tampa',
    breadcrumb: 'Chin Implant',
    description:
      'Chin implant and chin augmentation consultations in Tampa Bay for profile balance, weak chin, jawline definition, rhinoplasty pairing, recovery, and cost.',
    serviceName: 'Chin augmentation',
    keywords: ['chin implant Tampa', 'chin augmentation Tampa', 'mentoplasty Tampa', 'jawline definition Tampa', 'profile balancing rhinoplasty'],
    content: {
      kicker: 'Profile balancing',
      title: 'Chin augmentation to support profile balance and jawline definition',
      body: [
        'Chin implant and chin augmentation searches often overlap with rhinoplasty because chin projection can change how the nose and jawline appear in profile. Dr. Kieliszak can review whether chin implant, dermal filler or another approach fits your anatomy.',
      ],
      bullets: ['Profile balance with rhinoplasty or facial contouring', 'Jawline definition for a recessed or weak chin', 'Recovery, incision placement and implant sizing questions'],
      links: [
        { label: 'Rhinoplasty', href: '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/' },
        { label: 'Buccal fat removal', href: '/buccal-fat-removal-sculpt-your-cheeks-for-a-slimmer-contoured-look/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'Can chin augmentation be combined with rhinoplasty?',
          a: 'Yes. Some patients discuss chin augmentation and rhinoplasty together because both procedures can influence facial profile balance.',
        },
      ],
    },
  },
  '/lip-lift-enhance-your-smile-and-achieve-fuller-youthful-lips/': {
    title: `Lip Lift Tampa | Upper Lip Lift vs Filler Safety Harbor`,
    h1: 'Lip Lift in Tampa & Safety Harbor',
    breadcrumb: 'Lip Lift',
    description:
      'Lip lift consultations in Tampa Bay for upper lip balance, tooth show, Cupid’s bow definition, lip lift vs filler, scar placement, recovery, and cost.',
    serviceName: 'Lip lift',
    keywords: ['lip lift Tampa', 'upper lip lift Tampa', 'lip lift cost Tampa', 'lip lift vs filler Tampa'],
    content: {
      kicker: 'Lip enhancement',
      title: 'Lip lift planning for upper lip shape, tooth show and natural proportion',
      body: [
        'A lip lift can shorten the distance between the nose and upper lip, improve tooth show and create a more defined upper lip without relying only on filler volume. Patients often compare lip lift surgery with lip filler during consultation.',
      ],
      bullets: ['Bullhorn and upper lip lift questions', 'Lip lift vs dermal filler comparison', 'Scar placement, recovery and long-term maintenance discussion'],
      links: [
        { label: 'Dermal fillers', href: '/non-surgical-procedures-2/' },
        { label: 'Facial contouring procedures', href: '/cosmetic-procedures/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'How is a lip lift different from lip filler?',
          a: 'A lip lift changes upper lip position and tooth show surgically, while filler adds temporary volume. The best choice depends on anatomy and goals.',
        },
      ],
    },
  },
  '/split-earlobe-repair-restore-the-natural-look-of-your-earlobes/': {
    title: `Split Earlobe Repair Tampa | Torn Earlobe Surgery Safety Harbor`,
    h1: 'Split Earlobe Repair in Tampa & Safety Harbor',
    breadcrumb: 'Split Earlobe Repair',
    description:
      'Split earlobe and torn earlobe repair consultations in Tampa Bay. Restore stretched or torn earlobes from earrings, gauges, trauma, or piercing changes.',
    serviceName: 'Split earlobe repair',
    keywords: ['split earlobe repair Tampa', 'torn earlobe repair Tampa', 'earlobe repair Safety Harbor', 'stretched earlobe repair Tampa'],
    content: {
      kicker: 'Earlobe repair',
      title: 'Repair torn, stretched or split earlobes with discreet local care',
      body: [
        'Split earlobe repair helps patients with torn earring holes, stretched piercings, gauge changes or traumatic earlobe injuries. The goal is a cleaner contour that can heal discreetly and, when appropriate, allow future re-piercing after adequate recovery.',
      ],
      bullets: ['Torn earlobe and stretched piercing repair', 'Local anesthesia and outpatient planning questions', 'Scar care and re-piercing timing discussion'],
      links: [
        { label: 'Functional procedures', href: '/functional/' },
        { label: 'Book consultation', href: '/book-consultation/' },
        { label: 'Payment plans', href: '/payment-plans/' },
      ],
      faqs: [
        {
          q: 'Can I pierce my ear again after earlobe repair?',
          a: 'Many patients can consider re-piercing after the earlobe has healed, but timing and placement should be discussed during follow-up care.',
        },
      ],
    },
  },
  '/mohs-reconstruction-restoring-natural-beauty-after-skin-cancer-removal/': {
    title: `Mohs Reconstruction Tampa Bay | Skin Cancer Facial Repair`,
    h1: 'Mohs Reconstruction in Tampa & Safety Harbor',
    breadcrumb: 'Mohs Reconstruction',
    description:
      'Mohs reconstruction and facial skin cancer repair consultations in Tampa Bay. Restore facial contour after Mohs surgery with attention to scars, function, and natural appearance.',
    serviceName: 'Mohs reconstruction',
    keywords: ['Mohs reconstruction Tampa', 'skin cancer reconstruction Tampa', 'facial reconstruction after Mohs Safety Harbor', 'Mohs repair Tampa Bay'],
    content: {
      kicker: 'Skin cancer reconstruction',
      title: 'Facial reconstruction after Mohs surgery with attention to scars and function',
      body: [
        'Mohs reconstruction helps restore facial form after skin cancer removal. Patients often need repair around the nose, eyelids, ears, lips, cheeks or forehead, where scar placement, function and contour matter.',
      ],
      bullets: ['Coordination after Mohs surgery or dermatology referral', 'Repair planning for nose, eyelid, ear, lip and cheek defects', 'Scar care and healing guidance for Tampa Bay patients'],
      links: [
        { label: 'Scar revision', href: '/scar-revision-minimizing-scars-for-smoother-natural-looking-skin/' },
        { label: 'Functional procedures', href: '/functional/' },
        { label: 'Contact the office', href: '/contact/' },
      ],
      faqs: [
        {
          q: 'When should Mohs reconstruction be planned?',
          a: 'Timing depends on the Mohs defect, location and dermatology plan. Contact the office as early as possible so repair options can be discussed.',
        },
      ],
    },
  },
  '/nasal-breathing-procedures-achieve-lasting-relief-from-nasal-obstruction/': {
    title: `Nasal Breathing Surgery Tampa | Functional Rhinoplasty & Septoplasty`,
    h1: 'Nasal Breathing Procedures in Tampa & Safety Harbor',
    breadcrumb: 'Nasal Breathing Procedures',
    description:
      'Nasal breathing procedure consultations in Tampa Bay for nasal obstruction, deviated septum symptoms, nasal valve collapse, functional rhinoplasty, septoplasty concepts, and improved airflow.',
    serviceName: 'Nasal breathing procedures',
    keywords: ['functional rhinoplasty Tampa', 'nasal breathing surgery Tampa', 'deviated septum Tampa', 'nasal valve collapse Tampa', 'septoplasty Tampa'],
    content: {
      kicker: 'Breathe easier',
      title: 'Functional nasal evaluation for obstruction, deviated septum symptoms and airflow concerns',
      body: [
        'Nasal obstruction can affect sleep, exercise and daily comfort. Patients searching for functional rhinoplasty, septoplasty, deviated septum treatment or nasal valve collapse repair in Tampa Bay can discuss both internal airflow and external nasal support during consultation.',
      ],
      bullets: ['Evaluate nasal valve collapse, septum deviation symptoms and prior nasal trauma', 'Discuss functional rhinoplasty and cosmetic rhinoplasty overlap', 'Plan recovery, activity restrictions and insurance questions when relevant'],
      links: [
        { label: 'Rhinoplasty', href: '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/' },
        { label: 'Functional procedures', href: '/functional/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'Is functional rhinoplasty different from cosmetic rhinoplasty?',
          a: 'Functional rhinoplasty focuses on nasal airflow and support, while cosmetic rhinoplasty focuses on appearance. Some patients discuss both goals in one treatment plan.',
        },
      ],
    },
  },
  '/scar-revision-minimizing-scars-for-smoother-natural-looking-skin/': {
    title: `Scar Revision Tampa | Keloid, Surgical & Facial Scar Treatment`,
    h1: 'Scar Revision in Tampa & Safety Harbor',
    breadcrumb: 'Scar Revision',
    description:
      'Scar revision consultations in Tampa Bay for facial scars, surgical scars, keloids, hypertrophic scars, acne scars, trauma scars, recovery, cost, and smoother-looking skin.',
    serviceName: 'Scar revision',
    keywords: ['scar revision Tampa', 'keloid scar treatment Tampa', 'surgical scar revision Tampa', 'facial scar revision Safety Harbor', 'acne scar treatment Tampa Bay'],
    content: {
      kicker: 'Scar improvement',
      title: 'Scar revision options for facial, surgical, keloid and trauma scars',
      body: [
        'Scar revision searches often include keloid scars, hypertrophic scars, surgical scars, acne scars, trauma scars, laser resurfacing, excision, steroid injections, recovery and cost. No treatment can erase a scar completely, but careful revision can improve contour, texture, color and visibility.',
      ],
      bullets: ['Facial scar and post-surgical scar assessment', 'Keloid or hypertrophic scar treatment planning', 'Recovery and long-term scar maturation guidance'],
      links: [
        { label: 'Mohs reconstruction', href: '/mohs-reconstruction-restoring-natural-beauty-after-skin-cancer-removal/' },
        { label: 'Medical skincare', href: '/skincare/' },
        { label: 'Book consultation', href: '/book-consultation/' },
      ],
      faqs: [
        {
          q: 'Can scar revision remove a scar completely?',
          a: 'No scar can be fully erased, but scar revision may make a scar flatter, smoother, better positioned or less noticeable over time.',
        },
      ],
    },
  },
  '/privacy-policy/': {
    title: `Privacy Policy | ${site.name}`,
    h1: 'Privacy Policy',
    breadcrumb: 'Privacy Policy',
    description: 'Privacy policy for Art Form Plastic Surgery in Safety Harbor and Tampa, including how website information is collected, used, and protected.',
    keywords: ['Art Form Plastic Surgery privacy policy'],
  },
  '/terms-and-conditions/': {
    title: `Terms & Conditions | ${site.name}`,
    h1: 'Terms & Conditions',
    breadcrumb: 'Terms & Conditions',
    description: 'Terms and conditions for using the Art Form Plastic Surgery website and requesting information from the Safety Harbor and Tampa practice.',
    keywords: ['Art Form Plastic Surgery terms and conditions'],
  },
};

function seoProfile(p) {
  return SEO_PROFILES[p] || {};
}

function titleFromPath(p, scrapedTitle) {
  const profile = seoProfile(p);
  if (profile.title) return profile.title;
  const cleaned = (scrapedTitle || '')
    .replace(/\s*[-|]\s*artformplasticsurgery\.com$/i, '')
    .replace(/\s*[-|]\s*Art Form Plastic Surgery$/i, '')
    .trim();
  if (cleaned) {
    return `${cleaned} | ${site.name}`;
  }
  const slug = p.replace(/^\/|\/$/g, '').split('/').pop();
  const words = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${words} | ${site.name}`;
}

function metaDescription(p) {
  const profile = seoProfile(p);
  if (profile.description) return profile.description;
  return `Art Form Plastic Surgery — expert facial plastic surgery with Dr. Christopher Kieliszak in Tampa Bay. Call ${site.phone}.`;
}

function breadcrumbName(pagePath) {
  const profile = seoProfile(pagePath);
  if (profile.breadcrumb) return profile.breadcrumb;
  const slug = pagePath.replace(/^\/|\/$/g, '').split('/').pop() || 'Page';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function schemaJson(p) {
  const profile = seoProfile(p);
  const description = metaDescription(p);
  const title = profile.h1 || breadcrumbName(p);
  const faqItems = profile.content?.faqs || [];
  const areaServed = SERVICE_AREAS.map((name) => ({ '@type': 'City', name }));
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

  const graph = [
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
      areaServed,
      department: clinics,
    },
    {
      '@type': 'Physician',
      name: site.doctor,
      medicalSpecialty: 'Facial Plastic Surgery',
      worksFor: { '@id': `${BASE}/#organization` },
      telephone: site.phone,
      url: `${BASE}/meet-dr-kieliszak/`,
      areaServed,
    },
    {
      '@type': 'MedicalWebPage',
      '@id': `${BASE}${p === '/' ? '/' : p}#webpage`,
      url: `${BASE}${p === '/' ? '/' : p}`,
      name: title,
      description,
      about: profile.keywords?.join(', ') || 'Facial plastic surgery',
      isPartOf: { '@id': `${BASE}/#organization` },
      primaryImageOfPage: `${BASE}${site.heroImageFull || site.heroImage}`,
      areaServed,
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
  ];

  if (profile.serviceName) {
    graph.push({
      '@type': 'Service',
      name: profile.serviceName,
      description,
      provider: { '@id': `${BASE}/#organization` },
      areaServed,
      serviceType: profile.serviceName,
      url: `${BASE}${p === '/' ? '/' : p}`,
    });
  }

  if (faqItems.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
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
    (item) =>
      `<a href="${item.href}" class="simple-banner-link"${item.external ? ' target="_blank" rel="noopener"' : ''}>${item.label}</a>`
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

function escapeMapHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Contact page map embed (map only — no reviews panel). */
function renderContactMap(label, addressQuery) {
  const q = encodeURIComponent(`Art Form Plastic Surgery, ${addressQuery}`);
  return `<div class="artform-map artform-map--contact">
  <h3 class="artform-map__title">${escapeMapHtml(label)}</h3>
  <div class="artform-map__card">
    <div class="artform-map__frame">
      <iframe title="Map: ${escapeMapHtml(label)}" src="https://maps.google.com/maps?q=${q}&amp;hl=en&amp;z=15&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>
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

const CONSULT_SUBTITLE = 'Request a consultation with Art Form Plastic Surgery';

const FORM_PHI_NOTICE =
  '<p class="artform-form__phi-notice">Please do not include sensitive medical information in this form. Our team will contact you to discuss next steps securely.</p>';

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
    ${FORM_PHI_NOTICE}
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
      </div>
      ${renderContactGuaranteesPanel()}
    </div>
    ${FORM_PHI_NOTICE}
    <div class="artform-contact-form__submit-row">
      <button type="submit" class="artform-contact-form__submit">Submit</button>
    </div>
  </form>
  <p class="artform-contact-form__thanks" hidden>Thank you — taking you to schedule your consultation…</p>
</div>`;
}

function renderHeroConsultForm() {
  return `<div class="artform-consult-form artform-consult-form--hero">
  <p class="artform-consult-form__kicker">Schedule a Consultation</p>
  <h3 class="artform-consult-form__title">Consultation With Our Doctor</h3>
  <p class="artform-consult-form__subtitle">${CONSULT_SUBTITLE}</p>
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
    ${FORM_PHI_NOTICE}
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

  // Google Reviews directly above Our Services; stats band tucked under reviews.
  const section3965 = $('.elementor-element-3965ab9f').first();
  const section63d6 = $('.elementor-element-63d63482').first();
  const ourServices = $('.elementor-element-5b9d1682').first();

  if (section63d6.length && ourServices.length) {
    ourServices.before(section63d6);
  }
  if (section3965.length && section63d6.length) {
    section63d6.after(section3965);
    section3965.addClass('artform-stats-band');
    enhanceStatsCounters($, section3965);
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

/** About Us — photo collage + curated four-panel hero. */
function enhanceAboutPage(html) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  injectHeroGrid($('.elementor-element-21cec6').first(), $, '/about-us/', '#wrap', ABOUT_HERO_IMAGES);
  return enhancePhotoCollage($('#wrap').html() || html);
}

const COMPACT_HERO_PATHS = ['/about-us/', '/contact/', '/gallery/', '/blog/'];

/** Compact hero band on about, contact, gallery, blog (matches service pages). */
function enhanceCompactPageHero(html, pagePath) {
  const selectorByPath = {
    '/about-us/': '.elementor-element-21cec6',
    '/contact/': '.elementor-element-1e944148',
    '/gallery/': '.elementor-element-79fd65b0',
    '/blog/': '.elementor-element-6cb0af0b',
  };
  const selector = selectorByPath[pagePath];
  if (!selector) return html;

  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  const hero = $(selector).first();
  if (hero.length) {
    hero.addClass('artform-compact-hero').removeClass('artform-about-hero');
  }
  return $('#wrap').html() || html;
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

  /* Restore local map embeds stripped by cleanFragment */
  const mapWidget = $('.elementor-widget-google_maps .elementor-custom-embed').first();
  if (mapWidget.length) {
    const safety = site.addresses[0];
    const tampa = site.addresses[1];
    const safetyQ = `${safety.street}, ${safety.city}, ${safety.state} ${safety.zip}`;
    const tampaQ = `${tampa.street}, ${tampa.city}, ${tampa.state} ${tampa.zip}`;
    mapWidget.html(`<div class="artform-contact-maps artform-contact-maps--dual">
      ${renderContactMap(`${safety.label} Office`, safetyQ)}
      ${renderContactMap(`${tampa.label} Office`, tampaQ)}
    </div>`);
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

const RECENT_POSTS = [
  {
    title: 'Scar Revision: Minimizing Scars for Smoother, Natural-Looking Skin',
    href: '/scar-revision-minimizing-scars-for-smoother-natural-looking-skin/',
    date: 'May 28, 2026',
    image: null,
    alt: 'Scar revision procedure',
  },
  {
    title: 'Rhinoplasty (Nose Job): Sculpting Confidence and Facial Harmony',
    href: '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/',
    date: 'November 9, 2024',
    image: '/wp-content/uploads/2024/10/071224-DRCK-87-300x200.jpg',
    alt: 'Rhinoplasty consultation',
  },
  {
    title: 'Split Earlobe Repair: Restore the Natural Look of Your Earlobes',
    href: '/split-earlobe-repair-restore-the-natural-look-of-your-earlobes/',
    date: 'November 9, 2024',
    image: '/wp-content/uploads/2024/10/071224-DRCK-0895-Edit-scaled-e1730014913672-235x300.jpg',
    alt: 'Dr. Christopher Kieliszak — facial plastic surgeon',
  },
];

function renderRecentPostsWidget() {
  const articles = RECENT_POSTS.map((post) => {
    const img = post.image
      ? `<img loading="lazy" decoding="async" width="300" height="200" src="${post.image}" class="attachment-medium size-medium wp-post-image" alt="${post.alt.replace(/"/g, '&quot;')}">`
      : '';
    return `<article class="jkit-post post-list-item">
                <a href="${post.href}">
                    ${img}
                    <div class="jkit-postlist-content"><span class="jkit-postlist-title">${post.title}</span><div class="meta-lists"><span class="meta-date"><i aria-hidden="true" class="fas fa-clock"></i>${post.date}</span> </div></div>
                </a>
            </article>`;
  }).join('');

  return `<div class="elementor-element elementor-element-artform-recent elementor-widget elementor-widget-jkit_post_list artform-recent-posts" data-id="artform-recent" data-element_type="widget" data-widget_type="jkit_post_list.default">
        <div class="elementor-widget-container">
          <div class="jeg-elementor-kit jkit-postlist layout-vertical post-element jkit-pagination-disable">
            <div class="jkit-block-container"><div class="jkit-posts jkit-ajax-flag">${articles}</div></div>
          </div>
        </div>
      </div>`;
}

/** Sidebar — Recent Posts on procedure pages; Have Any Question card background. */
function enhanceSidebarContent(html, pagePath) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  if (PROCEDURE_PAGE_PATTERN.test(pagePath)) {
    const $heading = $('.elementor-element-62e96060').first();
    if ($heading.length) {
      const $wrap = $heading.closest('.elementor-widget-wrap');
      if ($wrap.length && !$wrap.find('.jkit-postlist').length) {
        $heading.after(renderRecentPostsWidget());
      }
    }
  }

  $('.elementor-element-653af322, .elementor-element-598bbed3').addClass('artform-have-question-card');

  return $('#wrap').html() || html;
}

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

  const posts = $('#wrap .jkit-postblock .jkit-post').toArray();
  posts.forEach((el, index) => {
    if (index >= BLOG_PAGE_SIZE) $(el).addClass('artform-blog-post--hidden').attr('hidden', '');
  });

  $('#wrap .jkit-post-excerpt p').each((_, el) => {
    const $p = $(el);
    const cleaned = $p.text().replace(/^Our Blog\s+Home\s+Blog\s+/i, '').trim();
    if (cleaned) $p.text(cleaned);
  });

  const loadMore = $('#wrap .jkit-pagination-button.jkit-block-loadmore').first();
  if (loadMore.length) {
    if (posts.length <= BLOG_PAGE_SIZE) {
      loadMore.closest('.jkit-block-pagination').remove();
    } else {
      loadMore.attr('data-artform-blog-loadmore', 'true');
    }
  }

  injectHeroGrid($('#wrap .elementor-element-6cb0af0b').first(), $, '/blog/', '.jkit-posts');

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

const SERVICE_HERO_FALLBACK_IMAGES = [
  '/wp-content/uploads/2024/10/071224-DRCK-0484-Edit-scaled.jpg',
  '/wp-content/uploads/2024/10/071224-DRCK-0579-Edit-scaled.jpg',
  '/wp-content/uploads/2024/10/071224-DRCK-0744-Edit-scaled.jpg',
  '/wp-content/uploads/2024/10/071224-DRCK-0959-Edit-scaled.jpg',
  '/wp-content/uploads/2024/10/071224-DRCK-1159-Edit-scaled.jpg',
  '/wp-content/uploads/2024/11/071224-DRCK-1232-Edit-scaled-e1730497924674.jpg',
];

/** Curated DRCK portraits for About — practice, doctor, patient-care tone (not before/after). */
const ABOUT_HERO_IMAGES = [
  '/wp-content/uploads/2024/10/071224-DRCK-0974-Edit-scaled.jpg',
  '/wp-content/uploads/2024/10/071224-DRCK-1030-Edit-scaled-e1730121841699.jpg',
  '/wp-content/uploads/2024/10/071224-DRCK-0484-Edit-scaled.jpg',
  '/wp-content/uploads/2024/10/071224-DRCK-1159-Edit-scaled.jpg',
];

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function heroSeed(pagePath) {
  return [...pagePath].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function stableShuffle(values, pagePath) {
  return [...values].sort((a, b) => {
    const seed = heroSeed(pagePath);
    const score = (value) =>
      [...value].reduce((sum, ch, idx) => sum + ch.charCodeAt(0) * (idx + 3 + seed), seed);
    return score(a) - score(b);
  });
}

function normalizeUploadUrl(url) {
  if (!url) return '';
  let clean = String(url)
    .replace(BASE, '')
    .replace(/https?:\/\/[^"')\s]+\/wp-content\/uploads/gi, '/wp-content/uploads')
    .split('?')[0]
    .trim();
  if (!clean.startsWith('/wp-content/uploads/')) return '';
  if (!/\.(jpe?g|png|webp)$/i.test(clean)) return '';
  return clean;
}

function isHeroImageCandidate(url) {
  const clean = normalizeUploadUrl(url);
  if (!clean) return false;
  return !/100051|removebg|logo|favicon|150x150|186x81|298x300|300x131|heartcare|lifecare|tree|pattern|testimonial|nose\.png|botox-|facelift(?:-1)?\.png/i.test(
    clean
  );
}

function preferLargestUploads(urls) {
  const byBase = new Map();
  for (const url of urls) {
    const base = url.replace(/-\d+x\d+(?=\.(jpe?g|png|webp)$)/i, '');
    const isFull = !/-\d+x\d+\.(jpe?g|png|webp)$/i.test(url);
    const existing = byBase.get(base);
    if (!existing || (isFull && !existing.isFull)) {
      byBase.set(base, { url, isFull });
    }
  }
  return [...byBase.values()].map((entry) => entry.url);
}

function collectServiceHeroImages($, pagePath, scopeSelector = '#wrap') {
  const urls = new Set();
  const $root = scopeSelector === '#wrap' ? $('#wrap') : $(scopeSelector).first();
  if (!$root.length) return [];

  $root.find('img').each((_, img) => {
    const $img = $(img);
    const candidates = [$img.attr('src'), $img.attr('data-src'), $img.attr('url')];
    const srcset = $img.attr('srcset') || '';
    srcset.split(',').forEach((entry) => candidates.push(entry.trim().split(/\s+/)[0]));
    candidates.forEach((candidate) => {
      if (isHeroImageCandidate(candidate)) urls.add(normalizeUploadUrl(candidate));
    });
  });

  const html = $root.html() || '';
  const re = /\/wp-content\/uploads\/[^"')\s<>]+\.(?:jpe?g|png|webp)/gi;
  let match;
  while ((match = re.exec(html))) {
    if (isHeroImageCandidate(match[0])) urls.add(normalizeUploadUrl(match[0]));
  }

  const pageImages = stableShuffle(preferLargestUploads([...urls]), pagePath);
  const fallbackImages = stableShuffle(SERVICE_HERO_FALLBACK_IMAGES, `${pagePath}:fallback`);
  return [...new Set([...pageImages, ...fallbackImages])].slice(0, 4);
}

function injectHeroGrid($hero, $, pagePath, scopeSelector = '#wrap', fixedImages = null) {
  if (!$hero.length || $hero.children('.artform-service-hero-grid').length) return;
  const images =
    Array.isArray(fixedImages) && fixedImages.length === 4
      ? fixedImages
      : collectServiceHeroImages($, pagePath, scopeSelector);
  if (images.length === 4) {
    $hero.prepend(renderServiceHeroGrid(images));
  }
}

function renderServiceHeroGrid(images) {
  const positions = ['left', 'bottom', 'top', 'right'];
  return `<div class="artform-service-hero-grid" aria-hidden="true">
    ${images
      .map(
        (src, index) => `<div class="artform-service-hero-panel artform-service-hero-panel--${positions[index]}">
      <img src="${escapeAttr(src)}" alt="" decoding="async" loading="${index === 0 ? 'eager' : 'lazy'}">
    </div>`
      )
      .join('\n    ')}
  </div>`;
}

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
      injectHeroGrid($sec, $, pagePath);
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

  const $hero = $('#wrap .elementor-element-79fd65b0').first();
  $('#wrap .elementor-element-79fd65b0 .elementor-element-56d013c7').remove();
  const $leftCol = $('#wrap .elementor-element-79fd65b0 .elementor-element-54fe6ad8');
  $leftCol.removeClass('elementor-col-50').addClass('elementor-col-100');

  injectHeroGrid($hero, $, '/gallery/', '.elementor-image-gallery');

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

  const desc = seoProfile(pagePath).heroDescription || metaDescription(pagePath);
  h1.after(`<p class="artform-hero-desc">${desc}</p>`);

  return $('#wrap').html() || html;
}

function renderSeoContent(pagePath) {
  const profile = seoProfile(pagePath);
  const content = profile.content;
  if (!content) return '';

  const id = `artform-seo-${pagePath === '/' ? 'home' : pagePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
  const body = (content.body || [])
    .map((paragraph) => `<p>${escapeMapHtml(paragraph)}</p>`)
    .join('\n      ');
  const bullets = (content.bullets || []).length
    ? `<ul class="artform-seo__bullets">${content.bullets
        .map((item) => `<li>${escapeMapHtml(item)}</li>`)
        .join('\n        ')}</ul>`
    : '';
  const links = (content.links || []).length
    ? `<div class="artform-seo__links">${content.links
        .map(
          (link) =>
            `<a class="artform-seo__link" href="${escapeAttr(link.href)}">${escapeMapHtml(link.label)}</a>`
        )
        .join('\n        ')}</div>`
    : '';
  const faqs = (content.faqs || []).length
    ? `<div class="artform-seo__faq" aria-label="Frequently asked questions">${content.faqs
        .map(
          (item) => `<details class="artform-seo__faq-item">
          <summary>${escapeMapHtml(item.q)}</summary>
          <p>${escapeMapHtml(item.a)}</p>
        </details>`
        )
        .join('\n        ')}</div>`
    : '';
  const keywordLine = profile.keywords?.length
    ? `<p class="artform-seo__keywords">Related local searches: ${profile.keywords
        .map((keyword) => escapeMapHtml(keyword))
        .join(', ')}.</p>`
    : '';

  return `<section class="artform-seo" aria-labelledby="${id}">
    <div class="artform-seo__inner">
      <p class="artform-seo__kicker">${escapeMapHtml(content.kicker || 'Tampa Bay SEO context')}</p>
      <h2 class="artform-seo__title" id="${id}">${escapeMapHtml(content.title || profile.h1 || breadcrumbName(pagePath))}</h2>
      <div class="artform-seo__copy">
        ${body}
        ${keywordLine}
      </div>
      ${bullets}
      ${links}
      ${faqs}
    </div>
  </section>`;
}

const PROCEDURE_CARD_LINKS = [
  [/rhinoplasty|nose job/i, '/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/'],
  [/facelift|rhytidectomy/i, '/facelift-rhytidectomy-rejuvenate-your-appearance-and-renew-confidence/'],
  [/blepharoplasty|eyelid/i, '/blepharoplasty-eyelid-lift-refresh-and-brighten-your-eyes-with-a-youthful-look/'],
  [/brow\s*lift|browlift|forehead/i, '/browlift-restore-a-youthful-look-with-a-smooth-elevated-brow/'],
  [/buccal/i, '/buccal-fat-removal-sculpt-your-cheeks-for-a-slimmer-contoured-look/'],
  [/chin implant|chin augmentation|mentoplasty/i, '/chin-implant-enhance-your-profile-with-a-balanced-defined-chin/'],
  [/lip lift/i, '/lip-lift-enhance-your-smile-and-achieve-fuller-youthful-lips/'],
  [/split ear|earlobe|torn ear/i, '/split-earlobe-repair-restore-the-natural-look-of-your-earlobes/'],
  [/mohs|skin cancer reconstruction/i, '/mohs-reconstruction-restoring-natural-beauty-after-skin-cancer-removal/'],
  [/nasal breathing|functional rhinoplasty|septoplasty|deviated septum/i, '/nasal-breathing-procedures-achieve-lasting-relief-from-nasal-obstruction/'],
  [/scar revision|keloid|surgical scar/i, '/scar-revision-minimizing-scars-for-smoother-natural-looking-skin/'],
];

function matchingProcedureHref(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const match = PROCEDURE_CARD_LINKS.find(([pattern]) => pattern.test(clean));
  return match?.[1] || null;
}

function enhanceInternalLinks(html, pagePath) {
  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });

  $('#wrap a').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    if (/preview-domain\.com\/registration|^\/registration\/?$/i.test(href)) {
      $a.attr('href', '/book-consultation/');
    }
  });

  if (pagePath === '/services/' || APPOINTMENT_FORM_PATHS.includes(pagePath)) {
    $('#wrap .jkit-icon-box-wrapper, #wrap .elementor-widget-icon-box, #wrap .elementor-widget-container').each((_, el) => {
      const $card = $(el);
      const title = $card.find('h3, .title, .elementor-heading-title').first().text();
      const href = matchingProcedureHref(title);
      if (!href) return;

      const $learnMore = $card
        .find('a')
        .filter((_, link) => /learn|read|more|details|view/i.test($(link).text()))
        .first();
      if ($learnMore.length) $learnMore.attr('href', href);
    });
  }

  return $('#wrap').html() || html;
}

function enhanceSeoContent(html, pagePath) {
  const profile = seoProfile(pagePath);
  if (!profile.h1 && !profile.content) return html;

  const $ = cheerio.load(`<div id="wrap">${html}</div>`, { decodeEntities: false });
  let $content = $('#wrap .entry-content').first();
  if (!$content.length) $content = $('#wrap #primary').first();
  if (!$content.length) $content = $('#wrap #content .ast-container').first();
  if (!$content.length) $content = $('#wrap #content').first();

  const $h1 = $('#wrap .entry-content .elementor h1.elementor-heading-title, #wrap #content h1, #wrap #main h1').first();
  if (profile.h1 && $h1.length) {
    const current = $h1.text().replace(/\s+/g, ' ').trim();
    if (!current || /our blog/i.test(current) || current !== profile.h1) {
      $h1.text(profile.h1);
    }
  } else if (profile.h1 && $content.length && !$('#wrap h1').length) {
    $content.prepend(`<header class="artform-legal-hero"><h1>${escapeMapHtml(profile.h1)}</h1></header>`);
  }

  if (PROCEDURE_PAGE_PATTERN.test(pagePath)) {
    $('#wrap .elementor-widget-heading .elementor-heading-title')
      .filter((_, el) => /^Our Blog$/i.test($(el).text().replace(/\s+/g, ' ').trim()))
      .closest('.elementor-widget-heading')
      .remove();
  }

  if (profile.content && $content.length && !$content.find('.artform-seo').length) {
    $content.append(renderSeoContent(pagePath));
  }

  return $('#wrap').html() || html;
}

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
    if (alt && !/^(Title|Evoto|Image)$/i.test(alt)) return;

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

/** Wire homepage stat counters for count-up animation (values from site.json). */
function enhanceStatsCounters($, section) {
  const patients = String(site.stats?.patients || '452');
  const years = String(site.stats?.years || '10');

  section.find('.jkit-fun-fact').each((index, el) => {
    const $fact = $(el);
    const label = $fact.find('.title').first().text().replace(/\s+/g, ' ').trim().toLowerCase();
    const target = /year/.test(label) ? years : /patient/.test(label) ? patients : index === 0 ? patients : years;
    const $num = $fact.find('.number').first();
    const duration = $num.attr('data-animation-duration') || '2200';

    $num
      .attr('data-value', target)
      .attr('data-artform-count', target)
      .attr('data-animation-duration', duration)
      .text('0')
      .addClass('artform-stat-count');
    $fact.addClass('artform-stat-counter');
  });
}

/** Demo-safe copy: no "free consult", no direct-to-doctor call promise. */
function sanitizeMeetingCopy(html) {
  return html
    .replace(/Get on a call with Dr\. Kieliszak/gi, CONSULT_SUBTITLE)
    .replace(/Get on a call with Dr\. K\b/gi, CONSULT_SUBTITLE)
    .replace(/>\s*Free consultation\s*</gi, '>Schedule a Consultation<');
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
  c = enhanceInternalLinks(c, pagePath);
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
  if (pagePath === '/blog/' || PROCEDURE_PAGE_PATTERN.test(pagePath)) c = enhanceSidebarContent(c, pagePath);
  if (pagePath === '/gallery/') c = enhanceGallery(c, pagePath);
  if (COMPACT_HERO_PATHS.includes(pagePath)) c = enhanceCompactPageHero(c, pagePath);
  c = enhanceHeadingHierarchy(c);
  c = stripDuplicateEntryTitle(c);
  c = enhanceSeoContent(c, pagePath);
  c = enhanceHeroDescriptions(c, pagePath);
  c = enhanceHeroH1Markup(c, pagePath);
  if (SERVICE_HERO_PATHS.includes(pagePath)) c = enhanceServiceHero(c, pagePath);
  c = enhanceImageAlts(c);
  c = sanitizeMeetingCopy(c);
  return `${announcementBar()}${h}${c}${shellFooter}`;
}

function chatBodyAttrs() {
  const chat = site.chat || {};
  if (!chat.enabled || chat.provider !== 'tidio' || !chat.tidioPublicKey) {
    return 'data-chat-enabled="false"';
  }
  const placeholder = chat.placeholder ? ' data-chat-placeholder="true"' : '';
  return `data-chat-enabled="true" data-chat-provider="tidio" data-chat-tidio-key="${chat.tidioPublicKey}"${placeholder}`;
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
  if (pagePath === '/contact/') cls += ' artform-contact-page';
  if (pagePath === '/gallery/') cls += ' artform-gallery-page';
  if (pagePath === '/blog/') cls += ' artform-blog-page';
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
  if (site.chat?.enabled && site.chat?.provider === 'tidio' && site.chat?.tidioPublicKey) {
    scripts.push('<script src="/js/artform-chat.js" defer></script>');
  }
  if (pagePath === '/' || pagePath === '/meet-dr-kieliszak/') {
    scripts.push('<script src="/js/home-consult-form.js" defer></script>');
  }
  if (pagePath === '/') {
    scripts.push('<script src="/js/artform-base.js"></script>');
    scripts.push('<script src="/js/artform-portfolio-gallery.js" defer></script>');
    scripts.push('<script src="/js/artform-google-reviews.js" defer></script>');
    scripts.push('<script src="/js/artform-stats-counter.js" defer></script>');
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

function robotsContent() {
  return process.env.ARTFORM_ROBOTS || site.robots || (site.indexSite ? 'index, follow' : 'noindex, nofollow');
}

function socialMeta(pagePath, title, description) {
  const image = `${BASE}${site.heroImageFull || site.heroImage || '/wp-content/uploads/2024/10/071224-DRCK-0895-Edit-1-scaled.jpg'}`;
  const url = `${BASE}${pagePath === '/' ? '/' : pagePath}`;
  return `<meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeAttr(site.name)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:url" content="${escapeAttr(url)}">
  <meta property="og:image" content="${escapeAttr(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(image)}">`;
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
  <meta name="robots" content="${robotsContent()}">
  <title>${title}</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  ${socialMeta(pagePath, title, description)}
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
  ${FORM_PAGE_PATHS.includes(pagePath) ? '<link rel="stylesheet" href="/css/artform-forms.css">' : ''}
  ${SERVICE_HERO_PATHS.includes(pagePath) || COMPACT_HERO_PATHS.includes(pagePath) ? '<link rel="stylesheet" href="/css/artform-service-hero.css">' : ''}
  ${pagePath === '/services/' || APPOINTMENT_FORM_PATHS.includes(pagePath) || PROCEDURE_PAGE_PATTERN.test(pagePath) ? '<link rel="stylesheet" href="/css/artform-service-intro.css">' : ''}
  ${pagePath === '/blog/' || PROCEDURE_PAGE_PATTERN.test(pagePath) ? '<link rel="stylesheet" href="/css/artform-sidebar.css">' : ''}
  ${seoProfile(pagePath).content ? '<link rel="stylesheet" href="/css/artform-seo.css">' : ''}
  ${pagePath === '/book-consultation/' ? '<link rel="stylesheet" href="/css/artform-book-consultation.css">' : ''}
  <link rel="canonical" href="${BASE}${pagePath === '/' ? '/' : pagePath}">
  <script type="application/ld+json">${schemaJson(pagePath)}</script>
</head>
<body class="${pageBodyClass}" ${chatBodyAttrs()}>
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
