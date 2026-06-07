# URL Parity Audit

## Findings

- `robots.txt` declares `https://artformplasticsurgery.com/sitemap.xml`, but the live sitemap request returned HTTP 500 during this pass. The fallback audit used live page checks, prior crawl notes, and the rebuild page list.
- The important live non-surgical URL is `/non-surgical-procedures/`. The rebuild previously used the WordPress artifact `/non-surgical-procedures-2/`, so the rebuild now uses `/non-surgical-procedures/` as the canonical slug.
- `/dr-kieliszak/consultation` is a broken paid-ad style URL on the live site. It should redirect to `/book-consultation/` and ad final URLs should use the canonical non-www host.
- `/testimonials/` is intentionally not kept as a standalone page because review content is visible on the homepage. It now redirects to `/#reviews`.
- The live crawl also showed WordPress archive URLs as indexable: `/category/uncategorized/`, `/author/davidico247/`, and `/author/artformpsyahoo-com/`. These are thin archive pages and should redirect to `/blog/` rather than be rebuilt as standalone indexable pages.
- `/areas-we-serve/` is an intentional added page, not a live parity page. It is a local service-area hub for Safety Harbor, Tampa and nearby Tampa Bay communities, designed to avoid thin duplicate city doorway pages.

## Redirects To Configure As 301s

- `/dr-kieliszak/consultation/` -> `/book-consultation/`
- `/dr-kieliszak/` -> `/meet-dr-kieliszak/`
- `/registration/` -> `/book-consultation/`
- `/non-surgical-procedures-2/` -> `/non-surgical-procedures/`
- `/testimonials/` -> `/#reviews`
- `/category/uncategorized/` -> `/blog/`
- `/category/uncategorized/page/2/` -> `/blog/`
- `/author/davidico247/` -> `/blog/`
- `/author/artformpsyahoo-com/` -> `/blog/`
- `/author/artformpsyahoo-com/page/2/` -> `/blog/`

The static build writes client-side redirect pages for preview/static hosting and also emits `dist/_redirects` plus `dist/redirects.json` for host/server import. Production should configure these as server-side 301 redirects where possible.

## Discovery Files

The rebuild now writes `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `humans.txt`, and `.well-known/security.txt` from the same page/profile data used by the build. This helps replacement launch indexing and AI discovery stay aligned with the canonical page set.
