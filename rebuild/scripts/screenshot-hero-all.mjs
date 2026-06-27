/**
 * Hero + header verification at multiple viewports.
 * Usage: node scripts/screenshot-hero-all.mjs [port]
 */
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.argv[2] || '3470';
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT_DIR = path.join(ROOT, 'dist', 'hero-screenshots');

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'ultrawide-2560', width: 2560, height: 1080 },
];

const { chromium } = await import('playwright');
const fs = await import('fs');

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.width <= 768 ? 2 : 1,
  });

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  } catch (err) {
    console.error(`Could not reach ${BASE} — is the server running?`);
    await browser.close();
    process.exit(1);
  }

  await page.locator('.artform-landing').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(600);

  const hero = page.locator('.af-hero, .artform-landing > .elementor-element-79fd65b0').first();
  const header = page.locator('.artform-header');
  const heroBox = await hero.boundingBox();
  const headerBox = await header.boundingBox();

  const clipY = 0;
  const naturalHeight = heroBox
    ? Math.ceil((headerBox?.height || 0) + heroBox.height + 12)
    : vp.height;
  const clipHeight =
    vp.width >= 1100 ? Math.min(vp.height, naturalHeight) : naturalHeight;

  await page.screenshot({
    path: path.join(OUT_DIR, `hero-${vp.name}.png`),
    clip: { x: 0, y: clipY, width: vp.width, height: clipHeight },
  });

  console.log(`Saved hero-${vp.name}.png (${vp.width}x${clipHeight})`);
  await page.close();
}

await browser.close();
console.log('All screenshots in:', OUT_DIR);
