#!/usr/bin/env node
/** List all local images + which pages reference them. */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UPLOADS = path.join(ROOT, 'public', 'wp-content', 'uploads');
const DIST = path.join(ROOT, 'dist');
const pages = JSON.parse(await fs.readFile(path.join(ROOT, 'data/pages.json'), 'utf8'));

const IMG_RE = /\.(jpe?g|png|gif|webp)$/i;

async function walkImages(dir, base = '') {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkImages(full, rel)));
    else if (IMG_RE.test(e.name)) {
      const stat = await fs.stat(full);
      out.push({ rel: rel.replace(/\\/g, '/'), bytes: stat.size });
    }
  }
  return out;
}

function collectUrls(text) {
  const urls = new Set();
  const re = /\/wp-content\/uploads\/[^\s"'<>)\]]+/gi;
  let m;
  while ((m = re.exec(text))) urls.add(m[0].split('?')[0]);
  return [...urls];
}

const images = await walkImages(UPLOADS);
const byFolder = {};
for (const img of images) {
  const folder = img.rel.includes('/') ? img.rel.split('/').slice(0, -1).join('/') : '(root)';
  if (!byFolder[folder]) byFolder[folder] = [];
  byFolder[folder].push(img);
}

const pageUsage = {};
for (const pagePath of pages) {
  const file =
    pagePath === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, pagePath.replace(/^\/|\/$/g, ''), 'index.html');
  try {
    const html = await fs.readFile(file, 'utf8');
    pageUsage[pagePath] = collectUrls(html);
  } catch {
    pageUsage[pagePath] = [];
  }
}

const urlToPages = {};
for (const [page, urls] of Object.entries(pageUsage)) {
  for (const u of urls) {
    if (!urlToPages[u]) urlToPages[u] = [];
    urlToPages[u].push(page);
  }
}

const report = {
  totalImages: images.length,
  folders: Object.fromEntries(
    Object.entries(byFolder)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([k, v]) => [k, { count: v.length, files: v.map((i) => i.rel) }])
  ),
  pages: Object.fromEntries(
    Object.entries(pageUsage).map(([p, urls]) => [p, { imageCount: urls.length, images: urls }])
  ),
  galleryOnly: [],
  procedureExtras: {},
};

const galleryUrls = new Set(pageUsage['/gallery/'] || []);
for (const [page, urls] of Object.entries(pageUsage)) {
  if (!page.includes('rhinoplasty') && !page.includes('facelift') && !page.includes('blepharoplasty') && !page.includes('procedures')) continue;
  const extra = urls.filter((u) => galleryUrls.has(u) && !urls.every((x) => galleryUrls.has(x)));
}
// Images on gallery not on rhinoplasty
const rhino = new Set(pageUsage['/rhinoplasty-nose-job-sculpting-confidence-and-facial-harmony/'] || []);
report.galleryOnly = [...galleryUrls].filter((u) => !rhino.has(u));
report.onRhinoplastyNotGallery = [...rhino].filter((u) => !galleryUrls.has(u));

const outPath = path.join(ROOT, 'data', 'image-inventory.json');
await fs.writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Wrote', outPath);
console.log('Total local images:', report.totalImages);
console.log('Gallery images:', galleryUrls.size);
console.log('Gallery-only (not on rhinoplasty):', report.galleryOnly.length);
