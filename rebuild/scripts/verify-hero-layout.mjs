/**
 * Assert hero/header layout at key viewports.
 */
import { chromium } from 'playwright';

const PORT = process.argv[2] || '3470';
const BASE = `http://127.0.0.1:${PORT}/`;

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-wide', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('.artform-landing').first().waitFor({ state: 'visible' });

  const checks = await page.evaluate(() => {
    const h1 = document.querySelector('.af-hero__title, .artform-hero-h1');
    const form = document.querySelector('.af-hero-form-card .artform-consult-form--hero, .artform-consult-form--hero');
    const hero = document.querySelector('.af-hero');
    const img = document.querySelector('.af-hero__img');
    const phone = document.querySelector('.artform-header__btn--phone');
    const copy = document.querySelector('.af-hero__copy');
    const media = document.querySelector('.af-hero__media');
    const h1Box = h1?.getBoundingClientRect();
    const formBox = form?.getBoundingClientRect();
    const copyBox = copy?.getBoundingClientRect();
    const mediaBox = media?.getBoundingClientRect();
    const imgBox = img?.getBoundingClientRect();

    const h1Style = h1 ? getComputedStyle(h1) : null;
    const h1Visible =
      !!h1Box &&
      h1Box.width > 0 &&
      h1Box.height > 0 &&
      h1Style?.visibility !== 'hidden' &&
      parseFloat(h1Style?.opacity || '1') > 0.05;

    const imgLoaded = !!img && img.complete && img.naturalWidth > 0;

    return {
      h1Visible,
      h1Text: h1?.textContent?.trim().slice(0, 40) || '',
      formVisible: !!formBox && formBox.width > 40 && formBox.height > 120,
      heroVisible: !!hero,
      imgLoaded,
      imgAspect: img?.naturalWidth && img?.naturalHeight ? +(img.naturalWidth / img.naturalHeight).toFixed(2) : null,
      mediaH: mediaBox ? Math.round(mediaBox.height) : 0,
      imgH: imgBox ? Math.round(imgBox.height) : 0,
      phoneVisible: !!phone && getComputedStyle(phone).display !== 'none',
      formBelowCopy: !!formBox && !!copyBox ? formBox.top >= copyBox.bottom - 8 : null,
      h1Top: h1Box?.top ?? null,
      formTop: formBox?.top ?? null,
      copyBottom: copyBox?.bottom ?? null,
    };
  });

  const pass =
    checks.h1Visible &&
    checks.formVisible &&
    checks.heroVisible &&
    checks.imgLoaded &&
    checks.mediaH > 200 &&
    (vp.width >= 1265 ? true : checks.phoneVisible) &&
    (vp.width >= 1100 ? true : checks.formBelowCopy);

  console.log(`${pass ? 'PASS' : 'FAIL'} ${vp.name} (${vp.width}px)`, JSON.stringify(checks));
  await page.close();
}

await browser.close();
