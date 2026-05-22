# SEO strategy — Wainwrights Baggers

Last updated: 2026-05-22

## Repositories

| Piece | Path |
| --- | --- |
| Monorepo root | `/Users/jorge/dev/code/wainwrightsbaggers` |
| Marketing + web app | `apps/web` (Next.js, React Router client routes under `app/[[...slug]]`) |
| Backend | `packages/backend` (Convex) |
| Mobile | `apps/mobile` (Expo, TestFlight) |
| Hill data | `packages/catalog` |

## Tooling

| Tool | Status |
| --- | --- |
| **Production URL** | `https://wainwrightsbaggers.com` |
| **GitHub** | `Andesphere/wainwright-tracker` |
| **Deploy** | Vercel team `andesphere` (Pro), git push to `main` → production; Next.js |
| **Search Console** | Domain property verified: `sc-domain:wainwrightsbaggers.com`; sitemap submitted successfully |
| **GSC API** | Not set up — optional `.seo/scripts/gsc-api.mjs` |
| **Analytics** | Vercel Web Analytics enabled; custom events: `cta_click`, `signup_click`, `blog_cta_click` |
| **Auth** | Clerk |
| **Email / forms** | No marketing contact form; Clerk sign-up only |
| **Calendar** | N/A |

## Product and market

- **Brand:** Wainwrights Baggers (Fells Journal in `companybrief.md`)
- **Market:** UK English, Lake District Wainwright baggers
- **ICP:** See `.agents/product-marketing.md`
- **Model:** Free app; conversion = account + tracker usage

## Conversion strategy

**Ladder (cold organic):**

1. **Researching** — blog guides (easy walks, beginners, app comparison)
2. **Ready to try** — `Open the journal` → Clerk sign-up → `/app`
3. **Returning** — sign in → `/app` (noindex but linked from nav)

**Current landing CTA:** `Open the journal` (sign-up modal or `/app` when signed in). Subcopy: “free, forever · no fitness scores.”

**Gaps (tracked as backlog tickets):**

- Search Console processing first baseline after verification (`SEO-001`)
- `/app` is `noindex` (correct); marketing pages must carry search intent

## Latest reports

- GSC: `.seo/reports/gsc-2026-05-22.md`
- Analytics: Vercel dashboard under `andesphere/wainwright-tracker`

## Operational notes

- Package manager: **Bun** (`bun run check --filter=@wainwrights/web`)
- Do not print `.env`, Clerk, or Convex secrets
- Production deploy: push to git; Vercel auto-deploys
- Master playbook: `/Users/jorge/SEO_GROWTH_WORKSPACE_PLAYBOOK.md`
- Mobile ASO: separate from web; skill at `.agents/skills/aso/`
- **Work queue:** [backlog.md](backlog.md) only
