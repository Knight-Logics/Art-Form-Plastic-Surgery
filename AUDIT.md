# Art Form Plastic Surgery — Digital Presence Audit

**Client:** Dr. Christopher Kieliszak ("Dr. K") — Art Form Plastic Surgery  
**Domain:** https://artformplasticsurgery.com/  
**Audit date:** June 3, 2026  
**Prepared for:** Chamber of Commerce follow-up + office visit (systems & automation)  
**Lead contact:** (813) 563-3735 · info@artformplasticsurgery.com  

**Locations:** 801 2nd St N, Safety Harbor, FL 34695 · 1000 W Kennedy Blvd #202, Tampa, FL 33606  

**GitHub repository:** https://github.com/Knight-Logics/Art-Form-Plastic-Surgery  

**Live rebuild preview (GitHub Pages):** https://knight-logics.github.io/Art-Form-Plastic-Surgery/  

**Audit monorepo copy:** https://github.com/Knight-Logics/High-Prospective-Clients/tree/master/Art-Form-Plastic-Surgery  

**Local preview:** `cd rebuild` → `npm install` → `npm run build:fast` → `npm run serve` → http://localhost:3456  

**Accessibility addendum (WAVE — print with this pack):** [`WAVE.md`](./WAVE.md)

---

## Executive summary

Art Form Plastic Surgery has a **polished brand and strong local reputation** (5.0★ / 102+ Google reviews, active GBP, paid search, sitelinks in organic). The site **looks premium** and is clearly built on **WordPress + Elementor** with professional design.

The biggest gaps are **technical performance on mobile** (critical for patients searching on phones), **thin structured data** for a medical practice, **marketing stack sprawl** (many plugins/scripts), and **missed automation** across booking, reviews, and social. Tomorrow’s visit should focus on **what systems they already pay for** vs. what can be unified.

| Area | Grade | One-line verdict |
|------|-------|------------------|
| Brand & design | A | High-end, trustworthy aesthetic |
| Local SEO (GBP) | A- | Strong reviews; limited social links on profile |
| Organic SEO | C+ | Sitelinks help brand; weak titles, thin on-page, missing H1s, no local schema |
| Technical SEO (crawl) | C | 282 URLs; template titles, duplicate routes, content trust errors |
| Paid search | B- | Running ads; favicon/URL consistency issues |
| Site performance (mobile) | D | PSI 42 — LCP 26.5s is a conversion killer |
| Site performance (desktop) | C+ | PSI 70 — fixable with caching/CSS defer |
| Structured data | C- | Only breadcrumbs validate for rich results |
| Accessibility | D+ | WAVE: 9 alt errors, 15 contrast; PSI 78 mobile (see `WAVE.md`) |
| Social | B- | IG solid; TikTok high effort, low reach |
| Automation readiness | ? | Omnisend, forms, chat, popups — needs discovery |

---

## Pros (what’s working)

### Google Business Profile & local trust
- **5.0 rating** with **102+ reviews** — exceptional for plastic surgery.
- Clear categories, hours, phone, address, photos, and “From the business” copy.
- Two locations (Safety Harbor + Tampa) align with site footer and ad geo targeting.

### Organic search presence
- Branded query shows **sitelinks**: Meet Dr Kieliszak, Book Consultation, About, Gallery, Services — signals site structure Google trusts.
- **Custom favicon** appears on organic results (circular gold profile mark).
- Phone number surfaces in sitelink snippets — good for mobile callers.

### Website brand & content
- Hero messaging (“Unlock Your Natural Radiance…”) is clear and on-brand.
- Service taxonomy is logical: Cosmetic, Reconstructive/Functional, Non-Surgical, Hair, Skincare.
- Strong **patient testimonials** with procedure labels (Rhinoplasty, Botox, etc.).
- Dual CTAs: Book Consultation + click-to-call.
- **Payment Plans** page (Cherry financing mentioned in ads) — reduces price objection.
- Blog present — foundation for long-tail SEO (needs consistency audit).

### Technical foundations (partial)
- **HTTPS** valid (cert expires **July 18, 2026** — renew before lapse).
- **www → non-www** redirect works (canonical host: `artformplasticsurgery.com`).
- **LiteSpeed cache** on Hostinger (`X-LiteSpeed-Cache: hit`) — good host choice.
- **robots.txt** allows crawling; sitemap declared.
- **Google Site Kit** + **Google site verification** TXT present.
- Email on **Google Workspace** (MX → SMTP.GOOGLE.com); SPF includes Google + Mailgun.

### Social — Instagram
- Handle: [@faceplasticsurgeon](https://www.instagram.com/faceplasticsurgeon/)
- **936 followers**, **336 posts** — consistent, professional feed for a local surgeon.
- Bio aligns with practice positioning.

### Advertising
- Active **Google Ads** for high-intent terms (Safety Harbor & Tampa).
- Ad copy highlights board certification, gallery, services, Cherry financing.
- Landing path targets consultation funnel (not just homepage).

---

## Cons (risks & opportunities)

### Critical: mobile performance (PageSpeed Insights)

Source: [PageSpeed Insights — Jun 3, 2026](https://pagespeed.web.dev/analysis/https-artformplasticsurgery-com/3c8pk00hbx?form_factor=desktop)

| Metric | Mobile | Desktop |
|--------|--------|---------|
| **Performance** | **42** 🔴 | **70** 🟠 |
| Accessibility | 78 🟠 | 74 🟠 |
| Best Practices | 96 🟢 | 96 🟢 |
| SEO (Lighthouse) | 92 🟢 | 92 🟢 |
| FCP | 6.7s 🔴 | 1.1s 🟠 |
| **LCP** | **26.5s** 🔴 | 2.1s 🟠 |
| TBT | 510ms 🟠 | 390ms 🔴 |
| CLS | 0.042 🟢 | 0.032 🟢 |
| Speed Index | 11.9s 🔴 | 1.4s 🟠 |

**Why it matters:** Most aesthetic surgery research happens on mobile. A 26s LCP means the hero (likely doctor/patient image) loads after users bounce — you’re paying for clicks that hit a blank screen.

**Top Lighthouse opportunities (mobile):**
1. **Render-blocking resources** — ~5,910 ms savings (CSS/JS in `<head>`).
2. **Cache lifetimes** — ~749 KiB (browser caching headers for static assets).
3. **Legacy JavaScript** — ~58 KiB.
4. **Font display** — ~150 ms (use `font-display: swap`).
5. **Image delivery** — ~60 KiB (WebP/AVIF, responsive sizes, preload LCP image).

**No CrUX field data** — site may lack enough Chrome real-user traffic; lab scores are all we have until Search Console CWV report is reviewed.

---

### Structured data & rich results

Source: [Rich Results Test](https://search.google.com/test/rich-results/result?id=aRjljgA4NG9sKrCEr6pYEw)

| Detected | Rich result eligible? |
|----------|----------------------|
| Breadcrumbs | ✅ 1 valid item |
| LocalBusiness / Physician / MedicalBusiness | ❌ Not detected |
| FAQ / Review snippets | ❌ Not detected |

**Issues in current schema (AIOSEO):**
- `Organization` / `WebSite` **name** is `artformplasticsurgery.com` instead of **Art Form Plastic Surgery**.
- No `Physician` entity for Dr. Kieliszak (credentials, `medicalSpecialty`, `sameAs`).
- No `MedicalClinic` with `address`, `geo`, `openingHours`, `telephone`, `hasMap`.
- No `aggregateRating` tied to GBP (must follow Google guidelines — only if reviews are on-page).
- Homepage `WebPage` description is a **dump of body copy** — not a clean meta description.

Exported snapshot: `schema-current.json`

---

### JavaScript errors & plugin bloat

Live crawl (Rich Results “Tested page”) shows:

```
Uncaught TypeError: Class extends value undefined is not a constructor or null
  → elementor-pro/assets/js/preloaded-elements-handlers.min.js (v3.15.0)
```

**Detected plugins (homepage):**
`all-in-one-seo-pack`, `astra-sites`, `elementor`, `elementor-pro`, `feeds-for-tiktok`, `google-site-kit`, `header-footer-elementor`, `instagram-feed`, `jeg-elementor-kit`, `metform`, `omnisend`, `popup-builder`, `simple-banner`

**Third-party scripts (sample):**
- Poptin (`cdn.popt.in`)
- Popup Builder
- Google Tag Manager / Ads conversion (blocked in test by robots — normal)
- `chat.mydashmetrics.com/script.js` — **failed to load** in Google’s test

**Risk:** Elementor + Elementor Pro version mismatch, overlapping popups (Poptin + Popup Builder), and 134 page resources — classic WordPress performance debt.

**Stack inference:** WordPress on **Hostinger** (LiteSpeed, PHP 8.2.30), likely built by an agency or freelancer using **Elementor Pro + Astra/Jeg kit** — not a lightweight custom theme.

---

### SEO & on-page (expanded)

**Important:** Lighthouse’s “SEO” score (**92**) only checks basics (meta, crawlability, tap targets). It does **not** reflect whether the site can rank for competitive procedure + geo queries. The issues below are what actually limit organic growth.

#### Title tags & SERP presentation
| Issue | Impact |
|-------|--------|
| **Site-wide title template** | Nearly every page: `{Page Name} - artformplasticsurgery.com` — brand domain in titles wastes characters and looks unprofessional vs competitors using “Facial Plastic Surgeon Tampa \| Art Form…” |
| **Homepage** | `Home - artformplasticsurgery.com` — no primary keyword (rhinoplasty, facelift, facial plastic surgeon, Safety Harbor, Tampa) |
| **Duplicate titles** | `/non-surgical-procedures/` and `/non-surgical-procedures-2/` share the same title pattern — cannibalization risk |
| **Procedure pages** | Long slug URLs are fine, but titles likely don’t front-load **procedure + city** (needs GSC query data to confirm) |

**Target pattern:** `{Primary Service} in Tampa & Safety Harbor \| Art Form Plastic Surgery` (≤ ~60 chars where possible).

#### Meta descriptions
| Issue | Impact |
|-------|--------|
| **Homepage / WebPage schema** | Description reads like **scraped body copy** (hero + button text), not a crafted 150–160 char pitch with CTA |
| **Missing uniqueness** | SF crawl exports suggest many pages rely on template defaults — weak CTR in SERPs |
| **No FAQ / offer hooks** | Competitors often use “board-certified,” “financing,” “consultation” in meta — yours underuses paid differentiators |

#### Headings & content structure (Screaming Frog)
| Issue | Impact |
|-------|--------|
| **Missing H1** | High-intent URLs without H1: `/book-consultation/`, `/contact/`, `/about-us/`, `/services/`, `/blog/`, `/payment-plans/`, `/cosmetic-procedures/`, `/skincare/`, `/hair-restoration/`, and more |
| **H1 vs visual headline** | Elementor often uses styled headings that aren’t a true `<h1>` — Google and screen readers see a weaker structure |
| **Single H1 discipline** | Service silos need one clear H1 per URL matching the title intent |

#### Indexation, URLs & architecture
| Issue | Impact |
|-------|--------|
| **Duplicate service paths** | Two non-surgical URLs — consolidate or 301 to canonical |
| **Author archives exposed** | `author/davidico247/`, `author/artformpsyahoo-com/` — thin/legacy URLs; noindex or disable in AIOSEO |
| **Ad / legacy paths** | `/dr-kieliszak/consultation` issues vs `/book-consultation/` — split signals, wasted link equity |
| **Blog depth** | Nav present; without consistent posts + internal links to money pages, blog adds little long-tail value |
| **Internal linking** | Procedure pages should hub from `/services/` with descriptive anchor text (not just “Learn more”) |

#### Local & YMYL SEO (medical)
| Issue | Impact |
|-------|--------|
| **No LocalBusiness / Physician JSON-LD** | Rich Results: breadcrumbs only — misses local pack adjacency and knowledge-panel signals |
| **Two locations, weak geo targeting** | Safety Harbor + Tampa in footer/GBP but likely thin **city + service** landing copy on site |
| **E-E-A-T gaps** | Board certification mentioned — needs prominent **credentials, training, hospital privileges, before/after policy** on `/meet-dr-kieliszak/` with matching schema |
| **Trust copy errors** | “Plastic Suegery,” “Free Estimate,” wrong phone on bio page — **direct SEO + conversion harm** for YMYL |
| **Review schema** | Do not paste GBP stars into schema unless reviews are displayed on-page per Google rules |

#### Content quality & keywords (competitive gap)
| Gap | Notes |
|-----|--------|
| **Procedure depth** | Rhinoplasty, facelift, etc. exist — compare word count, FAQs, recovery timelines, cost framing vs top 3 Tampa competitors |
| **FAQ blocks** | No FAQ schema detected — add real FAQs per procedure (candidates for rich results where eligible) |
| **Image SEO** | Large hero JPGs in crawl; weak filenames/alt on builder images — missed “facial plastic surgeon Tampa” image search |
| **Video** | TikTok/IG active; little **VideoObject** or embedded explainers on site for procedure pages |
| **Financing** | Cherry mentioned in ads — `/payment-plans/` should be internally linked from every high-ticket service page |

#### Off-page & citations (summary)
| Issue | Impact |
|-------|--------|
| **NAP inconsistency** | Multiple phone variants in directories; stale **Vivify Plastic Surgery** on WebMD/Vitals |
| **GBP strong, site weak** | 5.0★ reviews outperform on-page SEO — fixing site catches up to reputation |
| **Ahrefs blocked** | Full backlink/competitor gap needs domain verification — use GSC + manual SERP checks until access granted |

#### What’s working (SEO)
- Branded organic **sitelinks** (Book, About, Gallery, Services) — trust signal
- **robots.txt** + sitemap declared; **0 internal 4xx** in SF crawl (Jun 3)
- **HTTPS**, canonical host, indexing not obviously blocked
- **Blog + service taxonomy** — good bones if maintained
- **Custom rebuild** documents fixes: titles, schema, phone, H1-ready homepage hero

---

### Google Ads vs organic branding

From SERP observation (Jun 3, 2026):

| | Organic | Paid ad |
|--|---------|---------|
| URL shown | `artformplasticsurgery.com` | `artformplasticsurgery.com` (display) |
| Ad deep link | — | `www.artformplasticsurgery.com/dr-kieliszak/consultation` |
| Favicon | ✅ Custom | ❌ Generic globe |
| Extensions | Sitelinks | About Dr. K, Gallery, Services, Payment Plans |

**Why the ad shows a globe but organic shows your logo:** The ad’s final URL is `www.artformplasticsurgery.com/dr-kieliszak/consultation`, which returns **HTTP 404** (verified Jun 4, 2026). Google can’t pull a favicon from a missing page. The **homepage and `/book-consultation/` both return 200** and include `link rel="icon"` to the gold profile PNG — the favicon exists; the **ad URL is wrong**.

**Action:** Point ads to `https://artformplasticsurgery.com/book-consultation/` (or homepage + UTMs); 301 redirect the old consultation path; add `/favicon.ico` at domain root; verify www + non-www in Search Console. Details: [`WAVE.md` § Google Ads favicon](./WAVE.md#google-ads-favicon--why-organic-shows-the-logo-but-the-ad-shows-a-globe).

---

### Google Business Profile — social gaps

GBP lists only **Instagram** and **TikTok**. Missing if they exist:
- Facebook (often expected for 35+ demographic)
- YouTube (procedure explainers, BAA video)
- LinkedIn (professional referrals)

Adding verified social profiles can improve trust and cross-signals.

---

### Social media — TikTok

- Handle: [@faceplasticsurgeon](https://www.tiktok.com/@faceplasticsurgeon)
- **~486 followers** despite heavy posting; top video **~1,872 views**
- **Insight:** Volume ≠ reach. Likely needs hook testing, SEO captions, trending audio strategy, or repurposing top performers to Reels/Shorts with paid boost.

Instagram is the stronger channel for this demographic; TikTok may still be worth it for top-of-funnel if production cost is low.

---

### Security & privacy (medical practice)

| Item | Status |
|------|--------|
| SSL | ✅ Valid until Jul 2026 |
| CSP | `upgrade-insecure-requests` only — basic |
| `X-Powered-By: PHP/8.2.30` | Exposed — minor info leak |
| HIPAA | **Not assessed** — need to know: patient portal, EMR, form data storage, BAAs with Hostinger/Omnisend/Metform |
| wp-json REST API | Public (standard WP) — ensure user enumeration not exposed |

---

### Accessibility (PSI + WAVE)

**PageSpeed:** Accessibility **78** (mobile) / **74** (desktop) — understates real issues.

**WAVE (Jun 4, 2026):** **9** missing alt text · **15** contrast errors · **14** alerts on homepage ([full report → `WAVE.md`](./WAVE.md)). Online scan showed a **synchronization warning** — confirm fixes with the WAVE browser extension.

Worth manual keyboard + screen reader pass on **Book Consultation** (Metform) and mobile menu.

---

## Technical scan summary (automated, Jun 3 2026)

```
Host:           artformplasticsurgery.com (canonical)
Server:         LiteSpeed / Hostinger
PHP:            8.2.30
Cache:          LiteSpeed Cache (HIT)
Homepage size:  ~264 KB HTML
JSON-LD:        Yes (AIOSEO)
Page builder:   Elementor + Elementor Pro
SEO plugin:     All in One SEO Pack
Analytics:      Google Site Kit (assume GA4 + GSC)
Email:          Google Workspace + Mailgun (SPF)
SSL expiry:     2026-07-18
www redirect:   → non-www ✅
robots.txt:     ✅ Sitemap declared
```

---

## Screaming Frog crawl (Jun 3, 2026)

**282 URLs** crawled in ~17s (CLI headless, free licence). Exports: `crawl-screaming-frog/`.

| Finding | Detail |
|---------|--------|
| Internal HTML URLs | 267 |
| 4xx errors (internal pages) | **0** |
| 200 / 301 | 265 / 2 |
| Title pattern | Almost all: `{Page} - artformplasticsurgery.com` |
| Duplicate titles | `/non-surgical-procedures/` + `/non-surgical-procedures-2/` |
| Missing H1 | book-consultation, contact, about, services, blog, payment-plans, many others |
| Largest payloads | Hero JPGs + Elementor screenshot thumbnails |

**Ahrefs:** Free Site Explorer requires **domain verification** — cannot audit until client adds you in GSC or DNS. Use GSC + Screaming Frog + manual checks instead.

See `crawl-screaming-frog/CRAWL-SUMMARY.md` for re-run command.

---

## Trust-damaging content (verified)

High-ticket medical practices cannot afford visible template errors.

| Issue | Example URL |
|-------|-------------|
| **0+ counters** | Homepage, `/non-surgical-procedures-2/` | <--- this may start at 0, but it is a counter - I assume you have a strategy for this?>
| **Placeholder text** | `/functional/` — “This is the text for ‘Split ear lobe repair’…” |
| **“Plastic Suegery”** | `/services/`, `/testimonials/` |
| **“Get a Free Estimate”** | `/services/`, `/testimonials/` (use **Consultation**) |
| **“Dr. Keliszak”** typo | `/meet-dr-kieliszak/`, `/testimonials/` |
| **Wrong phone** | `/meet-dr-kieliszak/` lists **813-434-3238** (canonical: **563-3735**) |

### NAP / phone inconsistency

| Number | Source |
|--------|--------|
| **(813) 563-3735** | GBP, homepage, contact — **use everywhere** |
| 813-434-3238 | Meet Dr page |
| 813-565-3735, 813-588-5150 | Third-party directories (per citation research) |
| Stale **Vivify Plastic Surgery** | WebMD/Vitals — prior brand cleanup needed |

---

## Schema — full target list (underbuilt today)

Rich Results: **Breadcrumbs only.** Should implement:

`Physician` · `MedicalBusiness` / `LocalBusiness` · `Organization` · `Service` · `FAQPage` · `BreadcrumbList` · `VideoObject` · `ImageObject` · `PostalAddress` · `OpeningHoursSpecification` · `sameAs` (social + GBP)

Fix AIOSEO organization name from `artformplasticsurgery.com` → **Art Form Plastic Surgery**.

---

## Ads & compliance (health-sensitive category)

Audit **before** changing ads, remarketing, or form automations:

- Google Ads conversion tracking · call tracking · enhanced conversions  
- Remarketing audiences (cosmetic surgery = restricted)  
- GA4 event data · chat/form PHI · SMS consent · cookie consent  
- HIPAA vendor BAAs · before/after photo consent · testimonial consent  

Terms page includes SMS STOP/HELP language — good baseline.

---

## 5-phase improvement plan

| Phase | Focus |
|-------|--------|
| **1 — Immediate** | Phones, typos, counters, placeholder, “Free Estimate” → Consultation, favicon/ads URLs, UTMs |
| **2 — Speed** | Plugin cleanup, Elementor update, hero preload, defer JS, delay popups/chat, retest mobile PSI |
| **3 — Schema/SEO** | Physician/clinic schema, FAQs, service page depth, local city pages, internal linking |
| **4 — Citations** | Directory audit, Vivify cleanup, NAP, GBP services/Q&A/posts, local links |
| **5 — Automation** | Missed-call SMS, form auto-response, nurture, reviews, financing reminders, monthly dashboard |

**Phase 2 audits (after tomorrow):** NAP/citations · SSL Labs · securityheaders.com · `site:` index review · DMARC · manual a11y · form test · HIPAA form review.

---

## Recommended additional audits (fuller picture)

Use this as a checklist for tomorrow and follow-up weeks.

### Requires client access (high value)
| Audit | Tool / method | Why |
|-------|---------------|-----|
| Google Search Console | GSC | Queries, indexing, CWV, manual actions |
| GA4 + Ads | GA4, Google Ads | Conversion paths, CPA, landing page bounce |
| Google Ads account | Ads UI | Quality Score, search terms, wasted spend, conversion tracking |
| GBP Insights | Business Profile | Calls, direction requests, photo views |
| Email (Omnisend) | Omnisend | List health, automations, HIPAA alignment |
| EMR / practice software | On-site | What can sync: appointments, reminders, reviews |
| Cherry / financing | Portal | Lead handoff from Payment Plans page |
| Call tracking | CallRail / etc. | Attribute calls to ads vs organic |

### Can run without login (you or us)
| Audit | Tool |
|-------|------|
| Broken links | ✅ Screaming Frog (Jun 3) — 0 internal 4xx |
| Full sitemap URL inventory | SF crawl or sitemap parse |
| Competitor SERP | Local pack for “rhinoplasty Tampa”, “facelift Safety Harbor” |
| NAP citations | BrightLocal / manual Yelp/Healthgrades/Zocdoc |
| Backlink profile | Ahrefs / Semrush |
| SSL deep scan | [SSL Labs](https://www.ssllabs.com/ssltest/) |
| Security headers | [securityheaders.com](https://securityheaders.com) |
| Mobile-friendly | Google Mobile-Friendly Test |
| HIPAA marketing checklist | Internal checklist for forms & email |
| Content gap | Compare service pages vs top 3 competitors |
| Review sentiment | Export GBP reviews — themes for ads & landing pages |
| Image weight audit | Per-template hero sizes on mobile |
| Form UX test | Submit test lead on Book Consultation |
| Email auth | MXToolbox SPF/DKIM/DMARC |
| Page indexation | `site:artformplasticsurgery.com` operator review |
| Screaming Frog crawl | ✅ 282 URLs — see `crawl-screaming-frog/` |

### API / automated (completed or queued)
| Check | Status |
|-------|--------|
| HTTP headers & SSL | ✅ Done |
| DNS MX/SPF/verification | ✅ Done |
| Homepage plugin fingerprint | ✅ Done |
| JSON-LD extraction | ✅ Done |
| robots.txt | ✅ Done |
| PageSpeed (user-provided) | ✅ Documented |
| Rich Results (user-provided) | ✅ Documented |
| www / consultation URL probe | ✅ Done (404/redirect issues noted) |
| Screaming Frog CLI crawl | ✅ Done — 282 URLs, exports in `crawl-screaming-frog/` |
| Trust content scan | ✅ Placeholder, typos, wrong phone, Free Estimate |

---

**On-site checklist:** `MEETING-PREP.md` (bring tomorrow).

---

## Automation opportunities (for office visit)

**Goal:** Map what they do manually today → what software they already pay for → quick wins.

### Likely quick wins
1. **Review request automation** — post-consult / post-op SMS/email → Google review (they already have stellar ratings; systematize growth).
2. **Lead routing** — Metform / consultation form → CRM + instant SMS to coordinator + calendar link.
3. **Omnisend sequences** — welcome, consultation reminder, procedure prep, follow-up (confirm HIPAA).
4. **Social repurposing** — TikTok → IG Reels → YouTube Shorts (batch monthly).
5. **Popup consolidation** — Poptin + Popup Builder → one tool; exit-intent for consultation only.
6. **Reporting dashboard** — Site Kit + Ads + GBP calls in one weekly email.
7. **Performance package** — image CDN, critical CSS, defer non-critical JS, fix Elementor Pro error.

### Questions to ask tomorrow
- What happens when someone submits **Book Consultation**? (email only vs CRM)
- Who manages **Google Ads**? In-house or agency? Monthly spend?
- **EMR / patient management** name? (ModMed, PatientNow, etc.)
- How are **before/after gallery** photos approved and published?
- Is **Omnisend** actively used or installed-only?
- What is **mydashmetrics.com** chat supposed to do? Is anyone monitoring it?
- **Cherry** — embedded application or link-out?
- Staff roles: who answers phone, DMs, reviews?
- Any **HIPAA** concerns with current forms/popups?

---

## Priority recommendations (ranked)

### P0 — Do first (revenue & trust)
1. Fix **mobile LCP** — preload hero, WebP, reduce render-blocking CSS, audit Elementor asset loading.
2. Fix **Elementor Pro JS error** — update Elementor + Pro to matched versions.
3. Resolve **ad landing URL** + favicon consistency; confirm consultation path works.
4. Rewrite **homepage title/meta** for “Facial plastic surgeon Safety Harbor / Tampa” + brand.

### P1 — SEO & local (30 days)
5. Add **Physician + MedicalClinic** JSON-LD (both locations, phone, hours, sameAs social).
6. Fix AIOSEO **organization name** to Art Form Plastic Surgery.
7. Expand GBP social links; post weekly GBP updates tied to blog/TikTok.
8. Citation audit — ensure NAP identical on Healthgrades, RealSelf, Yelp, etc.

### P2 — Growth & automation (60–90 days)
9. Consolidate popups/chat; implement call + form automation.
10. TikTok strategy: quality over quantity OR paid spark ads on top 3 videos.
11. Content plan: procedure pages (rhinoplasty, facelift) with FAQs + schema.
12. Accessibility pass on booking funnel.

---

## Links & evidence

- **WAVE accessibility addendum:** [`WAVE.md`](./WAVE.md)
- **GitHub (audit + rebuild source):** https://github.com/Knight-Logics/High-Prospective-Clients/tree/master/Art-Form-Plastic-Surgery
- Website (live): https://artformplasticsurgery.com/
- PageSpeed: https://pagespeed.web.dev/analysis/https-artformplasticsurgery-com/3c8pk00hbx?form_factor=desktop
- Rich Results: https://search.google.com/test/rich-results/result?id=aRjljgA4NG9sKrCEr6pYEw
- Instagram: https://www.instagram.com/faceplasticsurgeon/
- TikTok: https://www.tiktok.com/@faceplasticsurgeon

---

*Next file: `MEETING-PREP.md` — printable checklist for office visit.*
