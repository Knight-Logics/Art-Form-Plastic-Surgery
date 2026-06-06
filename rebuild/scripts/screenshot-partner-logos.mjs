/**
 * Screenshot partner-logo strip on /services/ (appointment section, left column).
 * Usage: npm run serve (port 3456) then node scripts/screenshot-partner-logos.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist', 'screenshots-audit', 'services-partner-logos.png');

const { chromium } = await import('playwright');

await fs.mkdir(path.dirname(OUT), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

await page.goto('http://127.0.0.1:3456/services/', { waitUntil: 'networkidle', timeout: 60000 });
const section = page.locator('.elementor-element-169898a1');
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await section.screenshot({ path: OUT });

await browser.close();
console.log('Saved', OUT);
