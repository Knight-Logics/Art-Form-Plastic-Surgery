/**
 * Detect horizontal overflow at key viewports.
 */
import { chromium } from 'playwright';

const PORT = process.argv[2] || '3470';
const BASE = `http://127.0.0.1:${PORT}/`;

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const heroImg = document.querySelector('.af-hero__img');
    const heroMedia = document.querySelector('.af-hero__media');
    const heroBox = heroMedia?.getBoundingClientRect();
    const imgBox = heroImg?.getBoundingClientRect();
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflowPx: overflow,
      heroMediaH: heroBox ? Math.round(heroBox.height) : 0,
      heroMediaW: heroBox ? Math.round(heroBox.width) : 0,
      imgSrc: heroImg?.currentSrc || heroImg?.src || '',
    };
  });

  console.log(
    `${result.overflowPx <= 1 ? 'PASS' : 'FAIL'} ${vp.name} overflow=${result.overflowPx}px hero=${result.heroMediaW}x${result.heroMediaH}`
  );
  await page.close();
}

await browser.close();
