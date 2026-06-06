# Art Form Plastic Surgery — Custom Rebuild (Full Replica)

Mirrors the live WordPress/Elementor site: **same header, footer, Elementor sections, CSS, images, and animations** — without WP bloat, popups, or broken scripts.

## Quick start

```powershell
cd "E:\Website Audit\High Prospective Clients\Art-Form-Plastic-Surgery\rebuild"
npm install
npm run build    # downloads ~300+ assets + builds 28 pages
npm run serve    # http://localhost:3456
```

**Hard refresh** the browser (Ctrl+F5) after rebuilding.

## What this includes

- **28 pages** with shared Astra header + Elementor body + footer (`templates/header.html`, `templates/footer.html` — one shell, active nav per page)
- **310+ local assets** in `public/wp-content/` (images, Elementor CSS per page, plugin CSS)
- **Hero image** via `post-975.css` + local `071224-DRCK-0895-Edit-1-scaled.jpg`
- **Header:** Compact bar (~58px), centered nav (desktop), hamburger + slide-out drawer at **&lt;1265px**, matched pill CTAs
- **Hero:** Top-weighted `background-position`, responsive image breakpoints (`hero-responsive.css`); swap in a 4K asset at `071224-DRCK-0895-Edit-1-scaled.jpg` when ready
- **Animations:** Elementor fadeIn CSS + `elementor-animations.js` (scroll reveal: left/right/up per widget)
- **Counters:** JKit fun-facts count **0 → `data-value`** (452 patients on homepage; updates when live site changes)
- **Carousels:** Swiper JS for testimonial/service sliders
- **Fixed content:** phone, typos, placeholder text, “Free Estimate” wording
- **SEO/schema:** proper titles + MedicalBusiness/Physician JSON-LD
- **No:** jQuery, Poptin, Popup Builder, mydashmetrics chat (optional hook in `site.js`)

## Rebuild

```powershell
npm run build
```

`scripts/build.mjs` fetches live pages, extracts Elementor body HTML, applies content fixes, wraps in layout. Edit `data/pages.json` to add URLs; edit `data/site.json` for global settings.

## Chat widget

Replaces the live site's `chat.mydashmetrics.com` widget with **Tidio** (same lazy-load pattern as Knight Logics MainSite).

Edit `data/site.json` → `chat`:

```json
"chat": {
  "enabled": true,
  "provider": "tidio",
  "tidioPublicKey": "YOUR_TIDIO_PUBLIC_KEY",
  "placeholder": false,
  "welcomeMessage": "Hi! How can we help you today?"
}
```

**Placeholder mode:** Currently uses the Knight Logics Tidio key until Art Form creates their own free Tidio account (business or receptionist email). When approved, sign up at [tidio.com](https://www.tidio.com), paste the new public key into `tidioPublicKey`, set `placeholder` to `false`, and configure the welcome message in the Tidio dashboard to match their old chat copy.

## Deploy

Upload `dist/` to Hostinger (or any static host). Map all old URLs with same paths. Add 301s only if paths change.

## Not in v1

- Blog post articles (only `/blog/` index)
- Author/archive pages
- Metform form backend (add Formspree, custom API, or WP bridge)
- Localized image CDN (next step)

## Client ownership

Confirm rights to copy, images, and design before production deploy.
