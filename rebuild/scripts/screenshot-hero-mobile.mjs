/**
 * Mobile hero verification — requires npm run serve on :3456
 * Usage: npm run screenshot:hero-mobile
 */
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist', 'hero-mobile-verify.png');

const { chromium } = await import('playwright');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

try {
  await page.goto('http://127.0.0.1:3456/', { waitUntil: 'networkidle', timeout: 60000 });
} catch {
  console.error('Could not reach http://127.0.0.1:3456/ — run: npm run serve');
  await browser.close();
  process.exit(1);
}

await page.locator('.artform-landing').first().waitFor({ state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);

const hero = page.locator('.artform-landing > .elementor-element-79fd65b0');
const box = await hero.boundingBox();
if (box) {
  await page.screenshot({
    path: OUT,
    clip: {
      x: 0,
      y: Math.max(0, box.y - 8),
      width: 390,
      height: Math.min(844, Math.ceil(box.height + 120)),
    },
  });
} else {
  await page.screenshot({ path: OUT, fullPage: false });
}

await browser.close();
console.log('Screenshot saved:', OUT);
