/** Rich blog post metadata and body content for the marketing site. */

export type BlogTable = {
  caption?: string;
  columns: string[];
  rows: string[][];
};

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; table: BlogTable }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "cta"; title: string; text: string; href: string; label: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readMinutes: number;
  author: string;
  category: string;
  keywords: string[];
  heroImage: string;
  heroImageAlt: string;
  ogImage: string;
  /** Rich editorial blocks rendered on the post page. */
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "easy-wainwright-walks-map",
    title: "Easy Wainwright Walks Map: Gentle Fell Days",
    excerpt:
      "Use an easy Wainwright walks map to choose gentle Lake District fell days, avoid common planning traps, and log every summit properly during your 214.",
    publishedAt: "2026-05-22",
    readMinutes: 8,
    author: "Wainwrights Baggers",
    category: "Route planning",
    keywords: [
      "easy Wainwright walks map",
      "beginner Wainwright walks",
      "Lake District fell walking",
      "Wainwright checklist",
    ],
    heroImage: "/images/blog/easy-wainwright-walks-map-hero.jpg",
    heroImageAlt:
      "Easy Wainwright walks map with gentle Lake District fells and a walking journal",
    ogImage: "/images/blog/easy-wainwright-walks-map-og.jpg",
    body: [
      {
        type: "paragraph",
        text: "An easy Wainwright walk is not just a short line on a map. The gentlest fell day is the one where distance, ascent, parking, paths, weather, daylight and your own legs all line up. That is why an easy Wainwright walks map is useful: it helps you spot approachable clusters before you commit to a route. The 214 fells reward patience, not bravado.",
      },
      {
        type: "paragraph",
        text: "Search results for this topic tend to split into two camps. Some pages list beginner fells without showing how they sit together. Others show every summit on a map, but leave new baggers to decide which hills make sense for a first outing. This guide joins those two needs: use the map for judgement, then use a checklist and journal to keep the round tidy. If you already track progress in /app or compare tools on /blog/best-wainwright-app, this is the planning layer before the tick.",
      },
      {
        type: "heading",
        text: "What an easy Wainwright walks map should show",
      },
      {
        type: "paragraph",
        text: "A useful map for easy Wainwright walks should do more than scatter pins across the Lake District. It should make clusters visible. A beginner looking at Latrigg, Castle Crag, Loughrigg Fell, Sale Fell, High Rigg or Hallin Fell needs to know where each hill sits, which valley or car park it belongs to, and whether nearby fells could turn a gentle morning into a much harder day.",
      },
      {
        type: "paragraph",
        text: "The Lake District National Park explains that conditions on the fells can change quickly, and the Met Office mountain forecast gives area-specific weather for the Cumbrian fells. Those two sources matter because easy on paper can become awkward in wind, low cloud or winter ice. OS Maps or a paper Ordnance Survey map still belongs in the planning pile; a Wainwright-specific map is best used to track the challenge and compare options.",
      },
      {
        type: "table",
        table: {
          caption: "Beginner-friendly Wainwright map checks",
          columns: ["Map question", "Why it matters", "Practical sign"],
          rows: [
            [
              "Is the fell isolated or clustered?",
              "Clustered fells tempt you to overextend the walk.",
              "Choose one or two modest summits first, not a whole horseshoe.",
            ],
            [
              "How much ascent is involved?",
              "A short walk can still feel hard if it climbs steeply.",
              "Check contour spacing and total climb before distance.",
            ],
            [
              "Where is the safe start point?",
              "Parking and road walking affect the feel of the day.",
              "Plan from an obvious village, pass or recognised car park.",
            ],
            [
              "Can you retreat easily?",
              "Beginners need options if weather or energy changes.",
              "Avoid committing ridges until your confidence grows.",
            ],
          ],
        },
      },
      {
        type: "heading",
        text: "How to choose gentle Wainwright walks in practice",
      },
      {
        type: "paragraph",
        text: "Start with geography, not a trophy list. A map-first approach lets you group the fells by valley and travel day. From Keswick, Latrigg is a classic gentle option with a strong sense of place. From Borrowdale, Castle Crag offers a compact fell day with memorable views. Around Ambleside and Grasmere, Loughrigg Fell feels approachable but still needs proper navigation when paths braid across the lower ground.",
      },
      {
        type: "paragraph",
        text: "Northern and north-western options such as Sale Fell, Ling Fell and High Rigg often suit walkers who want quieter starts to the 214. Hallin Fell above Ullswater is another short, satisfying summit when the weather behaves. None of these names should be treated as guaranteed safe or effortless. Check the forecast, confirm public access and paths, carry waterproofs, and turn back early if visibility or footing deteriorates.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1617458414741-3315467f1dfb?w=1080&q=80",
        alt: "Easy Wainwright walks map planning across green Lake District fells",
        caption:
          "Use the map to judge clusters, escape options and effort before you chase extra summits.",
      },
      {
        type: "list",
        items: [
          "Pick one modest Wainwright as the main objective, then mark optional nearby fells separately.",
          "Check ascent, not just miles; steep grass can make a short route feel slow.",
          "Read the Met Office mountain forecast and local daylight times before leaving home.",
          "Carry a paper map or offline map, compass, layers, food, water and a head torch.",
          "Log the fell afterwards with date, notes and photos so your 214 record stays trustworthy.",
        ],
      },
      {
        type: "heading",
        text: "Easy does not mean navigation-free",
      },
      {
        type: "paragraph",
        text: "The most common beginner mistake is treating easy Wainwrights as park walks. Some are close to towns, cafes or popular paths, but they are still fell country. Mist can erase landmarks. Wet rock changes the character of a descent. A quiet shoulder that looked obvious on a phone screen can feel different when a path fades into grass. The map helps you choose; it does not walk the route for you.",
      },
      {
        type: "paragraph",
        text: "Good planning uses several layers. Use a Wainwright tracker for the canon of 214 fells and your personal progress. Use OS mapping for rights of way, contours and route detail. Use the Met Office and AdventureSmart safety guidance for weather and hill preparation. Use recent local reports with caution, because path conditions, parking rules and seasonal restrictions can change. Sources worth checking include https://www.metoffice.gov.uk/weather/specialist-forecasts/mountain, https://www.adventuresmart.uk/ and https://explore.osmaps.com/.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1617565436074-56b2f85a03f6?w=1080&q=80",
        alt: "Lake District tarn and trees near an easy Wainwright walking route",
        caption:
          "Gentle days still deserve proper weather checks, daylight planning and navigation backup.",
      },
      {
        type: "heading",
        text: "A simple map workflow for the first ten fells",
      },
      {
        type: "paragraph",
        text: "For the first ten Wainwrights, keep the system deliberately boring. Open the tracker, filter the map to one area, and shortlist fells that sit near a sensible base. Read a proper route description elsewhere, then return to the Wainwright map to understand how that summit fits your wider round. This prevents random ticking, where your completed fells end up scattered across the Lakes with no memory of why you chose them.",
      },
      {
        type: "paragraph",
        text: "After each walk, record more than the tick. Note the date, route, weather, who came with you, how the climb felt, and whether you would recommend it to another beginner. Add photos if they help you remember the day. Over time, your easy Wainwright walks map becomes a private field journal: which areas you know well, which valleys need another visit, and which remaining fells deserve a longer summer day.",
      },
      {
        type: "heading",
        text: "Common mistakes when mapping easy Wainwright walks",
      },
      {
        type: "paragraph",
        text: "First, walkers often chase lists copied from the web without checking whether the suggested fell suits the day. Second, they combine too many nearby summits because the map makes them look close. Third, they ignore descent difficulty; tired legs make the way down feel longer. Fourth, they forget to log failed or shortened days, even though those notes are useful for future planning. Fifth, they treat phone signal as a plan rather than a bonus.",
      },
      {
        type: "paragraph",
        text: "Avoid those traps by separating ambition from the base route. Mark one objective as the walk, then keep extensions optional. Save a note in your Wainwright checklist before you go: planned start point, likely route, weather concern and bail-out option. When you come home, update the record while the memory is fresh. The habit matters more than the technology; the app just makes the habit easier to keep.",
      },
      {
        type: "heading",
        text: "Key takeaways for beginner Wainwright baggers",
      },
      {
        type: "list",
        items: [
          "An easy Wainwright walks map should show clusters, ascent, start points and sensible restraint.",
          "Beginner-friendly fells can still need proper navigation, weather judgement and spare layers.",
          "Use authoritative sources such as the Met Office, Lake District National Park and OS Maps for route planning context.",
          "Track your progress in /app so every completed fell has a date, note and memory attached.",
          "Read more planning notes on /blog, then choose the next fell by conditions rather than ego.",
        ],
      },
      {
        type: "cta",
        title: "Plan the next gentle Wainwright",
        text: "Open Wainwrights Baggers, mark the fells you have already climbed, and use the map to choose a modest next objective. The round is easier to enjoy when every tick has context, memory and a sensible plan behind it.",
        href: "/app",
        label: "Open the tracker",
      },
    ],
  },  {
    slug: "best-beginner-wainwrights",
    title: "Best Beginner Wainwrights: 9 Gentle First Fells",
    excerpt:
      "Best beginner Wainwrights for new Lake District fell baggers: nine gentler first summits, planning checks, safety caveats, and tracker tips.",
    publishedAt: "2026-05-22",
    readMinutes: 9,
    author: "Wainwrights Baggers",
    category: "Beginner guide",
    keywords: [
      "best beginner Wainwrights",
      "beginner Wainwright walks",
      "easy Wainwrights",
      "Lake District fell bagging",
    ],
    heroImage: "/images/blog/best-beginner-wainwrights-hero.jpg",
    heroImageAlt:
      "Best beginner Wainwrights route planning with gentle Lake District fells and a map",
    ogImage: "/images/blog/best-beginner-wainwrights-og.jpg",
    body: [
      {
        type: "paragraph",
        text: "The best beginner Wainwrights are not always the lowest hills, the shortest walks, or the names that appear most often on social media. A good first fell gives you a proper Lake District day without forcing you into exposed ground, confusing navigation, or a long descent on tired legs. Start with confidence, then let the harder ridges wait their turn.",
      },
      {
        type: "paragraph",
        text: "This list is for walkers beginning the 214 Wainwright challenge, returning after time away, or helping friends choose a sensible first outing. Treat it as a planning shortlist, not a route guarantee. Weather, daylight, path condition, transport, fitness and navigation still decide whether any fell is right on the day. For route detail, pair a Wainwright tracker with OS mapping, the Met Office mountain forecast and Lake District National Park walking guidance.",
      },
      {
        type: "heading",
        text: "How to judge the best beginner Wainwrights",
      },
      {
        type: "paragraph",
        text: "Beginner-friendly means manageable, memorable and easy to place on the map. Distance matters, but ascent often matters more. A compact fell can still feel hard if the climb is steep, wet or pathless. A longer low-level approach may be calmer if it follows clear tracks, gives simple retreat options and avoids committing ridges. The best first Wainwright is the one you can finish with enough attention left for the descent.",
      },
      {
        type: "table",
        table: {
          caption: "Beginner Wainwright selection checks",
          columns: ["Check", "Why it matters", "Good beginner sign"],
          rows: [
            [
              "Clear approach",
              "New walkers should spend energy on the hill, not car-park confusion.",
              "Obvious start point near a village, pass or recognised path.",
            ],
            [
              "Modest ascent",
              "Climb changes the effort more than mileage alone.",
              "Rounded slopes, short pulls and no need to rush extra summits.",
            ],
            [
              "Simple navigation",
              "Mist can make even small fells feel different.",
              "Clear paths, strong landmarks and a paper or offline map backup.",
            ],
            [
              "Retreat options",
              "Beginners need permission to shorten the day.",
              "Easy return line before committing to a ridge or high plateau.",
            ],
            [
              "Good reward",
              "Early walks should build the habit.",
              "Views, a summit feeling and a record worth adding to your journal.",
            ],
          ],
        },
      },
      {
        type: "paragraph",
        text: "Use authoritative sources before you go. The Met Office mountain forecast covers the Cumbrian fells at https://www.metoffice.gov.uk/weather/specialist-forecasts/mountain, Lake District National Park walking advice lives at https://www.lakedistrict.gov.uk/visiting/things-to-do/walking, and OS Maps at https://explore.osmaps.com/ helps with rights of way, contours and route context. A Wainwright app is for the canon, checklist and journal; it does not replace hill judgement.",
      },
      {
        type: "heading",
        text: "Nine gentle fells for a first Wainwright shortlist",
      },
      {
        type: "paragraph",
        text: "Latrigg is the classic Keswick starter: modest, familiar and rewarding, with views across town and Derwent Water when the cloud lifts. Castle Crag gives a compact Borrowdale day with a distinctive summit and a strong sense of place. Loughrigg Fell, between Ambleside, Grasmere and Rydal, suits walkers who want low height, varied paths and excellent views, though the network of tracks still needs careful navigation.",
      },
      {
        type: "paragraph",
        text: "Hallin Fell above Ullswater is short, shapely and satisfying in good weather. Sale Fell and Ling Fell in the north-western fells are quieter choices with rounded profiles, useful if you want space away from the busiest valleys. High Rigg offers a lovely low ridge near St John's in the Vale, but its undulating ground can feel longer than expected. Gowbarrow Fell gives Ullswater views and flexible route choices. Binsey, sitting apart near the northern edge of the Lakes, is often a gentle introduction to map reading without the pressure of bigger neighbours.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1636631625028-10735c64ab4c?w=1080&q=80",
        alt: "Best beginner Wainwrights walker on a grassy Lake District hill path",
        caption:
          "A good first fell should feel like hill walking, not a test you barely survive.",
      },
      {
        type: "list",
        items: [
          "Best town-side starter: Latrigg, especially if you are based around Keswick.",
          "Best compact Borrowdale objective: Castle Crag, with a proper summit feeling.",
          "Best flexible low fell: Loughrigg Fell, provided you track the paths carefully.",
          "Best short Ullswater summit: Hallin Fell on a clear, settled day.",
          "Best quieter northern options: Sale Fell, Ling Fell, High Rigg or Binsey.",
        ],
      },
      {
        type: "heading",
        text: "Beginner Wainwrights to treat with respect",
      },
      {
        type: "paragraph",
        text: "Catbells appears on many beginner lists, and it can be a wonderful fell, but popularity does not make it trivial. The ridge is busy, parking can be awkward, and some walkers find the steeper sections more exposed than expected. Walla Crag can also feel simple from Keswick, yet wet stone, woodland paths and changing visibility still deserve attention. Treat famous easy fells as real fell walks, not tourist errands.",
      },
      {
        type: "paragraph",
        text: "Avoid turning a first outing into a numbers day. The map will tempt you with nearby tops, especially around Loughrigg, High Rigg, Sale Fell and Ling Fell. Save extensions as optional notes rather than promises. If the first summit gives you enough, log it properly and leave the next fell for a better forecast. Completing the 214 is a long project; learning restraint early is part of the craft.",
      },
      {
        type: "quote",
        text: "A beginner-friendly Wainwright is not the easiest name on a list. It is the fell that matches today's weather, daylight, legs and navigation.",
      },
      {
        type: "heading",
        text: "A simple first-five Wainwright plan",
      },
      {
        type: "paragraph",
        text: "Plan the first five by area rather than by ego. Choose one base, open the Wainwrights Baggers map at /app, and filter around a valley you can reach easily. Pick one main objective, then add a nearby candidate only as a bonus. Before leaving home, write a short plan in your notes: start point, intended line, weather concern, latest turn-back time and what you will log afterwards.",
      },
      {
        type: "paragraph",
        text: "After each walk, update the journal while the day is fresh. Add the date, route, weather, companions, small mistakes and photos. That record helps future planning more than a bare tick. It also shows patterns: which ground you enjoy, which areas need more time, and whether you are ready to move from rounded starter fells towards longer days in the Central, Western or Far Eastern groups.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1662544766453-8fa68162c97a?w=1080&q=80",
        alt: "Beginner Wainwright walk planning road and open Lake District field",
        caption:
          "Keep the first few walks simple: one objective, clear retreat options and a note for the journal.",
      },
      {
        type: "heading",
        text: "Key takeaways for new Wainwright baggers",
      },
      {
        type: "list",
        items: [
          "The best beginner Wainwrights combine modest effort, clear navigation and a satisfying summit.",
          "Good starter options include Latrigg, Castle Crag, Loughrigg Fell, Hallin Fell, Sale Fell, Ling Fell, High Rigg, Gowbarrow Fell and Binsey.",
          "Check weather, daylight, route detail and escape options before treating any fell as easy.",
          "Use /blog/best-wainwright-app for tracker criteria and /blog for more field notes as the guide grows.",
          "Log every completed fell in /app with date, notes and photos so your 214 round becomes a field journal.",
        ],
      },
      {
        type: "cta",
        title: "Start your first Wainwright shortlist",
        text: "Open Wainwrights Baggers, mark any fells you have already climbed, and use the map to shortlist one gentle next objective. A careful first tick is better than an ambitious day you cannot enjoy or remember well.",
        href: "/app",
        label: "Open the tracker",
      },
    ],
  },
  {
    slug: "best-wainwright-app",
    title: "Best Wainwright app: what a good tracker should do",
    excerpt:
      "A practical guide to choosing a Wainwright bagging app: checklist, map, notes, photos, sync, and the small details that make all 214 fells easier to track.",
    publishedAt: "2026-05-19",
    readMinutes: 8,
    author: "Wainwrights Baggers",
    category: "Buyer's guide",
    keywords: [
      "best Wainwright app",
      "Wainwright tracker",
      "Wainwright checklist app",
      "Lake District walking app",
    ],
    heroImage: "/images/blog/best-wainwright-app-hero.jpg",
    heroImageAlt:
      "A field journal, Lake District map and phone checklist for tracking Wainwright fells",
    ogImage: "/images/blog/best-wainwright-app-og.jpg",
    body: [
      {
        type: "paragraph",
        text: "Search for the best Wainwright app and you quickly find a familiar problem: most walking tools are built for routes, fitness stats, or social sharing. Those can be useful, but they are not quite the same as keeping a careful record of a Wainwright round. Bagging all 214 fells is part checklist, part map work, and part personal journal. The right app needs to respect all three.",
      },
      {
        type: "paragraph",
        text: "This guide uses a simple test: would the tool still feel useful after years of walking, bad signal, half-finished notes, and a growing pile of summit photos? If not, it is probably a route app with Wainwright data bolted on, not a proper Wainwright tracker.",
      },
      {
        type: "heading",
        text: "What a Wainwright app must get right",
      },
      {
        type: "paragraph",
        text: "A good Wainwright tracker should start with the full list. That sounds obvious, but it matters. The 214 fells are a defined challenge, and walkers need confidence that Scafell Pike, Castle Crag, Great Gable, Haystacks, the Northern Fells, the Central Fells, and the quieter corners of the Far Eastern Fells are all present, consistently named, and easy to find.",
      },
      {
        type: "table",
        table: {
          caption: "Wainwright app evaluation checklist",
          columns: ["Feature", "Why it matters", "Good sign"],
          rows: [
            [
              "214-fell checklist",
              "Removes spreadsheet admin and naming mistakes.",
              "Every fell is preloaded and searchable.",
            ],
            [
              "Map-first planning",
              "Shows what is done, nearby and still outstanding.",
              "Completed and remaining fells are visually distinct.",
            ],
            [
              "Journal notes",
              "Keeps the memory of the day, not just the tick.",
              "Dates, companions, weather and free-text notes are easy to add.",
            ],
            [
              "Photo support",
              "Turns a checklist into a record worth revisiting.",
              "Photos sit with the fell or album, not in a noisy social feed.",
            ],
            [
              "Sync and import",
              "Most walkers already have partial records somewhere.",
              "Progress moves across devices and old lists can be brought in.",
            ],
          ],
        },
      },
      {
        type: "heading",
        text: "Checklist and map should work together",
      },
      {
        type: "paragraph",
        text: "The map is where a Wainwright tracker earns its keep. A generic hiking map can show summits, but a Wainwright-specific map lets you see progress at a glance: what is done, what remains, and which fells sit naturally together for a future day out. This is especially useful when planning by valley, by Pictorial Guide area, or by a practical base such as Keswick, Ambleside, Buttermere, Patterdale, Borrowdale, or Langdale.",
      },
      {
        type: "list",
        items: [
          "Use the checklist for the definitive 214-fell record.",
          "Use the map to spot clusters that make sense for a walking day.",
          "Use search and filters when deciding whether to plan by area, height or remaining fells.",
          "Keep paper maps and proper navigation for the hill; use the app as your progress journal.",
        ],
      },
      {
        type: "image",
        src: "/hero-slope.png",
        alt: "Lake District fells used as the visual style for the Wainwright tracker",
        caption:
          "The best tracking tools feel quiet and durable: clear enough for planning, calm enough to return to after months away.",
      },
      {
        type: "heading",
        text: "The journal is the long-term value",
      },
      {
        type: "paragraph",
        text: "For many walkers, the journal is what makes the round meaningful. Dates, notes, weather, companions, photographs, and small memories are the difference between a bare completion count and a record you will actually want to revisit. The best Wainwright app is not only a tick-box; it is a field journal for the long story of your Lake District walking.",
      },
      {
        type: "quote",
        text: "The real test is not whether an app can log one summit. It is whether it still makes sense when your round spans years.",
      },
      {
        type: "heading",
        text: "Sync, photos and import are not extras",
      },
      {
        type: "paragraph",
        text: "Sync matters if you use more than one device. Many people plan on a laptop, check the map on a phone, and look back through notes on a tablet at home. A Wainwright tracker should let your progress follow you. If it only works on one device, you will eventually end up with duplicate lists, half-remembered dates, or a notes file that drifts away from the actual checklist.",
      },
      {
        type: "paragraph",
        text: "Bulk import is another underrated feature. Plenty of walkers discover digital tracking after they have already climbed dozens of fells. Starting again by tapping every summit one by one is friction at the exact moment the app should be earning trust. A useful tracker should make it possible to bring in an existing list from a spreadsheet, text file, or rough notes, then tidy it up into a structured record.",
      },
      {
        type: "heading",
        text: "How Wainwrights Baggers fits this checklist",
      },
      {
        type: "paragraph",
        text: "Wainwrights Baggers is built around that opinion. It gives you the 214 fells, a map-first view, progress tracking, notes, photos, albums, and a private account so your round can move with you. It is intentionally focused on the Wainwright challenge rather than trying to be every hiking product at once.",
      },
      {
        type: "cta",
        title: "Start with the fells you have already done",
        text: "Open the tracker, mark your completed Wainwrights, and use the map to plan the next small step. The 214 do not need to be rushed. They just need to be remembered well.",
        href: "/app",
        label: "Open the tracker",
      },
    ],
  },
  {
    slug: "introducing-the-tracker",
    title: "Introducing the Wainwright tracker",
    excerpt:
      "A map-first field journal for tracking all 214 Wainwright fells — with notes, photos, albums, and progress that follows you from ridge to browser.",
    publishedAt: "2026-05-18",
    readMinutes: 4,
    author: "Wainwrights Baggers",
    category: "Product note",
    keywords: ["Wainwright tracker", "Wainwright journal", "Lake District app"],
    heroImage: "/hero-slope.png",
    heroImageAlt: "Lake District fells under a quiet sky",
    ogImage: "/hero-slope.png",
    body: [
      {
        type: "paragraph",
        text: "If you have ever stood on a Lakeland summit with a battered tick-list in your pocket, you already know the feeling: one more fell bagged, one more line crossed off, and the quiet satisfaction of another chapter in a very long story. Alfred Wainwright's 214 fells are not just hills on a map — they are a personal geography, a lifetime's worth of ridges, tarns, and weather.",
      },
      {
        type: "heading",
        text: "A map for the full round",
      },
      {
        type: "paragraph",
        text: "This tracker is our answer to that tradition, rebuilt for the way people walk and remember today. At its heart is an interactive map of every Wainwright, from Scafell Pike to Castle Crag, each peak placed with care using open fell data. Tap a summit on the map or search the journal list — filter by area, height, or what you still have left to climb.",
      },
      {
        type: "heading",
        text: "A journal, not a noisy feed",
      },
      {
        type: "paragraph",
        text: "When you mark a fell as done, it becomes more than a checkbox. Add a note from the day: the mist rolling in over Striding Edge, the sheep blocking the path, the flask of tea at the trig point. Attach photos — compressed and stored so your journal stays light on the trail and rich when you look back.",
      },
      {
        type: "paragraph",
        text: "Progress syncs through Convex, so your journal is private to your account but available wherever you sign in — phone at the car park, laptop on a rainy evening, tablet planning next weekend's route. You can bulk-import an existing list from a spreadsheet or document, follow other walkers, and install the app as a PWA with offline map tiles for when the signal drops on Great Gable.",
      },
      {
        type: "cta",
        title: "Begin the round in your own time",
        text: "Create an account, open the map, and log your first summit. The fells have waited a long time — but they are patient.",
        href: "/app",
        label: "Open the journal",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function formatBlogDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
