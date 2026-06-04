#!/usr/bin/env node
/** Copy dist → pages-deploy and inject GitHub Pages base href */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = process.env.PAGES_OUT
  ? path.resolve(process.env.PAGES_OUT)
  : path.join(ROOT, 'pages-deploy');
const BASE = process.env.PAGES_BASE || '/Art-Form-Plastic-Surgery/';

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function injectBase(file) {
  let html = await fs.readFile(file, 'utf8');
  if (html.includes('data-github-pages-base')) return;
  const tag = `<base href="${BASE}" data-github-pages-base>`;
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n  ${tag}`);
  } else {
    html = tag + html;
  }
  await fs.writeFile(file, html, 'utf8');
}

async function walkHtml(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walkHtml(p);
    else if (e.name === 'index.html') await injectBase(p);
  }
}

await fs.rm(OUT, { recursive: true, force: true });
await copyDir(DIST, OUT);
await walkHtml(OUT);
console.log(`Prepared ${OUT} with base href ${BASE}`);
