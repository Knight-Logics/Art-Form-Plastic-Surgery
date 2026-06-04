# Office Visit — Art Form Plastic Surgery

**Date:** Tomorrow  
**Client:** Dr. Christopher Kieliszak · Art Form Plastic Surgery  
**Domain:** https://artformplasticsurgery.com/  
**Phone (canonical):** (813) 563-3735  

**Bring this file + laptop.**  
**Time on site: ~45 min** (dentist visit 9:30 AM after — stay disciplined)  
**Deep reference:** `AUDIT.md` · `PRE-VISIT-AUDITS.md` · `crawl-screaming-frog/`  
**Rebuild POC:** `rebuild/` — run `npm run build` then `npm run serve` → http://localhost:3456

---

## 45-minute agenda

| Min | Block | Goal |
|-----|--------|------|
| 0–5 | Rapport + frame | “Strong brand; technical structure is holding you back” |
| 5–15 | Show 3–4 findings only | Mobile PSI, trust page, schema, crawl size (not nitty-gritty) |
| 15–30 | **Access + systems** | GSC, GA4, Ads, GBP, WP, Omnisend, EMR — use checklist below |
| 30–40 | **Two paths** | WP optimize vs custom rebuild — see pitch section |
| 40–45 | Next steps | Backend review deadline, POC page, follow-up call |

**Do not** dump 282 URLs or plugin names unless he asks.

---

## 60-second pitch

> “Your reviews and brand are already strong. The site looks great on desktop, but mobile load times are costing you patients, and there are a few trust issues on inner pages — wrong phone numbers, placeholder text, ‘free estimate’ language on a medical site. I’d like to see how your backend is set up today. Depending on that, we either optimize WordPress or preserve the look on a faster custom foundation — same brand, cleaner code, better SEO and automation.”

---

## How to pitch the rebuild (Option B — not “I’ll copy your site”)

**Say:**
> “You have a strong design and brand foundation. The question is whether we optimize the current WordPress build or preserve the look and rebuild on a cleaner, faster custom foundation. I’d want to check the backend first, but based on the crawl, a custom rebuild may be the cleaner long-term path for speed, schema, and automation.”

### Two paths (let him choose after backend review)

| Option | Pitch | When it fits |
|--------|--------|----------------|
| **A — WordPress optimization** | Faster, cheaper, less disruptive | Clean WP admin, staff edits in WP daily, budget-conscious |
| **B — Custom performance rebuild** | Preserve premium look; faster, automation-ready | Bloated plugins, serious growth budget, wants less plugin risk |

### Why rebuild is *viable* here (your internal talking points)

- **282 URLs / 267 HTML pages / 0 internal 4xx** — not a mess; **migratable**
- Visually strong but **Elementor + 12+ plugins**, mobile PSI **42**, LCP **26.5s**
- Weak titles, missing H1s, schema = breadcrumbs only
- WP repair = fighting symptoms forever; custom = control speed, schema, forms, tracking, CRM

### Strongest package to sell (later)

**Custom-coded performance rebuild + SEO/schema + tracking + lead automation** — not a $500 duplicate job.

### Step after today (your process)

1. **Today** — Audit systems + access  
2. **This week** — Review WP backend; decide A vs B  
3. **POC** — One page only (`/book-consultation/` or rhinoplasty): same look, faster, correct H1/title/schema, clean CTA tracking  
4. **Pitch** — “I rebuilt a key page as a prototype — preserved design, cleaner codebase”

### Migration risks — must not break

- Indexed URLs & branded sitelinks  
- Ads final URLs & conversion tracking  
- Forms + phone click tracking  
- GA4 / GTM / Ads tags  
- Gallery + consultation funnel  
- GBP NAP consistency  
- **Rights:** Confirm he owns copy, photos, layout (agency contract?)

### Ownership question (ask today)

- [ ] Who built the site? Agency name?  
- [ ] Do you own images, copy, and design for reuse?  
- [ ] Elementor license — whose account?

---

## Priority 1 — Get access while you’re there (highest ROI)

**Goal:** Viewer or admin access on each. If they can’t add you today, get the name/email of who can and a timeline.

### Google Search Console
- [ ] Added as user (email: _______________)
- [ ] Note top queries, impressions, CTR
- [ ] Coverage / indexing errors
- [ ] Core Web Vitals report (mobile vs desktop)
- [ ] Any manual actions or security issues

### GA4 + Google Ads
- [ ] GA4 property access
- [ ] Confirm **conversion events** (form submit, phone click, thank-you page)
- [ ] Google Ads account access
- [ ] Monthly ad spend: $________
- [ ] Who manages ads? (in-house / agency): _______________
- [ ] Search terms report — any wasted spend?
- [ ] **Enhanced conversions** on/off?
- [ ] **Remarketing** audiences — health-sensitive category review needed
- [ ] Ad final URL: confirm `www` vs non-www and `/dr-kieliszak/consultation` vs `/book-consultation/`

### Google Business Profile (Insights)
- [ ] Manager access
- [ ] Last 28 days: calls, direction requests, website clicks, messages
- [ ] Services listed vs website services
- [ ] Photos — who uploads?
- [ ] Q&A — any unanswered?
- [ ] Social links: only IG + TikTok — add Facebook/YouTube if they exist?
- [ ] UTM on website link? (recommend `?utm_source=gbp&utm_medium=organic`)

### Omnisend
- [ ] Login access
- [ ] Active automations? (welcome, abandoned, post-consult)
- [ ] List size / growth
- [ ] **HIPAA:** Is PHI ever in email/SMS? BAA with Omnisend?
- [ ] Connected to WordPress / forms?

### EMR / practice software
- [ ] Software name: _______________ (ModMed, PatientNow, Nextech, etc.)
- [ ] Patient portal?
- [ ] Can it send appointment reminders?
- [ ] Review request capability built-in?
- [ ] What syncs today with website forms? (nothing / email only / CRM)

### WordPress / hosting
- [ ] WP admin or agency contact: _______________
- [ ] Hostinger login
- [ ] Who owns Elementor Pro license?
- [ ] Last plugin/theme update date

### Other tools to ask about
- [ ] Cherry financing — embed or link only?
- [ ] Chat: mydashmetrics — anyone monitoring?
- [ ] Poptin + Popup Builder — still wanted?
- [ ] Call tracking (CallRail, etc.)?
- [ ] Before/after photo approval workflow
- [ ] Who posts IG / TikTok?

---

## Priority 1 — Compliance & tracking (cosmetic / health-adjacent)

**Do not change ads or automations until these are understood.**

| Item | Status / notes |
|------|----------------|
| Google Ads conversion tracking | |
| Call tracking | |
| Enhanced conversions | |
| Remarketing audiences | |
| GA4 event data (what’s collected?) | |
| Chat / form **PHI** exposure | |
| SMS consent (Terms page has STOP/HELP — confirm opt-in on forms) | |
| Cookie consent banner | |
| HIPAA / vendor **BAAs** (Hostinger, Omnisend, Metform, chat) | |
| Before/after photo **model releases** | |
| Testimonial **consent** on file | |

**Good:** Terms page includes SMS terms and states SMS consent is not shared with third parties.

**Policy note:** Invasive cosmetic procedures are treated as health-sensitive for personalized advertising — audit remarketing and audiences before expanding.

---

## Screaming Frog crawl (automated — Jun 3, 2026)

**Command used:** Headless CLI · `https://artformplasticsurgery.com/`  
**Results folder:** `crawl-screaming-frog/` (CSV exports)

| Metric | Result |
|--------|--------|
| URLs crawled | **282** |
| HTML URLs (internal export) | **267** |
| HTTP 200 | 265 |
| HTTP 301 | 2 |
| HTTP 4xx (internal pages) | **0** |
| Licence | Free (500 URL cap — site within limit) |

### SEO crawl findings
- **Title pattern:** Almost all pages use `Page Name - artformplasticsurgery.com` — weak for rankings and trust.
- **Duplicate title:** Two URLs share “Non Surgical Procedures - artformplasticsurgery.com” (`/non-surgical-procedures/` and `/non-surgical-procedures-2/`).
- **Missing H1** on many key pages (Elementor): skincare, book-consultation, contact, about, services, blog, payment-plans, several procedure posts.
- **Thin meta:** Payment plans, book-consultation, some author/archive pages.
- **Non-indexable:** Privacy policy & payment-plans show as redirected in crawl; author/category pagination has `noindex` (OK).
- **Heavy assets:** Largest crawl hits are uncompressed JPGs and Elementor thumb screenshots — ties to mobile LCP issue.

### Ahrefs / backlinks — what we have
- **No Ahrefs backlink export** — free plan needs domain verification (screenshot you saw).
- **Screaming Frog ≠ backlinks** — it only crawled his own site.
- **Partial manual list** in `PRE-VISIT-AUDITS.md` (Chamber, social, NPI, RealSelf gap).
- **After access:** GSC → Links report (free, accurate enough to start).
- **Bing Webmaster** — same verification wall; not worth it tonight unless he adds you later.

**Important:** Federal **NPI** lists **813-434-3238** — fixing the website alone won’t fix directories; include NPI update in citation cleanup.

---

## Trust-damaging content (verified — fix in Phase 1)

| Issue | Where | Action |
|-------|--------|--------|
| **“0+ Happy Patients” / “0+ Years”** | Homepage, some service pages | Fix counter JS or hardcode real stats |
| **Placeholder copy** | `/functional/` — “This is the text for ‘Split ear lobe repair’…” | Replace with final medical copy |
| **“Plastic Suegery”** | `/services/`, `/testimonials/` | Fix spelling |
| **“Get a Free Estimate”** | `/services/`, `/testimonials/` | Change to **“Book a Consultation”** |
| **“Dr. Keliszak”** (misspelling) | `/meet-dr-kieliszak/`, `/testimonials/` | Fix to Kieliszak |
| **Wrong phone on Meet Dr page** | `/meet-dr-kieliszak/` shows **813-434-3238** | Standardize to **813-563-3735** |

### NAP / phone inconsistency (cleanup project)

| Number | Where seen |
|--------|------------|
| **(813) 563-3735** | GBP, homepage, contact, ads (primary) |
| 813-434-3238 | Meet Dr Kieliszak page |
| 813-565-3735 | Third-party directories (per prior research) |
| 813-588-5150 | Third-party directories (per prior research) |

Also audit **stale Vivify Plastic Surgery** listings on WebMD/Vitals from prior practice name.

---

## Schema — underbuilt (easy win)

Rich Results test: **only Breadcrumbs** valid.

**Should add (sitewide / key templates):**
- `Physician` (Dr. Kieliszak)
- `MedicalBusiness` / `LocalBusiness` (both addresses)
- `Organization` (correct name: Art Form Plastic Surgery)
- `Service` (per procedure)
- `FAQPage` + on-page FAQs
- `BreadcrumbList` (have — keep)
- `VideoObject` (TikTok/IG embeds)
- `ImageObject` (gallery)
- `PostalAddress`, `OpeningHoursSpecification`
- `sameAs` → Instagram, TikTok, GBP

**Current bug:** AIOSEO sets organization name to `artformplasticsurgery.com` instead of brand name.

---

## WordPress / plugin stack (cleanup = speed)

**Host:** Hostinger · LiteSpeed · PHP 8.2.30  

**Plugins detected:** AIOSEO, Elementor, Elementor Pro, Google Site Kit, Metform, Omnisend, Popup Builder, Poptin, Instagram feed, TikTok feed, Jeg Elementor Kit, Header Footer Elementor, Simple Banner, Astra Sites  

**Issues:**
- Elementor Pro **JavaScript error** in Google crawl (version mismatch risk)
- Poptin + Popup Builder + chat = script bloat
- `chat.mydashmetrics.com` failed to load in Rich Results test

**Not broken — but bloated.** Drives mobile PSI 42 / LCP 26.5s.

---

## Pre-visit audits already done (no login)

| Done | Finding (short) |
|------|------------------|
| ✅ PageSpeed / Rich Results | Mobile 42, LCP 26.5s; schema = breadcrumbs only |
| ✅ Screaming Frog | 282 URLs, 0 internal 4xx, weak titles, missing H1s |
| ✅ SSL / DNS | Cert OK Jul 2026; SPF OK; DMARC `p=none` |
| ✅ Security headers | No HSTS / X-Frame-Options — harden on rebuild |
| ✅ Trust pages | Placeholder, typos, wrong phone, “Free Estimate” |
| ✅ NPI lookup | 813-434-3238 on file — root cause for wrong number |
| ⏳ SSL Labs grade | Run in browser tonight — 2 min |
| ⏳ `site:` index count | Run in Google tonight — note header count |
| ❌ Full backlinks | Need GSC Links or paid tool after access |

Details: `PRE-VISIT-AUDITS.md`

## Phase 2 — After access / follow-up week

- [ ] GSC Links export (backlinks)
- [ ] NAP / citations (Yelp, RealSelf, Healthgrades, WebMD, Vitals, **NPI**)
- [ ] SSL Labs screenshot
- [ ] securityheaders.com
- [ ] Manual accessibility + **Book Consultation** form test
- [ ] HIPAA form/email review
- [ ] Competitor backlink gap (Ahrefs once verified or Semrush trial)

---

## 5-phase improvement plan (proposal backbone)

### Phase 1 — Immediate cleanup (week 1)
- [ ] Fix all phone numbers sitewide
- [ ] Fix typos (Keliszak, Suegery)
- [ ] Replace 0+ counters
- [ ] Remove placeholder on `/functional/`
- [ ] Replace “Free Estimate” → “Consultation”
- [ ] Ad favicon / URL alignment with organic
- [ ] Consultation landing page copy pass
- [ ] UTM on GBP, ads, social bio links

### Phase 2 — Speed / technical (weeks 2–3)
- [ ] Plugin audit + remove duplicates
- [ ] Update Elementor + Pro (matched versions)
- [ ] Preload/optimize hero image (WebP)
- [ ] Defer noncritical JS; delay chat/popup until interaction
- [ ] Font-display swap; cache headers
- [ ] Remove unused CSS/JS
- [ ] Re-test mobile PageSpeed (target 70+)

### Phase 3 — Schema / SEO (weeks 3–6)
- [ ] Full Physician + MedicalClinic schema
- [ ] FAQ sections + FAQ schema on procedure pages
- [ ] Expand thin service pages
- [ ] Internal links: service → gallery → testimonial → consult
- [ ] Local landing pages: Safety Harbor, Tampa, Clearwater, Palm Harbor, Dunedin, St. Pete

### Phase 4 — Local SEO / citations (ongoing)
- [ ] Directory audit + Vivify cleanup
- [ ] Standardize NAP everywhere
- [ ] GBP services + Q&A + weekly posts
- [ ] Chamber / medical association links

### Phase 5 — Automation
- [ ] Missed-call text-back
- [ ] Consultation form auto-response
- [ ] Procedure nurture sequences
- [ ] Post-consult follow-up
- [ ] Financing reminder (Cherry)
- [ ] Review request workflow
- [ ] Social DM lead capture
- [ ] GBP lead tracking
- [ ] Monthly dashboard: leads, calls, booked consults, show rate, close rate, revenue by source

---

## Systems inventory (quick checklist)

### Lead generation
- [ ] Phone leads logged how?
- [ ] Book Consultation form → where?
- [ ] Google Ads — tracking OK?
- [ ] Chat monitored?
- [ ] Popups still needed?

### Patient journey
- [ ] Scheduling tool?
- [ ] Reminder texts/emails?
- [ ] Post-op follow-up?
- [ ] Review requests — manual or auto?

### Content
- [ ] Gallery approval workflow
- [ ] Blog owner + frequency

---

## Show on laptop (pick 3 max — 45 min)

1. Mobile PageSpeed filmstrip — blank → hero (**42**, LCP **26.5s**)
2. `/functional/` placeholder OR `/meet-dr-kieliszak/` wrong phone (open on phone)
3. Rich Results — “only breadcrumbs”
4. Optional: Two-path slide — WP optimize vs custom rebuild (verbal is fine)

**Skip unless asked:** CSV exports, full plugin list, DMARC details

---

## Notes during visit

**Staff met:**

**Biggest pain point:**

**Monthly ad spend:**

**EMR / software:**

**Access granted today:** GSC ☐ GA4 ☐ Ads ☐ GBP ☐ WP ☐ Omnisend ☐

**Decision maker / timeline:**

**Budget range:**

**Follow-up date:**

---

## Reference scores (Jun 3, 2026)

| | Mobile | Desktop |
|--|--------|---------|
| Performance | 42 | 70 |
| Accessibility | 78 | 74 |
| Best Practices | 96 | 96 |
| SEO (Lighthouse) | 92 | 92 |

Links: [PageSpeed](https://pagespeed.web.dev/analysis/https-artformplasticsurgery-com/3c8pk00hbx?form_factor=desktop) · [Rich Results](https://search.google.com/test/rich-results/result?id=aRjljgA4NG9sKrCEr6pYEw)
