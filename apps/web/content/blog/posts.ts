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
