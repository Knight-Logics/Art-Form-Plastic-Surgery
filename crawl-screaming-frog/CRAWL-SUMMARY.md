# Screaming Frog Crawl Summary

**Site:** https://artformplasticsurgery.com/  
**Date:** June 3, 2026  
**Tool:** Screaming Frog SEO Spider 23.3 (CLI, headless, free licence)  
**Crawl time:** ~17 seconds · **282 URLs** discovered · **267** in Internal export  

## Exports in this folder

| File | Contents |
|------|----------|
| `internal_all.csv` | All internal URLs, status, indexability, size |
| `page_titles_all.csv` | Title tags |
| `meta_description_all.csv` | Meta descriptions |
| `h1_all.csv` | H1 tags |
| `response_codes_client_error_(4xx).csv` | Empty — no internal 4xx pages |

## HTTP status

| Code | Count |
|------|-------|
| 200 | 265 |
| 301 | 2 |
| 4xx (internal HTML) | 0 |

## Key issues for proposal

1. **Title tag template** — `{Page} - artformplasticsurgery.com` on nearly all pages; homepage is `Home - artformplasticsurgery.com`.
2. **Duplicate title** — `/non-surgical-procedures/` and `/non-surgical-procedures-2/`.
3. **Missing H1** on high-value URLs: book-consultation, contact, about-us, services, blog, payment-plans, cosmetic-procedures, skincare, hair-restoration, etc.
4. **Large media URLs** in crawl — hero JPGs and Elementor screenshot thumbs dominate payload.
5. **Author/username exposed** in URLs — `author/davidico247/`, `author/artformpsyahoo-com/` (minor hygiene).

## Re-run command

```powershell
$cli = "C:\Program Files (x86)\Screaming Frog SEO Spider\ScreamingFrogSEOSpiderCli.exe"
$out = "E:\Website Audit\High Prospective Clients\Art-Form-Plastic-Surgery\crawl-screaming-frog"
& $cli --crawl "https://artformplasticsurgery.com/" --headless --output-folder $out --overwrite --export-format csv --export-tabs "Internal:All,Page Titles:All,Meta Description:All,Response Codes:Client Error (4xx),H1:All"
```

After client grants GSC access, connect SF to Search Console + Analytics in GUI for deeper reports.
