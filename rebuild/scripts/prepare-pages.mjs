#!/usr/bin/env node
/**
 * Copy dist → pages-deploy for GitHub Pages (project site).
 * Root-absolute paths (/css, /wp-content) ignore <base href>, so we prefix them
 * with the repo path (e.g. /Art-Form-Plastic-Surgery/).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = process.env.PAGES_OUT
  ? path.resolve(process.env.PAGES_OUT)
  : path.join(ROOT, 'pages-deploy');
const BASE = (process.env.PAGES_BASE || '/Art-Form-Plastic-Surgery/').replace(/\/?$/, '/');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

/** Prefix root-absolute URLs; skip protocol-relative (//) and already-prefixed paths. */
function prefixRootPaths(text) {
  const esc = BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (text.includes('data-github-pages-prefixed')) return text;

  let out = text;
  const attrs = ['href', 'src', 'srcset', 'action', 'poster', 'data-src'];
  for (const attr of attrs) {
    const re = new RegExp(`(\\s${attr}=["'])\\/(?!\\/|${esc.slice(1)})`, 'g');
    out = out.replace(re, `$1${BASE}`);
  }
  /* CSS url(/wp-content/...) */
  out = out.replace(/url\(\s*\/(?!\/)/g, `url(${BASE}`);
  out = out.replace(/url\(\s*'\/(?!\/)/g, `url('${BASE}`);
  out = out.replace(/url\(\s*"\/(?!\/)/g, `url("${BASE}`);

  if (out !== text && !out.includes('data-github-pages-prefixed')) {
    out = out.replace(/<html\b/i, '<html data-github-pages-prefixed');
  }
  return out;
}

async function processHtml(file) {
  let html = await fs.readFile(file, 'utf8');
  html = prefixRootPaths(html);
  await fs.writeFile(file, html, 'utf8');
}

async function processCss(file) {
  let css = await fs.readFile(file, 'utf8');
  css = prefixRootPaths(css);
  await fs.writeFile(file, css, 'utf8');
}

async function walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name.endsWith('.html')) await processHtml(p);
    else if (e.name.endsWith('.css')) await processCss(p);
  }
}

await fs.rm(OUT, { recursive: true, force: true });
await copyDir(DIST, OUT);
await walk(OUT);
console.log(`Prepared ${OUT} with asset prefix ${BASE}`);
