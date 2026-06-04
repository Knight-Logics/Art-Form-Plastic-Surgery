/**
 * Capture header screenshot for verification (requires serve on :3456).
 * Usage: npm run serve (other terminal) → npm run screenshot:header
 */
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist', 'header-verify-1920.png');

const { chromium } = await import('playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 220 } });

try {
  await page.goto('http://127.0.0.1:3456/', { waitUntil: 'networkidle', timeout: 60000 });
} catch (e) {
  console.error('Could not reach http://127.0.0.1:3456/ — run: npm run serve');
  await browser.close();
  process.exit(1);
}

const header = page.locator('.artform-header');
await header.waitFor({ state: 'visible', timeout: 10000 });
const box = await header.boundingBox();
if (box) {
  await page.screenshot({
    path: OUT,
    clip: { x: 0, y: 0, width: 1920, height: Math.min(160, Math.ceil(box.height + 50)) },
  });
} else {
  await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1920, height: 140 } });
}

await browser.close();
console.log('Screenshot saved:', OUT);
