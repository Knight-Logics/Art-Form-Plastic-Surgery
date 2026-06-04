/**
 * Capture homepage at desktop + mobile widths for layout verification.
 * Usage: npm run serve (other terminal) → node scripts/screenshot-home.mjs
 */
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');

const shots = [
  { name: 'verify-home-desktop.png', width: 1440, height: 1600 },
  { name: 'verify-home-mobile.png', width: 390, height: 2200 },
];

const browser = await chromium.launch();
try {
  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
    await page.goto('http://127.0.0.1:3456/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(600);
    const out = path.join(ROOT, 'dist', s.name);
    await page.screenshot({ path: out, fullPage: false });
    console.log('Saved', out);
    await page.close();
  }
} catch (e) {
  console.error('Capture failed:', e.message);
  process.exitCode = 1;
}
await browser.close();
