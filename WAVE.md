# Art Form Plastic Surgery — WAVE Accessibility Addendum

**Continues from:** [`AUDIT.md`](./AUDIT.md) (printed pack — this file is the accessibility deep-dive)  
**Client:** Art Form Plastic Surgery · artformplasticsurgery.com  
**Date:** June 4, 2026  
**Tool:** [WAVE Web Accessibility Evaluation Tool](https://wave.webaim.org/) (WebAIM)

---

## URLs tested

| URL | Purpose |
|-----|---------|
| [Homepage](https://wave.webaim.org/report#/https://artformplasticsurgery.com/) | Canonical entry |
| [Homepage + Google Ads params](https://wave.webaim.org/report#/https://artformplasticsurgery.com/?gad_source=1&gad_campaignid=23879504771&gbraid=0AAAAA94_K2GVzwjkzHn3dM7wfJI2TsCuh&gclid=CjwKCAjwxITRBhBYEiwA6mZm7RdMW4Q-sqIp7u1yXeyw685Hhb_AfUZVf_kTvcGDR8UpR6hxoIA4EhoCk4IQAvD_BwE) | Same page as paid traffic often lands |

**Result:** Both URLs report the **same issue counts** — accessibility problems are site-wide on the homepage template, not caused by `gclid` parameters.

---

## Executive summary

| Source | Score / result | What it measures |
|--------|----------------|------------------|
| **PageSpeed — Accessibility** | 78 mobile / 74 desktop | Automated subset (see AUDIT.md) |
| **WAVE (this report)** | **9 errors · 15 contrast errors · 14 alerts** | DOM-level issues on live homepage |
| **WAVE scan reliability** | ⚠️ **“SCAN ERROR — synchronization issues”** | Online scanner may miss fixes applied by JS; confirm with [WAVE browser extension](https://wave.webaim.org/extension/) before/after changes |

**Grade for meeting:** **D+** on accessibility — worse than PSI alone suggests. For a medical practice (forms, trust, older patients), this belongs in the **P1** conversation alongside speed and SEO.

---

## WAVE summary (homepage)

| Category | Count | Top issues |
|----------|-------|------------|
| **Errors** | **9** | Missing alternative text (images) |
| **Contrast errors** | **15** | Very low contrast (text vs background) |
| **Alerts** | **14** | Skipped heading level · redundant links · redundant title text · noscript elements |
| **Features** | 13 | Some images have alt; several null/empty alts |
| **Structure** | 50 | Landmarks, lists, tables (mixed quality) |
| **ARIA** | 145 | Heavy ARIA use — common with Elementor/mega menus |

### Scan error banner (important)

WAVE displayed:

> *“Synchronization issues detected. WAVE online scanner may not accurately parse the accessibility remediations on this page. Use the WAVE Browser Extensions…”*

**What to tell the client:** Treat this as a **strong signal**, not a perfect inventory. Re-test after fixes with the **Chrome/Firefox WAVE extension** on Book Consultation and homepage. Elementor + lazy-load + popups often confuse the online crawler.

---

## Errors — missing alternative text (9)

**What it means:** Informative images have no `alt` (or equivalent), so screen readers skip meaning.

**Likely locations on this site:**
- Hero / gallery imagery
- Service icons (checkmark lists may use icon fonts — separate issue)
- Instagram or social embeds
- Logo marks in footer or partner rows
- Elementor background images exposed as `<img>` without alt

**Fix (priority):**
1. Every **content** image: descriptive alt (procedure, context).
2. **Decorative** images: `alt=""` (empty, not missing).
3. Logo: `alt="Art Form Plastic Surgery"`.
4. Before/after gallery: alt with procedure type (no patient identifiers without consent).

**Rebuild note:** Custom header logo in rebuild includes alt text; live Elementor pages still need a pass on widgets.

---

## Contrast errors (15)

**What it means:** Text/background combinations fail WCAG AA (4.5:1 normal text, 3:1 large text).

**Likely culprits on Art Form (matches brand palette):**
- Gold/tan nav links (`#b89856`) on black — may pass large text only
- Gold text on hero overlay / photography
- Announcement bar (gold bar, black text) — verify
- Form placeholders and muted footer links
- CTA buttons (gold gradient, white text)

**Fix:**
- Audit with WAVE **Contrast tab** per flagged element.
- Darken gold for small text or increase weight/size.
- Add solid button backgrounds for “Book Consultation” / form submit.
- Do **not** rely on text over busy photos without a scrim.

**PSI vs WAVE:** PSI accessibility was 78; WAVE found **15 contrast failures** — PSI under-reports. Use WAVE for remediation list.

---

## Alerts (14) — fix for SEO + a11y

| Alert | Count | Why it matters |
|-------|-------|----------------|
| **Skipped heading level** | 3 | Hurts screen reader outline; aligns with Screaming Frog **missing H1** on key URLs |
| **Redundant link** | 4 | Same destination, different text — noisy for assistive tech |
| **Redundant title text** | 4 | `title` duplicates visible text — clutter |
| **Noscript** | 3 | Fallback content may be incomplete |

**Heading structure action:** One `<h1>` per page; don’t jump from `<h2>` to `<h4>`. Map Elementor “heading” widgets to real heading levels.

---

## Booking funnel — extra testing required

WAVE was run on the **homepage**. High-risk paths for a medical lead site:

| Page | Test with |
|------|-----------|
| `/book-consultation/` | WAVE extension + keyboard-only |
| Metform / consultation fields | Labels, errors, focus order |
| Mobile menu (`.artform-header__toggle`) | `aria-expanded`, focus trap |
| Popups (Poptin + Popup Builder) | Focus not lost behind modal |

**Custom rebuild:** Hamburger uses explicit bars + `aria-label`; confirm on live WordPress after deploy.

---

## How this ties to AUDIT.md

| AUDIT topic | WAVE adds |
|-------------|-----------|
| PSI Accessibility 78 | **24 definite failures** (9 + 15) + 14 alerts on homepage alone |
| Missing H1 (Screaming Frog) | **Skipped heading level** alerts confirm structure problems |
| Elementor / plugin bloat | **145 ARIA** nodes — complexity, not quality |
| Trust / YMYL | Poor a11y on consultation path = lost leads for older or low-vision users |

---

## Recommended fix order (accessibility)

| Priority | Action |
|----------|--------|
| **P0** | Add/fix alt on all 9 error images |
| **P0** | Fix top 5 contrast failures on CTAs and nav (Book, Call, form submit) |
| **P1** | One H1 per URL; fix skipped levels on homepage + book-consultation |
| **P1** | Remove redundant links in header/footer |
| **P2** | Re-run WAVE extension after Elementor updates |
| **P2** | Manual screen reader pass on consultation form |

---

## Google Ads favicon — why organic shows the logo but the ad shows a globe

**Short answer:** The ad does **not** use the homepage. It points to a **broken URL**. Google cannot show a favicon for a page that doesn’t load properly.

### What the SERP shows (Jun 2026)

| Placement | URL | Favicon |
|-----------|-----|---------|
| **Organic** | `https://artformplasticsurgery.com/` | ✅ Custom gold profile mark |
| **Paid ad** | `https://www.artformplasticsurgery.com/dr-kieliszak/consultation` | ❌ Generic grey globe |

### Live check (June 4, 2026)

```
GET https://artformplasticsurgery.com/dr-kieliszak/consultation  →  HTTP 404
```

The consultation path in the ad **does not exist** (or is not published) on the canonical host. It is **not** a “missing favicon on consultation page” problem — there is **no valid consultation page** at that path for Google to crawl.

**Working alternative on the same site:**

```
GET https://artformplasticsurgery.com/book-consultation/  →  HTTP 200
```

Rebuild HTML includes:

```html
<link rel="icon" href="/wp-content/uploads/2024/10/1000513861-removebg-preview-150x150.png" sizes="32x32">
```

So the **site has a favicon**; the **ad landing URL is wrong**.

### Why Google shows a globe icon in ads

Google Ads favicons are **not** the same as organic favicons. Google typically:

1. Crawls the **ad final URL** (and sometimes the domain).
2. Looks for a **square** icon (often 48×48 or larger), `favicon.ico`, or `link rel="icon"`.
3. Falls back to a **default globe** if the URL errors, redirects oddly, or the icon isn’t eligible.

A **404 landing page** → crawler gets no usable icon → **globe**.

Other factors (secondary):
- Ad display uses **`www.`** while organic canonical is **non-www** — split signals.
- Favicon lives under `/wp-content/uploads/...` not `/favicon.ico` — still OK if crawlable, but root `favicon.ico` helps.
- New or unreviewed ad assets in Google’s system — can lag days/weeks after fix.

### What to do (ads + branding)

| Step | Action |
|------|--------|
| 1 | Change ad **final URL** to `https://artformplasticsurgery.com/book-consultation/` (or homepage + UTM), **not** `/dr-kieliszak/consultation` |
| 2 | Create **301 redirect** `/dr-kieliszak/consultation` → `/book-consultation/` if old links must work |
| 3 | Add **`/favicon.ico`** at domain root (copy of 150×150 PNG) for Ads + browsers |
| 4 | Verify **both** `www` and non-`www` in Search Console; same favicon on both |
| 5 | In Ads, use **canonical host** only (`artformplasticsurgery.com` without www mismatch) |
| 6 | Wait 1–2 weeks after fix; favicon in ads updates on Google’s schedule |

**Meeting line:** *“Your organic listing shows your face because Google likes your homepage. Your ad shows a globe because the ad sends people to a page that returns 404 — we should point ads to Book Consultation and add a redirect.”*

---

## Links

- WAVE homepage report: https://wave.webaim.org/report#/https://artformplasticsurgery.com/
- WAVE with Ads params: https://wave.webaim.org/report#/https://artformplasticsurgery.com/?gad_source=1&gad_campaignid=23879504771
- Main audit: [`AUDIT.md`](./AUDIT.md)
- Meeting checklist: [`MEETING-PREP.md`](./MEETING-PREP.md)
- GitHub: https://github.com/Knight-Logics/High-Prospective-Clients/tree/master/Art-Form-Plastic-Surgery

---

*Print this with AUDIT.md for the office visit, or bring WAVE on a tablet and re-run the extension live on their Wi‑Fi.*
