# SEO audit — Wainwrights Baggers

Date: 2026-05-22  
Site audited: `https://wainwrightsbaggers.com`  
Primary market: United Kingdom (Lake District / Wainwright baggers)  
Last updated: 2026-05-22

## Executive summary

The marketing site has a **solid technical SEO foundation** in code: Next.js metadata API, canonical URLs, robots/sitemap, structured data, four indexable blog posts, and correct `noindex` on `/app`. Production responds with **HTTP 200**, and `robots.txt` / `sitemap.xml` are healthy (5 URLs: `/`, `/blog`, 4 posts).

**Gaps:** no Search Console or analytics in repo yet; no CWV baseline; backlinks not started; homepage OG is not standard 1200×630. Conversion is simple (free sign-up → journal) but untracked.

**Backlog:** see [backlog.md](backlog.md) — next tickets `SEO-001` (GSC), `SEO-002` (analytics).

## Sources checked

| Source | Result |
| --- | --- |
| `apps/web/lib/seo.tsx` | metadataBase, routes, JSON-LD |
| `apps/web/app/sitemap.ts` | 5 URLs |
| `apps/web/app/robots.ts` | allow/disallow |
| `apps/web/content/blog/posts.ts` | 4 posts |
| `apps/web/marketing-pages/LandingPage.tsx` | CTAs |
| Live `curl` homepage | 200, title/meta/JSON-LD match code |
| Live `robots.txt` / `sitemap.xml` | Valid |
| Search Console | Domain property verified; sitemap submitted successfully — `SEO-001` |
| Analytics | None in repo — `SEO-002` |

## Search Console findings

Property verified on 2026-05-22:

`https://search.google.com/search-console/index?resource_id=sc-domain%3Awainwrightsbaggers.com`

Sitemap submitted:

- `https://wainwrightsbaggers.com/sitemap.xml`
- Status: Success
- Last read: 22 May 2026
- Discovered pages: 6

Baseline report: [reports/gsc-2026-05-22.md](reports/gsc-2026-05-22.md).

Initial Performance and Page indexing reports were still processing immediately after verification. Re-check before `SEO-003`.

## Technical SEO

| Item | Status | Notes |
| --- | --- | --- |
| HTTPS | OK | HSTS on Vercel |
| Canonical | OK | Per-route in `buildMetadata` |
| Sitemap | OK | 5 URLs; blog lastmod from `publishedAt` |
| `/app` in sitemap | OK | Excluded |
| Trailing slash | Next default | Monitor in GSC |
| hreflang | N/A | UK English only |

Indexability follow-up: `SEO-001`.

## Metadata and content

**Home (live):**

- Title: `Wainwrights Baggers | Map, Checklist & Journal for the 214 Fells`
- Description: aligned with product

**Blog posts (indexable):**

| Slug | Intent |
| --- | --- |
| `easy-wainwright-walks-map` | Beginner / easy walks + map |
| `best-beginner-wainwrights` | Starter fell list |
| `best-wainwright-app` | Comparison / commercial |
| `introducing-the-tracker` | Product announcement |

CTR rewrites after GSC data: `SEO-003`. Homepage OG: `SEO-007`.

## Conversion review

- Single primary CTA on hero; appropriate for free tool
- Blog and “how it works” mitigate cold-traffic clarity risk
- Analytics and CTA review: `SEO-002`, `SEO-006`

## Analytics review

No marketing analytics tags. Instrumentation blocked on decisions until `SEO-002`.

## Schema review

Live homepage: Organization, WebSite, SoftwareApplication, BreadcrumbList. BlogPosting on articles. Free `Offer` matches free product. Validation ticket: `SEO-005`.

## Performance review

Not run in initial audit. Ticket: `SEO-004`.

## Backlink review

No live links logged. Roadmap: [backlinks/summary.md](backlinks/summary.md), execution: [backlinks/work-log.md](backlinks/work-log.md). Ticket: `SEO-010`.
