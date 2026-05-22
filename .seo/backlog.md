# SEO backlog — Wainwrights Baggers

Last updated: 2026-05-22  
Current focus: none

## How to use

- Pick the top **Ready** row unless Current focus is set.
- One ticket in **In progress** at a time.
- On completion: move to **Done** with date + verify note; update [audit.md](audit.md) if findings changed.
- Do not add checkboxes to [strategy.md](strategy.md) or [audit.md](audit.md).

## Ready

| ID | P | Area | Ticket | Verify |
| --- | --- | --- | --- | --- |
| SEO-001 | P0 | gsc | Verify Search Console property, submit sitemap, baseline export (performance + indexing) | GSC sitemap success; summary in reports/ |
| SEO-002 | P0 | analytics | Add Vercel Analytics + events: `cta_click`, `signup_click`, `blog_cta_click` | Events visible on production dashboard |
| SEO-003 | P1 | ctr | After GSC baseline: rewrite titles/meta for high-impression low-CTR URLs | CTR improvement over 2–4 weeks |
| SEO-004 | P2 | cwv | Lighthouse mobile + desktop on production homepage + one blog post | LCP/CLS/INP recorded in audit.md |
| SEO-005 | P2 | schema | Rich Results Test on home + one article after changes | No critical schema errors |
| SEO-006 | P2 | cro | Review blog CTAs for signed-out users (sign-up vs `/app`) | Manual pass on 4 posts |
| SEO-007 | P2 | content | Dedicated homepage OG 1200×630 (`home-og.jpg`) if previews matter | og:image dimensions 1200×630 live |
| SEO-008 | P3 | internal-links | Strengthen contextual links blog → `/` and sign-up CTAs where natural | Spot-check 4 posts |
| SEO-009 | P3 | content | Expand content clusters only if GSC shows demand (per-area guides, etc.) | New URLs in sitemap + indexed |
| SEO-010 | P4 | backlink | First UK directory/editorial batch per backlinks/work-log.md | 5+ attempts logged |
| SEO-011 | P3 | content | Align companybrief.md / README with Next.js + Bun stack | Docs match apps/web |
| SEO-012 | P2 | gsc | Optional: `.seo/scripts/gsc-api.mjs` if OAuth available | CLI inspect + performance works |
| SEO-013 | P3 | content | iOS App Store public link in footer/schema when listing is live | Valid store URL on site |

## In progress

| ID | Started | Notes |
| --- | --- | --- |
| | | |

## Blocked

| ID | Blocker | Since |
| --- | --- | --- |
| | | |

## Done

| ID | Completed | Verify |
| --- | --- | --- |
| SEO-000 | 2026-05-22 | Playbook `.seo/` bootstrap; technical SEO baseline in code (metadata, sitemap, robots, JSON-LD, 4 blog posts, `/app` noindex) |
| SEO-000b | 2026-05-22 | Migrated flat root SEO files → `.seo/` layout per master playbook |
