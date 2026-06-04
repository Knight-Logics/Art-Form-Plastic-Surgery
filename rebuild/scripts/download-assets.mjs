import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const BASE = 'https://artformplasticsurgery.com';
const MANIFEST = path.join(ROOT, 'data', 'asset-manifest.json');

const pages = JSON.parse(await fs.readFile(path.join(ROOT, 'data/pages.json'), 'utf8'));

const queue = new Set();
const done = new Set();
const failed = new Set();

const ASSET_EXT =
  /\.(jpe?g|png|gif|webp|svg|css|js|mjs|woff2?|ttf|eot|ico|mp4|webm)(\?|$)/i;

function isAssetUrl(url) {
  const p = new URL(url).pathname;
  if (!p.includes('/wp-content/')) return false;
  if (p.endsWith('/')) return false;
  if (ASSET_EXT.test(p)) return true;
  if (p.includes('/elementor/css/post-')) return true;
  if (p.includes('/elementor/google-fonts/')) return true;
  if (p.includes('/font-awesome/webfonts/')) return true;
  if (p.includes('/eicons/fonts/')) return true;
  if (p.includes('/jkiticon/')) return true;
  return false;
}

function normalizeUrl(raw) {
  if (!raw || raw.startsWith('data:')) return null;
  let u = raw.trim().replace(/&amp;/g, '&').split(/[\s,]/)[0];
  if (u.startsWith('//')) u = 'https:' + u;
  if (u.startsWith('/')) u = BASE + u;
  if (!u.startsWith(BASE)) return null;
  try {
    const url = new URL(u);
    url.hash = '';
    const clean = url.origin + url.pathname;
    if (!isAssetUrl(clean)) return null;
    return clean;
  } catch {
    return null;
  }
}

function collectFromText(text) {
  if (!text) return;
  const patterns = [
    /https:\/\/artformplasticsurgery\.com\/[^\s"'<>)\]]+/gi,
    /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi,
  ];
  for (const re of patterns) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      const raw = m[1] || m[0];
      const n = normalizeUrl(raw);
      if (n) queue.add(n);
    }
  }
}

function localPath(url) {
  const u = new URL(url);
  return path.join(PUBLIC, decodeURIComponent(u.pathname).replace(/^\//, ''));
}

async function downloadOne(url) {
  if (done.has(url) || failed.has(url)) return;
  const dest = localPath(url);
  try {
    await fs.access(dest);
    const stat = await fs.stat(dest);
    if (stat.size > 0) {
      done.add(url);
      return;
    }
  } catch {}

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ArtFormRebuild/1.0 (asset migration)' },
      redirect: 'follow',
    });
    if (!res.ok) {
      failed.add(url);
      console.warn('  FAIL', res.status, url);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buf);
    done.add(url);
    if (url.endsWith('.css')) collectFromText(buf.toString('utf8'));
    process.stdout.write('.');
  } catch (e) {
    failed.add(url);
    console.warn('\n  ERR', url, e.message);
  }
}

async function processPage(pagePath) {
  const url = `${BASE}${pagePath === '/' ? '/' : pagePath}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ArtFormRebuild/1.0' } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  $('link[rel="stylesheet"]').each((_, el) => {
    collectFromText($(el).attr('href'));
  });
  $('img[src], img[srcset], source[srcset], video[src]').each((_, el) => {
    collectFromText($(el).attr('src'));
    collectFromText($(el).attr('srcset'));
  });
  $('[style]').each((_, el) => collectFromText($(el).attr('style')));
  collectFromText(html);

  return html;
}

console.log('Collecting asset URLs from', pages.length, 'pages…\n');
for (const p of pages) {
  try {
    await processPage(p);
    console.log(' scanned', p);
    await new Promise((r) => setTimeout(r, 300));
  } catch (e) {
    console.warn(' skip page', p, e.message);
  }
}

// Critical assets
[
  `${BASE}/wp-content/uploads/2024/10/071224-DRCK-0895-Edit-1-scaled.jpg`,
  `${BASE}/wp-content/uploads/2024/10/071224-DRCK-0895-Edit-1.jpg`,
  `${BASE}/wp-content/uploads/2024/10/pattern-QKPSLY.jpeg`,
  `${BASE}/wp-content/uploads/2024/10/1000513852-removebg-preview-e1730100950292.png`,
  `${BASE}/wp-content/uploads/2024/10/1000513861-removebg-preview-150x150.png`,
  `${BASE}/wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-solid-900.woff2`,
  `${BASE}/wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-brands-400.woff2`,
  `${BASE}/wp-content/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2`,
].forEach((u) => queue.add(u));

console.log('\n\nDownloading', queue.size, 'assets…\n');
let i = 0;
for (const url of queue) {
  await downloadOne(url);
  i++;
  if (i % 50 === 0) console.log(` ${i}/${queue.size}`);
}

// Second pass for CSS-discovered URLs
const secondPass = [...queue].filter((u) => !done.has(u));
for (const url of secondPass) await downloadOne(url);

await fs.writeFile(
  MANIFEST,
  JSON.stringify({ downloaded: [...done], failed: [...failed], total: done.size }, null, 2)
);

console.log('\n\nDone:', done.size, 'ok,', failed.size, 'failed');
console.log('Manifest:', MANIFEST);
