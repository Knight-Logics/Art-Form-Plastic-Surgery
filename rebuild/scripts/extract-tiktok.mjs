import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const re = /id="sbtt-tiktok-feed-1"[^>]*data-feed-posts="([^"]+)"[^>]*data-feed-header="([^"]+)"/;
const m = html.match(re);
if (!m) {
  console.error('TikTok feed data not found in index.html');
  process.exit(1);
}

function decodeAttr(s) {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

const posts = JSON.parse(decodeAttr(m[1]));
const header = JSON.parse(decodeAttr(m[2]));
const profile = header[0];

const videos = posts.slice(0, 9).map((p) => ({
  id: p.id,
  shareUrl: p.share_url,
  thumb: (p.local_cover_image_url || '').replace('https://artformplasticsurgery.com', ''),
  caption: (p.video_description || p.title || '').slice(0, 140),
}));

const out = {
  username: profile.username,
  displayName: profile.display_name,
  bio: profile.bio_description,
  avatar: (profile.local_avatar_url || '').replace('https://artformplasticsurgery.com', ''),
  followUrl: 'https://www.tiktok.com/@faceplasticsurgeon',
  videos,
};

const outPath = path.join(__dirname, '../public/data/tiktok-feed.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${videos.length} videos → ${outPath}`);
