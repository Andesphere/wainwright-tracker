# AI answer panel and baseline for wainwrightsbaggers.com

Resolves [#44](https://github.com/Andesphere/wainwright-tracker/issues/44), part of map [#15](https://github.com/Andesphere/wainwright-tracker/issues/15). Target pages follow decision [#20](https://github.com/Andesphere/wainwright-tracker/issues/20).

## Summary

- Panel v1: 21 prompts, frozen 2026-09-26. Each maps to one page from #20.
- Baseline, observed 2026-09-26 04:00 UTC, one run per prompt on five surfaces (ChatGPT, Perplexity, Gemini, Google AI Overview, Google AI Mode): 103 answers (AI Overview did not trigger for P06 and P13). wainwrightsbaggers.com was cited in 0 of 103 answers and mentioned in 0 of 103. It was not in Google UK's first page of organic results for any of the 21 prompts.
- Who dominates (observed, same sample): Wikipedia is cited for 14 of 21 prompts. After it come facebook.com (12), walkingenglishman.com (9), google.com (9), thelakesplanner.co.uk (8), walkhighlands.co.uk (7), reddit.com (7), coppermines.co.uk (7) and wainwrights.info (7). On the four app prompts, answers cite App Store and Google Play listings of competing apps: Wainwright Memories (named in 11 of 20 app-prompt answers), Wainwright Companion (9), Trailwise (7), Fellbook (4).
- Why we are absent: only the home page and two guides are live today (`/fells`, fell pages and the other guides return 404 or are not built), the site is not yet indexed (#16), and the App Store listing does not exist until Apple approves the app (`APP_STORE_LIVE` is false). This baseline is the "before" picture.

## Method

- Tool: DataForSEO AI Optimization and SERP APIs, run 2026-09-26 between 03:59 and 04:02 UTC. Cost for the full run: about US$1.34 (observed, from API responses).
- Surfaces and settings:
  - ChatGPT: `ai_optimization/chat_gpt/llm_scraper/live/advanced`. This is the chatgpt.com consumer answer, logged out, location United Kingdom (2826), language en. Model is not exposed (`model: null`).
  - Perplexity: `ai_optimization/perplexity/llm_responses/live`, model `sonar`, web search on, country GB. This is the API, not the consumer app.
  - Gemini: `ai_optimization/gemini/llm_responses/live`, model `gemini-3.5-flash`, web search on. This is the API, not the Gemini app. Gemini's grounding links are redirects; the domain is taken from the source title.
  - Google AI Overview: `serp/google/organic/live/advanced`, United Kingdom, en, desktop, `load_async_ai_overview: true`. We read the `ai_overview` item and check organic results for our domain.
  - Google AI Mode: `serp/google/ai_mode/live/advanced`, United Kingdom, en.
- Definitions follow the `seo-growth-workspace` AI-search contract. **Cited** means a wainwrightsbaggers.com URL appears among the answer's sources. **Mentioned** means the answer text names "Wainwrights Baggers", wainwrightsbaggers.com or App Store id6771147426. Two raw regex hits were false positives and are excluded: Gemini P03 used "Wainwright baggers" as a generic noun, and AI Overview P03 cited Amazon's "The Wainwright Baggers Log Book". The second is a name collision worth watching.
- Limits: every number is one nondeterministic sample per prompt and surface, not a ranking. Recurrence is stated as x of y runs. The Perplexity and Gemini API answers can differ from their consumer apps. ChatGPT answered 7 prompts with no sources shown. No personalisation or account state was applied.

## Panel v1 (frozen 2026-09-26)

Demand evidence: the DataForSEO Labs keyword map in #20 (Google UK estimates, captured 2026-09-25) and the guide plan in #21. The ticket's three example prompts are included. Slugs marked "planned" are proposals; the guide ticket that ships each page fixes its slug, and the panel is not reworded when that happens.

| ID | Prompt (verbatim) | Page that should win (#20) | Page state 2026-09-26 (observed) | Intent |
| --- | --- | --- | --- | --- |
| P01 | What is the best app to track which Wainwrights I have climbed? | `/ (home)` | live | app |
| P02 | Is there an app to tick off the 214 Wainwrights? | `/ (home)` | live | app |
| P03 | wainwright bagging tracker | `/ (home)` | live | app |
| P04 | best hill bagging app UK | `/guides/best-wainwright-app` | live | app |
| P05 | list of all 214 Wainwrights with heights | `/fells` | not live (404 or not built) | list |
| P06 | map of the Wainwrights | `/fells` | not live (404 or not built) | list |
| P07 | how many Wainwrights are there | `/guides/what-is-a-wainwright` (planned) | not live (404 or not built) | info |
| P08 | what is a Wainwright | `/guides/what-is-a-wainwright` (planned) | not live (404 or not built) | info |
| P09 | printable Wainwright checklist | `/guides/wainwright-checklist` (planned) | not live (404 or not built) | checklist |
| P10 | what are the highest mountains in the Lake District | `/guides/highest-mountains-lake-district` (planned) | not live (404 or not built) | info |
| P11 | what are the easiest Wainwrights for beginners | `/guides/easiest-wainwrights` | live | info |
| P12 | what are Wainwright's seven Pictorial Guides to the Lakeland Fells | `/guides/wainwright-books` (planned) | not live (404 or not built) | info |
| P13 | which fells are in Wainwright's The Eastern Fells book | `/fells/books/the-eastern-fells` | not live (404 or not built) | list |
| P14 | is Orrest Head a Wainwright | `/guides/is-it-a-wainwright` (planned) | not live (404 or not built) | info |
| P15 | what is the difference between Wainwrights, Birketts, Hewitts and Nuttalls | `/guides/hill-lists-explained` (planned) | not live (404 or not built) | info |
| P16 | how to bag all the Wainwrights | `/guides/how-to-bag-the-wainwrights` (planned) | not live (404 or not built) | info |
| P17 | Wainwrights near Keswick | `/guides/wainwrights-near-keswick` (planned) | not live (404 or not built) | local |
| P18 | who was Alfred Wainwright | `/guides/alfred-wainwright` (planned) | not live (404 or not built) | info |
| P19 | how high is Helvellyn | `/fells/helvellyn` | not live (404 or not built) | fell |
| P20 | Catbells walk from Keswick | `/fells/catbells` | not live (404 or not built) | fell |
| P21 | which Wainwright book is Scafell Pike in | `/fells/scafell-pike` | not live (404 or not built) | fell |

Deliberately left out: branded prompts ("wainwrights baggers app") until the app is live, fell prompts beyond three samples (the 214 fell pages are measured through Search Console, not this panel), and non-UK markets. Changing a prompt's wording, or adding or removing one, creates panel v2. Old rows stay as they are, and the report says which comparisons stop being like-for-like.

## Baseline 2026-09-26 (observed)

Top three cited domains per answer, in the order the answer lists them. "none shown" means an answer with no sources. "no AIO" means Google showed no AI Overview.

| ID | ChatGPT | Perplexity | Gemini | AI Overview | AI Mode | Us cited / mentioned |
| --- | --- | --- | --- | --- | --- | --- |
| P01 | apps.apple.com, play.google.com, lakesandtrailspro.com | apps.apple.com, play.google.com, trailtrack.co.uk | thewestmorlandgazette.co.uk, apple.com, wainwrightmemories.com | apps.apple.com, play.google.com, wainwrightcompanion.co.uk | apps.apple.com, play.google.com, thegeordiehiker.com | 0/5, 0/5 |
| P02 | apps.apple.com, fellsapp.com, play.google.com | apps.apple.com, play.google.com, wainwrightmemories.com | google.com, apple.com, wainwrightmemories.com | apps.apple.com, wainwrightmemories.com, wainwrightcompanion.co.uk | play.google.com, wainwrightcompanion.co.uk, apps.apple.com | 0/5, 0/5 |
| P03 | openfell.co.uk, bagged.openair.tools, thelakedistrictguide.com | thelakedistrict.com, play.google.com, wainwrightmemories.com | apple.com, wainwrightcompanion.co.uk, google.com | thelakedistrict.com, apps.apple.com, hill-bagging.co.uk | wainwrightcompanion.co.uk, wainwrightmemories.com, play.google.com | 0/5, 0/5 |
| P04 | apps.apple.com, play.google.com, thegreatoutdoorsmag.com | play.google.com, summitapp.uk, reddit.com | reddit.com, apple.com, summitapp.uk | hill-bagging.co.uk, play.google.com, apps.apple.com | munros.app, hill-bagging.co.uk, play.google.com | 0/5, 0/5 |
| P05 | scenicviews4u.com, wikipedia.org | wikipedia.org, walklakes.co.uk, trailpath360.com | wikipedia.org, baggedit.net, walkingenglishman.com | wikipedia.org, walkhighlands.co.uk, wainroutes.co.uk | walkhighlands.co.uk, thelakesplanner.co.uk | 0/5, 0/5 |
| P06 | paulbeal.com, hikes.guide, wainwrights.info | paulbeal.com, hikes.guide, apps.apple.com | wainroutes.co.uk, outandaboutadventures.com, paulbeal.com | no AIO | walklakes.co.uk, paulbeal.com, walkingenglishman.com | 0/5, 0/5 |
| P07 | none shown | wikipedia.org, advnture.com, thelakesplanner.co.uk | facebook.com, muchbetteradventures.com, englishlakes.co.uk | wikipedia.org, outandaboutadventures.com, walklakes.co.uk | outandaboutadventures.com, englishlakes.co.uk, wikipedia.org | 0/5, 0/5 |
| P08 | none shown | wikipedia.org, merriam-webster.com, freedict.com | wikipedia.org, thebmc.co.uk, heatoncooper.co.uk | wainwright.org.uk, wikipedia.org, muchbetteradventures.com | thebmc.co.uk, wikipedia.org, wainwright.org.uk | 0/5, 0/5 |
| P09 | ldwa.org.uk, wainwrights.info | theplanetedit.com, etsy.com, twofourteen.co.uk | thelakedistrictguide.com, twofourteen.co.uk, montane.com | thelakedistrictguide.com, fittux.com, oldfielddesignco.co.uk | fittux.com, thelakedistrictguide.com, thecrostons.plus.com | 0/5, 0/5 |
| P10 | lakedistrict.gov.uk, visitlakedistrict.com, wikipedia.org | visitlakedistrict.com, lakedistrict.gov.uk, wikipedia.org | maps.com, lakedistricts.co.uk, sallyscottages.co.uk | thelakesplanner.co.uk, englishlakes.co.uk, facebook.com | komoot.com, englishlakes.co.uk, lakedistricts.co.uk | 0/5, 0/5 |
| P11 | none shown | sallyscottages.co.uk, uklakedistrict.com, outandaboutadventures.com | thebmc.co.uk, fittux.com, whitehavennews.co.uk | thebmc.co.uk, fittux.com, sallyscottages.co.uk | sallyscottages.co.uk, theplanetedit.com, youtube.com | 0/5, 0/5 |
| P12 | wainwright.org.uk, alfredwainwright.co.uk, lakelandroutes.uk | wikipedia.org, walks4all.com, goodreads.com | wikipedia.org, lakelandroutes.uk, chriswaldron.co.uk | wikipedia.org, google.com, stridingedge.com | google.com, amazon.co.uk | 0/5, 0/5 |
| P13 | wainwrights.info, 214wainwrights.wordpress.com, wikipedia.org | jimearl6.com, paulbeal.com, guideus.co.uk | wikipedia.org, chriswaldron.co.uk, guideus.co.uk | no AIO | guideus.co.uk, johnatkinsonbooks.co.uk, wainwrightroutes.co.uk | 0/5, 0/5 |
| P14 | openfell.co.uk, walklakes.co.uk, wikipedia.org | langdaleactive.co.uk, wikipedia.org, windermere-tc.gov.uk | wikipedia.org, stridingedge.net, langdaleactive.co.uk | wikipedia.org, adventurernic.com, langdaleactive.co.uk | facebook.com, wikipedia.org, walklakes.co.uk | 0/5, 0/5 |
| P15 | none shown | kids.kiddle.co, osmaps.com, trailtrack.co.uk | wikipedia.org, osmaps.com, walklakes.co.uk | instagram.com, trailtrack.co.uk, munros.app | wikipedia.org, jbutler.org.uk, osmaps.com | 0/5, 0/5 |
| P16 | none shown | muchbetteradventures.com, theplanetedit.com, services.thebmc.co.uk | muchbetteradventures.com, walkingenglishman.com, coppermines.co.uk | jackramsden.co.uk, thelakesguide.co.uk, walkhighlands.co.uk | wikipedia.org, outandaboutadventures.com, google.com | 0/5, 0/5 |
| P17 | keswick.org, westernlakedistrict.com, reddit.com | peakybaggers.com, thelakesplanner.co.uk, sallyscottages.co.uk | walkingenglishman.com, paulbeal.com, thelakesguide.co.uk | keswick.org, walkingenglishman.com, reddit.com | keswick-launch.co.uk, google.com | 0/5, 0/5 |
| P18 | images.openai.com | wikipedia.org, visitcumbria.com, bbc.com | wikipedia.org, ianploftus.com, countryfile.com | wikipedia.org, wainwright.org.uk, alfredwainwright.co.uk | wikipedia.org, countryfile.com, wainwright.org.uk | 0/5, 0/5 |
| P19 | none shown | wikipedia.org, regatta.com, haroldstreet.org.uk | mapy.com, snowandrock.com, wikipedia.org | wikipedia.org, mountain-walks.co.uk, ramblers.org.uk | wikipedia.org, snowandrock.com, richardgower.com | 0/5, 0/5 |
| P20 | lakedistrict.gov.uk, allerdale.gov.uk | keswick.org, thelakesplanner.co.uk, lakedistrict.getanchor.io | coppermines.co.uk, keswickparkhotel.co.uk, thelakesplanner.co.uk | keswick-launch.co.uk, mountain-walks.co.uk, coppermines.co.uk | keswick.org, mountain-walks.co.uk, keswick-launch.co.uk | 0/5, 0/5 |
| P21 | none shown | scafellpike.org.uk, quarto.com, walkingenglishman.com | guideus.co.uk, quarto.com, alfredwainwright.co.uk | wainwrights.info, amazon.co.uk, bookscumbria.com | books.google.com | 0/5, 0/5 |

### Most-cited domains (observed, 103 answers)

| Domain | Prompts citing it (of 21) | Answers citing it (of 103) |
| --- | --- | --- |
| wikipedia.org | 14 | 44 |
| facebook.com | 12 | 14 |
| google.com | 9 | 13 |
| walkingenglishman.com | 9 | 11 |
| thelakesplanner.co.uk | 8 | 13 |
| reddit.com | 7 | 17 |
| walkhighlands.co.uk | 7 | 8 |
| coppermines.co.uk | 7 | 14 |
| wainwrights.info | 7 | 7 |
| instagram.com | 6 | 6 |
| walklakes.co.uk | 6 | 12 |
| paulbeal.com | 6 | 10 |
| lakedistrict.gov.uk | 6 | 8 |
| apps.apple.com | 5 | 15 |
| peakybaggers.com | 5 | 5 |

### Gaps and routes

Each gap has one opportunity class and one action route, following the `seo-growth-workspace` AI-search contract.

| Gap | Evidence | Class | Route |
| --- | --- | --- | --- |
| App prompts (P01 to P04) cite App Store and Play listings of other apps, and roundups (thegreatoutdoorsmag.com, mwm.ai, grahamhaley.co.uk, thegeordiehiker.com) | 20 of 20 app-prompt answers cite at least one competing app, its store listing or a roundup | legitimate editorial/earned-media opportunity | backlink work-log: roundups to approach once the app is live |
| Our App Store listing does not exist yet | `APP_STORE_LIVE = false`, App Review pending | insufficient evidence | no action: re-run after approval |
| Info prompts (P05 to P18) go to Wikipedia and long-standing hobby sites (walkingenglishman.com, thelakesplanner.co.uk, coppermines.co.uk, walklakes.co.uk, thebmc.co.uk) | 0 of our target pages indexed (#16); most target pages not built | owned-content deficiency | content: already planned in #29 to #34; re-check after indexing |
| Name collision with Amazon's "The Wainwright Baggers Log Book" | cited in the AI Overview for P03 | insufficient evidence | no action: watch for entity confusion in monthly runs |

## Monthly check

1. When: first week of each month, starting 2026-10. Also once within two weeks of each of these: Search Console shows the guides and `/fells` indexed, and the App Store listing goes live.
2. How: run panel v1 unchanged on the same five surfaces with the same settings (above) through DataForSEO. Credentials come from the Matias credential store, piped and never printed. Save raw JSON per prompt and surface. Expected cost is about US$1.50 per run (estimate, based on today's $1.34).
3. Record one row per answer run: prompt ID and version, surface, visible model, timestamp, cited domains in order, our citation (URL), our mention (quoted wording), and whether we appear in organic page one on the Google surfaces.
4. Compare like-for-like with the previous run. Report "cited in x of 103 answers" and "mentioned in x of 103" per surface. Separately, list any change in the top-cited domains. Do not claim that one of our changes caused a movement; note what else changed that month (indexing, launches).
5. Optional manual spot check: run P01, P07 and P11 by hand in a logged-out UK browser in ChatGPT and Gemini to catch drift between API and app.

## Where results go in the Matias SEO hub (proposal, not written)

In JorgeMenaDev/matias, `.seo/sites/wainwrightsbaggers/`:

- `reports/ai-visibility-YYYY-MM-DD.md`: one per monthly run. It holds the panel version, the observation rows, the comparison with the previous run and the gaps. The first file would be `reports/ai-visibility-2026-09-26.md`, copied from this document.
- `reports/data/ai-visibility-YYYY-MM-DD/`: raw JSON per prompt and surface.
- `strategy.md`: the frozen panel (prompt IDs, wording, version, target page) and the crawler allow decision (robots allows all AI crawlers today, #14 in the audit).
- `bets.md` and `backlinks/work-log.md`: any gap routed there.

## Appendix: every observed run (2026-09-26)

All cited domains in the order the answer lists them. Cited = us cited; Ment = us mentioned.

| Run | Surface | Cited domains | Cited | Ment |
| --- | --- | --- | --- | --- |
| AI-2026-09-26-P01-R01 | ChatGPT | apps.apple.com, play.google.com, lakesandtrailspro.com | no | no |
| AI-2026-09-26-P01-R01 | Perplexity | apps.apple.com, play.google.com, trailtrack.co.uk, mwm.ai, northing.app, thegreatoutdoorsmag.com, grahamhaley.co.uk, appbrain.com, reddit.com | no | no |
| AI-2026-09-26-P01-R01 | Gemini | thewestmorlandgazette.co.uk, apple.com, wainwrightmemories.com, wainwrightcompanion.co.uk, google.com, summitapp.uk | no | no |
| AI-2026-09-26-P01-R01 | AI Overview | apps.apple.com, play.google.com, wainwrightcompanion.co.uk, fellsapp.com, lakedistricthotels.net | no | no |
| AI-2026-09-26-P01-R01 | AI Mode | apps.apple.com, play.google.com, thegeordiehiker.com, reddit.com | no | no |
| AI-2026-09-26-P02-R01 | ChatGPT | apps.apple.com, fellsapp.com, play.google.com, trailwise.io, ourfells.com | no | no |
| AI-2026-09-26-P02-R01 | Perplexity | apps.apple.com, play.google.com, wainwrightmemories.com, mwm.ai, grahamhaley.co.uk, northing.app, wainwrightcompanion.co.uk, producthunt.com, reddit.com, walkhighlands.co.uk, fellsapp.com | no | no |
| AI-2026-09-26-P02-R01 | Gemini | google.com, apple.com, wainwrightmemories.com, reddit.com, wainwrightcompanion.co.uk, summitapp.uk | no | no |
| AI-2026-09-26-P02-R01 | AI Overview | apps.apple.com, wainwrightmemories.com, wainwrightcompanion.co.uk, facebook.com, play.google.com, instagram.com | no | no |
| AI-2026-09-26-P02-R01 | AI Mode | play.google.com, wainwrightcompanion.co.uk, apps.apple.com, wainwrightmemories.com | no | no |
| AI-2026-09-26-P03-R01 | ChatGPT | openfell.co.uk, bagged.openair.tools, thelakedistrictguide.com, running.org, trailwise.io | no | no |
| AI-2026-09-26-P03-R01 | Perplexity | thelakedistrict.com, play.google.com, wainwrightmemories.com, apps.apple.com, mwm.ai, peakybaggers.com, wainwrightbagging.co.uk, hillbagger.com, etsy.com, reddit.com, coppermines.co.uk, walkingenglishman.com | no | no |
| AI-2026-09-26-P03-R01 | Gemini | apple.com, wainwrightcompanion.co.uk, google.com, nwemail.co.uk, ourfells.com, wainwrightmemories.com, reddit.com, summitapp.uk, rhsoc.uk, haroldstreet.org.uk | no | no |
| AI-2026-09-26-P03-R01 | AI Overview | thelakedistrict.com, apps.apple.com, hill-bagging.co.uk, play.google.com, facebook.com, reddit.com, etsy.com, amazon.co.uk | no | no |
| AI-2026-09-26-P03-R01 | AI Mode | wainwrightcompanion.co.uk, wainwrightmemories.com, play.google.com, etsy.com, google.com | no | no |
| AI-2026-09-26-P04-R01 | ChatGPT | apps.apple.com, play.google.com, thegreatoutdoorsmag.com, trailwise.io | no | no |
| AI-2026-09-26-P04-R01 | Perplexity | play.google.com, summitapp.uk, reddit.com, mwm.ai, apps.apple.com, apps.jonathanrewcastle.co.uk, go4awalk.com, hill-bagging.co.uk, contours.co.uk, rhsoc.uk | no | no |
| AI-2026-09-26-P04-R01 | Gemini | reddit.com, apple.com, summitapp.uk, google.com, facebook.com, grahamhaley.co.uk | no | no |
| AI-2026-09-26-P04-R01 | AI Overview | hill-bagging.co.uk, play.google.com, apps.apple.com, summitapp.uk | no | no |
| AI-2026-09-26-P04-R01 | AI Mode | munros.app, hill-bagging.co.uk, play.google.com, apps.apple.com | no | no |
| AI-2026-09-26-P05-R01 | ChatGPT | scenicviews4u.com, wikipedia.org | no | no |
| AI-2026-09-26-P05-R01 | Perplexity | wikipedia.org, walklakes.co.uk, trailpath360.com, haroldstreet.org.uk, hillbagger.com, thelakesplanner.co.uk, walkupscafellpike.co.uk, 214wainwrights.wordpress.com, cumbriasoaringclub.co.uk, chriswaldron.co.uk, emmashappylittleworld.co.uk, peakybaggers.com, thelakedistrictguide.com, paulbeal.com, shop.thebmc.co.uk | no | no |
| AI-2026-09-26-P05-R01 | Gemini | wikipedia.org, baggedit.net, walkingenglishman.com, thelakesplanner.co.uk, lifehop.co.uk, wainwrightwalking.co.uk, paulbeal.com, plus.com, thelakedistrictguide.com, wainwrightroutes.co.uk | no | no |
| AI-2026-09-26-P05-R01 | AI Overview | wikipedia.org, walkhighlands.co.uk, wainroutes.co.uk, lifehop.co.uk, attheedgemountaineering.co.uk, wainwrightwalking.co.uk, outandaboutadventures.com | no | no |
| AI-2026-09-26-P05-R01 | AI Mode | walkhighlands.co.uk, thelakesplanner.co.uk | no | no |
| AI-2026-09-26-P06-R01 | ChatGPT | paulbeal.com, hikes.guide, wainwrights.info | no | no |
| AI-2026-09-26-P06-R01 | Perplexity | paulbeal.com, hikes.guide, apps.apple.com, chriswaldron.co.uk, maps.walkingclub.org.uk, walkingenglishman.com, cumbriasoaringclub.co.uk, wikipedia.org, walks4all.com, walkhighlands.co.uk | no | no |
| AI-2026-09-26-P06-R01 | Gemini | wainroutes.co.uk, outandaboutadventures.com, paulbeal.com, hilltracker.co.uk, osmaps.com, google.com | no | no |
| AI-2026-09-26-P06-R01 | AI Overview | no AI Overview shown | no | no |
| AI-2026-09-26-P06-R01 | AI Mode | walklakes.co.uk, paulbeal.com, walkingenglishman.com, facebook.com, amazon.co.uk, google.com | no | no |
| AI-2026-09-26-P07-R01 | ChatGPT | none shown | no | no |
| AI-2026-09-26-P07-R01 | Perplexity | wikipedia.org, advnture.com, thelakesplanner.co.uk, muchbetteradventures.com, oldhallcaravanpark.co.uk, thebmc.co.uk, lakedistrict.gov.uk, inov8.com, walks4all.com, englishlakes.co.uk, paulbeal.com, wikitree.com | no | no |
| AI-2026-09-26-P07-R01 | Gemini | facebook.com, muchbetteradventures.com, englishlakes.co.uk, thelakesplanner.co.uk, wikipedia.org, coppermines.co.uk, inov8.com | no | no |
| AI-2026-09-26-P07-R01 | AI Overview | wikipedia.org, outandaboutadventures.com, walklakes.co.uk, englishlakes.co.uk, coppermines.co.uk | no | no |
| AI-2026-09-26-P07-R01 | AI Mode | outandaboutadventures.com, englishlakes.co.uk, wikipedia.org, coppermines.co.uk | no | no |
| AI-2026-09-26-P08-R01 | ChatGPT | none shown | no | no |
| AI-2026-09-26-P08-R01 | Perplexity | wikipedia.org, merriam-webster.com, freedict.com, dictionary.com, thebmc.co.uk, vocabulary.com, en.wiktionary.org, wordwebonline.com, familysearch.org, etymonline.com, lakedistrict.gov.uk, houseofnames.com, wisdomlib.org, ei-navi.jp, muchbetteradventures.com | no | no |
| AI-2026-09-26-P08-R01 | Gemini | wikipedia.org, thebmc.co.uk, heatoncooper.co.uk, dictionary.com | no | no |
| AI-2026-09-26-P08-R01 | AI Overview | wainwright.org.uk, wikipedia.org, muchbetteradventures.com, thelakesplanner.co.uk, thebmc.co.uk, coppermines.co.uk, montane.com, inov8.com | no | no |
| AI-2026-09-26-P08-R01 | AI Mode | thebmc.co.uk, wikipedia.org, wainwright.org.uk, muchbetteradventures.com, inov8.com, coppermines.co.uk | no | no |
| AI-2026-09-26-P09-R01 | ChatGPT | ldwa.org.uk, wainwrights.info | no | no |
| AI-2026-09-26-P09-R01 | Perplexity | theplanetedit.com, etsy.com, twofourteen.co.uk, thelakedistrictguide.com, oldfielddesignco.co.uk, gingerbugs.co.uk, casgliad.com, trailstrider.com, wainwright.ca, thebmc.co.uk, cheqmark.io, 101planners.com, checklist.com, onplanners.com, canva.com | no | no |
| AI-2026-09-26-P09-R01 | Gemini | thelakedistrictguide.com, twofourteen.co.uk, montane.com, plus.com | no | no |
| AI-2026-09-26-P09-R01 | AI Overview | thelakedistrictguide.com, fittux.com, oldfielddesignco.co.uk, etsy.com | no | no |
| AI-2026-09-26-P09-R01 | AI Mode | fittux.com, thelakedistrictguide.com, thecrostons.plus.com, etsy.com, google.com | no | no |
| AI-2026-09-26-P10-R01 | ChatGPT | lakedistrict.gov.uk, visitlakedistrict.com, wikipedia.org | no | no |
| AI-2026-09-26-P10-R01 | Perplexity | visitlakedistrict.com, lakedistrict.gov.uk, wikipedia.org, peakvisor.com, pitchup.com, lakedistricts.co.uk, sykescottages.co.uk, englishlakes.co.uk, national-parks.org, bigwalks.com, crerarhotels.com, walkingenglishman.com, travelandleisure.com, muchbetteradventures.com, campingandcaravanningclub.co.uk, nationaltrust.org.uk | no | no |
| AI-2026-09-26-P10-R01 | Gemini | maps.com, lakedistricts.co.uk, sallyscottages.co.uk, wikipedia.org, boys-brigade.org.uk, trailman.co.uk, nationaltrust.org.uk, lakelandhideaways.co.uk, go4awalk.com, peakbagger.com, englishlakes.co.uk, cumbria-cottages.com, lonewalker.net | no | no |
| AI-2026-09-26-P10-R01 | AI Overview | thelakesplanner.co.uk, englishlakes.co.uk, facebook.com, lakedistricts.co.uk, theoutdoorascent.com, komoot.com, lakelandhideaways.co.uk | no | no |
| AI-2026-09-26-P10-R01 | AI Mode | komoot.com, englishlakes.co.uk, lakedistricts.co.uk | no | no |
| AI-2026-09-26-P11-R01 | ChatGPT | none shown | no | no |
| AI-2026-09-26-P11-R01 | Perplexity | sallyscottages.co.uk, uklakedistrict.com, outandaboutadventures.com, thelakesplanner.co.uk, thebmc.co.uk, theplanetedit.com, peakybaggers.com, mudandroutes.com, thelakesguide.co.uk, timcrapnell.com, regatta.com, oldhallcaravanpark.co.uk, reddit.com, walkingenglishman.com, coppermines.co.uk, muddybootsmummy.co.uk, where2walk.co.uk | no | no |
| AI-2026-09-26-P11-R01 | Gemini | thebmc.co.uk, fittux.com, whitehavennews.co.uk, thewestmorlandgazette.co.uk, sallyscottages.co.uk, outandaboutadventures.com, thehikinghousehold.com, muddybootsmummy.co.uk, thelakesplanner.co.uk, coppermines.co.uk, reddit.com | no | no |
| AI-2026-09-26-P11-R01 | AI Overview | thebmc.co.uk, fittux.com, sallyscottages.co.uk, outandaboutadventures.com, facebook.com, regatta.com, thehikinghousehold.com, instagram.com, wikipedia.org, keswick.org, daleheadhall.co.uk | no | no |
| AI-2026-09-26-P11-R01 | AI Mode | sallyscottages.co.uk, theplanetedit.com, youtube.com, muddybootsmummy.co.uk, thebmc.co.uk, reddit.com | no | no |
| AI-2026-09-26-P12-R01 | ChatGPT | wainwright.org.uk, alfredwainwright.co.uk, lakelandroutes.uk, wikipedia.blackbriarcomputing.com, wikipedia.org | no | no |
| AI-2026-09-26-P12-R01 | Perplexity | wikipedia.org, walks4all.com, goodreads.com, books.google.com, stridingedge.com, bbc.co.uk, old.fylderamblers.org.uk, nhbs.com, countryfile.com, abebooks.com, abebooks.co.uk | no | no |
| AI-2026-09-26-P12-R01 | Gemini | wikipedia.org, lakelandroutes.uk, chriswaldron.co.uk, americanbookworm.com, books2door.com | no | no |
| AI-2026-09-26-P12-R01 | AI Overview | wikipedia.org, google.com, stridingedge.com, bookscumbria.com, abebooks.co.uk, amazon.co.uk, alfredwainwright.co.uk, research.lancaster-university.uk | no | no |
| AI-2026-09-26-P12-R01 | AI Mode | google.com, amazon.co.uk | no | no |
| AI-2026-09-26-P13-R01 | ChatGPT | wainwrights.info, 214wainwrights.wordpress.com, wikipedia.org | no | no |
| AI-2026-09-26-P13-R01 | Perplexity | jimearl6.com, paulbeal.com, guideus.co.uk, wikipedia.org, where2walk.co.uk, thelakedistrictguide.com, walkhighlands.co.uk, old.fylderamblers.org.uk, walks4all.com, walkingenglishman.com, alfredwainwright.co.uk, advnture.com, bookscumbria.com | no | no |
| AI-2026-09-26-P13-R01 | Gemini | wikipedia.org, chriswaldron.co.uk, guideus.co.uk, wainwrightroutes.co.uk, thewanderingwildflower.co.uk, wainwrightwalking.co.uk, apexatlas.co.uk | no | no |
| AI-2026-09-26-P13-R01 | AI Overview | no AI Overview shown | no | no |
| AI-2026-09-26-P13-R01 | AI Mode | guideus.co.uk, johnatkinsonbooks.co.uk, wainwrightroutes.co.uk, fellwalks.uk | no | no |
| AI-2026-09-26-P14-R01 | ChatGPT | openfell.co.uk, walklakes.co.uk, wikipedia.org, wainwright.org.uk | no | no |
| AI-2026-09-26-P14-R01 | Perplexity | langdaleactive.co.uk, wikipedia.org, windermere-tc.gov.uk, mudandroutes.com, wainwright.org.uk, cedarmanor.co.uk, experimentsinfiction.com, baldhiker.com, roamwithross.com, aluxurytravelblog.com, airial.travel, andrewswalks.co.uk, countryfile.com, 214wainwrights.wordpress.com, tripadvisor.co.uk, adventurernic.com, komoot.com, lakedistrict.gov.uk | no | no |
| AI-2026-09-26-P14-R01 | Gemini | wikipedia.org, stridingedge.net, langdaleactive.co.uk, walklakes.co.uk, facebook.com, andrewswalks.co.uk, adventurernic.com, lakeswalks.co.uk | no | no |
| AI-2026-09-26-P14-R01 | AI Overview | wikipedia.org, adventurernic.com, langdaleactive.co.uk, baldhiker.com, instagram.com, walklakes.co.uk, andrewswalks.co.uk | no | no |
| AI-2026-09-26-P14-R01 | AI Mode | facebook.com, wikipedia.org, walklakes.co.uk, adventurernic.com | no | no |
| AI-2026-09-26-P15-R01 | ChatGPT | none shown | no | no |
| AI-2026-09-26-P15-R01 | Perplexity | kids.kiddle.co, osmaps.com, trailtrack.co.uk, lonewalker.net, fellbelle.com, wainwrights.uk.com, wainwrights.info, twofeetfourpaws.blog, hill-bagging.co.uk, mypennines.co.uk, wikipedia.org | no | no |
| AI-2026-09-26-P15-R01 | Gemini | wikipedia.org, osmaps.com, walklakes.co.uk, where2walk.co.uk, trailtrack.co.uk, masarnenramblers.com, fellwalk.co.uk, andhiking.co.uk, twofeetfourpaws.blog | no | no |
| AI-2026-09-26-P15-R01 | AI Overview | instagram.com, trailtrack.co.uk, munros.app, advnture.com, walklakes.co.uk, ukhillwalking.com, wainwrightroutes.co.uk, wikipedia.org, andhiking.co.uk, fellwalk.co.uk, hill-bagging.co.uk | no | no |
| AI-2026-09-26-P15-R01 | AI Mode | wikipedia.org, jbutler.org.uk, osmaps.com | no | no |
| AI-2026-09-26-P16-R01 | ChatGPT | none shown | no | no |
| AI-2026-09-26-P16-R01 | Perplexity | muchbetteradventures.com, theplanetedit.com, services.thebmc.co.uk, londonmountainfestival.com, yahoo.com, thelakesplanner.co.uk, ldwa.org.uk, wikipedia.org, wainwrightbagging.co.uk, cumbriatourism.org, komoot.com, coppermines.co.uk, thebmc.co.uk, hfholidays.co.uk | no | no |
| AI-2026-09-26-P16-R01 | Gemini | muchbetteradventures.com, walkingenglishman.com, coppermines.co.uk, montane.com, facebook.com, thelakedistrictguide.com, paulbeal.com, thebmc.co.uk, theplanetedit.com, outandaboutadventures.com, wainwrights.info, adventurebooks.com | no | no |
| AI-2026-09-26-P16-R01 | AI Overview | jackramsden.co.uk, thelakesguide.co.uk, walkhighlands.co.uk, facebook.com, instagram.com, peakybaggers.com, braefell.wordpress.com | no | no |
| AI-2026-09-26-P16-R01 | AI Mode | wikipedia.org, outandaboutadventures.com, google.com | no | no |
| AI-2026-09-26-P17-R01 | ChatGPT | keswick.org, westernlakedistrict.com, reddit.com, wainwrights.info, coledale-inn.co.uk, skiddawcroft.co.uk, gooutdoors.co.uk, cotswoldoutdoor.com, needlesports.com, nordicoutdoor.co.uk, rathbonesofkeswick.co.uk, ellis-brigham.com, alpkit.com, rohan.co.uk, paramo-clothing.com, tiso.com | no | no |
| AI-2026-09-26-P17-R01 | Perplexity | peakybaggers.com, thelakesplanner.co.uk, sallyscottages.co.uk, keswick.org, tripadvisor.co.uk, ramblingman.org.uk, reddit.com, blacks.co.uk, daleheadhall.co.uk, greentraveller.co.uk, muddybootsmummy.co.uk, thelakedistrict.org, yell.com | no | no |
| AI-2026-09-26-P17-R01 | Gemini | walkingenglishman.com, paulbeal.com, thelakesguide.co.uk, komoot.com, keswickparkhotel.co.uk, youtube.com, thetallhousekeswick.co.uk, sallyscottages.co.uk, fabulousnorth.com, hikingphotographer.uk, getanchor.io, mountain-walks.co.uk, reddit.com, blacks.co.uk, facebook.com, nationaltrust.org.uk, where2walk.co.uk, andrewswalks.co.uk | no | no |
| AI-2026-09-26-P17-R01 | AI Overview | keswick.org, walkingenglishman.com, reddit.com, daleheadhall.co.uk, youtube.com, sallyscottages.co.uk, google.com, instagram.com, tiktok.com, ramblingman.org.uk | no | no |
| AI-2026-09-26-P17-R01 | AI Mode | keswick-launch.co.uk, google.com | no | no |
| AI-2026-09-26-P18-R01 | ChatGPT | images.openai.com | no | no |
| AI-2026-09-26-P18-R01 | Perplexity | wikipedia.org, visitcumbria.com, bbc.com, lakedistrict.gov.uk, pressandjournal.co.uk, imdb.com, walkhighlands.co.uk, bbc.co.uk | no | no |
| AI-2026-09-26-P18-R01 | Gemini | wikipedia.org, ianploftus.com, countryfile.com, wainwright.org.uk, coppermines.co.uk, alfredwainwright.co.uk, wordpress.com, cumbriaarchives.org.uk, audible.co.uk, visit-windermere.com | no | no |
| AI-2026-09-26-P18-R01 | AI Overview | wikipedia.org, wainwright.org.uk, alfredwainwright.co.uk, thelakedistrict.org, bbc.co.uk, visit-windermere.com, facebook.com, countryfile.com, coppermines.co.uk | no | no |
| AI-2026-09-26-P18-R01 | AI Mode | wikipedia.org, countryfile.com, wainwright.org.uk, cumbriaarchives.org.uk | no | no |
| AI-2026-09-26-P19-R01 | ChatGPT | none shown | no | no |
| AI-2026-09-26-P19-R01 | Perplexity | wikipedia.org, regatta.com, haroldstreet.org.uk, base-mag.com, wikishire.co.uk, livefortheoutdoors.com, lakedistricts.co.uk, ramblingman.org.uk, visitcumbria.com, snowandrock.com, ramblers.org.uk, tripadvisor.com, walkhighlands.co.uk, britainexpress.com, peakbagger.com | no | no |
| AI-2026-09-26-P19-R01 | Gemini | mapy.com, snowandrock.com, wikipedia.org | no | no |
| AI-2026-09-26-P19-R01 | AI Overview | wikipedia.org, mountain-walks.co.uk, ramblers.org.uk, facebook.com, snowandrock.com | no | no |
| AI-2026-09-26-P19-R01 | AI Mode | wikipedia.org, snowandrock.com, richardgower.com | no | no |
| AI-2026-09-26-P20-R01 | ChatGPT | lakedistrict.gov.uk, allerdale.gov.uk | no | no |
| AI-2026-09-26-P20-R01 | Perplexity | keswick.org, thelakesplanner.co.uk, lakedistrict.getanchor.io, tripadvisor.com, castlerigg.co.uk, theplanetedit.com, walkmyworld.com, thinkadventure.co.uk, endlessdistances.com, hikingphotographer.uk, tripadvisor.de, anadventurousworld.com, gps-routes.co.uk, thetranquilotter.co.uk | no | no |
| AI-2026-09-26-P20-R01 | Gemini | coppermines.co.uk, keswickparkhotel.co.uk, thelakesplanner.co.uk, manvsglobe.com, reddit.com, gps-routes.co.uk, royaloakhotel.co.uk, lakedistrictlodgeholidays.co.uk, kestrellodge.co.uk, walklakes.co.uk, hikingphotographer.uk, andrewswalks.co.uk, getanchor.io | no | no |
| AI-2026-09-26-P20-R01 | AI Overview | keswick-launch.co.uk, mountain-walks.co.uk, coppermines.co.uk, castlerigg.co.uk, keswickparkhotel.co.uk, walklakes.co.uk, manvsglobe.com, lakedistrict.gov.uk, lakedistrict.getanchor.io, keswick.org, komoot.com | no | no |
| AI-2026-09-26-P20-R01 | AI Mode | keswick.org, mountain-walks.co.uk, keswick-launch.co.uk, lakedistrict.getanchor.io, walklakes.co.uk | no | no |
| AI-2026-09-26-P21-R01 | ChatGPT | none shown | no | no |
| AI-2026-09-26-P21-R01 | Perplexity | scafellpike.org.uk, quarto.com, walkingenglishman.com, wikipedia.org, stridingedge.com, where2walk.co.uk, thewanderingwildflower.co.uk, kids.kiddle.co, walks4all.com, abebooks.com, wainwright.org.uk | no | no |
| AI-2026-09-26-P21-R01 | Gemini | guideus.co.uk, quarto.com, alfredwainwright.co.uk | no | no |
| AI-2026-09-26-P21-R01 | AI Overview | wainwrights.info, amazon.co.uk, bookscumbria.com, c2cpackhorse.co.uk | no | no |
| AI-2026-09-26-P21-R01 | AI Mode | books.google.com | no | no |
