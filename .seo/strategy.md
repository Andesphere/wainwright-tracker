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
| **Deploy** | Vercel (git push → production; Next.js) |
| **Search Console** | Not configured in repo — verify property in browser; suggest `sc-domain:wainwrightsbaggers.com` |
| **GSC API** | Not set up — optional `.seo/scripts/gsc-api.mjs` |
| **Analytics** | None in `apps/web` (no Vercel Analytics, GA4, GTM, Plausible) |
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

- No analytics on CTA clicks or sign-up funnel (`SEO-002`)
- Search Console not baselined (`SEO-001`)
- `/app` is `noindex` (correct); marketing pages must carry search intent

## Latest reports

- GSC: none yet — add `.seo/reports/gsc-YYYY-MM-DD.md` after `SEO-001`
- Analytics: none yet

## Operational notes

- Package manager: **Bun** (`bun run check --filter=@wainwrights/web`)
- Do not print `.env`, Clerk, or Convex secrets
- Production deploy: push to git; Vercel auto-deploys
- Master playbook: `/Users/jorge/SEO_GROWTH_WORKSPACE_PLAYBOOK.md`
- Mobile ASO: separate from web; skill at `.agents/skills/aso/`
- **Work queue:** [backlog.md](backlog.md) only
