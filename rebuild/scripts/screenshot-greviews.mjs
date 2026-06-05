/**
 * Google Reviews carousel — multi-width verification (serve on :3456 first).
 * Usage: npm run screenshot:greviews
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'dist', 'screenshots-greviews');

const WIDTHS = [
  { w: 390, label: '390-mobile' },
  { w: 430, label: '430-mobile' },
  { w: 768, label: '768-tablet' },
  { w: 1024, label: '1024-desktop' },
  { w: 1280, label: '1280-desktop' },
  { w: 1440, label: '1440-desktop' },
  { w: 1920, label: '1920-desktop' },
  { w: 2560, label: '2560-ultrawide' },
  { w: 3440, label: '3440-ultrawide' },
];

const { chromium } = await import('playwright');

await fs.mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

for (const { w, label } of WIDTHS) {
  const page = await browser.newPage({
    viewport: { width: w, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    await page.goto('http://127.0.0.1:3456/', { waitUntil: 'networkidle', timeout: 60000 });
  } catch {
    console.error('Could not reach http://127.0.0.1:3456/ — run: npm run serve');
    await browser.close();
    process.exit(1);
  }

  const widget = page.locator('.artform-greviews').first();
  await widget.waitFor({ state: 'visible', timeout: 20000 });
  await widget.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  const carousel = page.locator('.artform-greviews__carousel').first();
  const box = await carousel.boundingBox();
  const out = path.join(OUT_DIR, `greviews-${label}.png`);

  if (box) {
    const pad = 12;
    await page.screenshot({
      path: out,
      clip: {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: Math.min(w, box.width + pad * 2),
        height: Math.min(900, box.height + pad * 2),
      },
    });
  } else {
    await widget.screenshot({ path: out });
  }

  console.log('Saved', out);
  await page.close();
}

await browser.close();
console.log('Done →', OUT_DIR);
