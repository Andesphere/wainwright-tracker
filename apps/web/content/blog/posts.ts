/** Blog post metadata and body content for the marketing site. */

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readMinutes: number;
  /** Plain paragraphs; rendered as editorial prose on the post page. */
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "best-wainwright-app",
    title: "Best Wainwright app: what a good tracker should do",
    excerpt:
      "A practical guide to choosing a Wainwright bagging app: checklist, map, notes, photos, sync, and the small details that make all 214 fells easier to track.",
    publishedAt: "2026-05-19",
    readMinutes: 6,
    body: [
      "Search for the best Wainwright app and you quickly find a familiar problem: most walking tools are built for routes, fitness stats, or social sharing. Those can be useful, but they are not quite the same as keeping a careful record of a Wainwright round. Bagging all 214 fells is part checklist, part map work, and part personal journal. The right app needs to respect all three.",
      "A good Wainwright tracker should start with the full list. That sounds obvious, but it matters. The 214 fells are a defined challenge, and walkers need confidence that Scafell Pike, Castle Crag, Great Gable, Haystacks, the Northern Fells, the Central Fells, and the quieter corners of the Far Eastern Fells are all present, consistently named, and easy to find. If the app makes you maintain the list yourself, it is already giving you admin instead of clarity.",
      "The second requirement is a map that understands the challenge. A generic hiking map can show summits, but a Wainwright-specific map lets you see progress at a glance: what is done, what remains, and which fells sit naturally together for a future day out. This is especially useful when you are planning by valley, by Pictorial Guide area, or by a practical base such as Keswick, Ambleside, Buttermere, Patterdale, Borrowdale, or Langdale.",
      "The third feature is a proper checklist. Paper tick lists still have charm, but they are easy to lose, hard to search, and awkward to update if you already have years of walks behind you. A digital checklist should let you mark a fell as complete in seconds, review your total, and filter the list without turning a quiet hill day into spreadsheet work.",
      "For many walkers, the journal is what makes the round meaningful. Dates, notes, weather, companions, photographs, and small memories are the difference between a bare completion count and a record you will actually want to revisit. The best Wainwright app is not only a tick-box; it is a field journal for the long story of your Lake District walking.",
      "Photo support is worth judging carefully. You do not need a heavy social feed, but attaching a few images to a completed fell makes the record richer. The useful version is simple: add photos, keep them organised around the summit or walking day, and make the album easy to browse later. The app should stay quiet and practical, not become another place demanding performance.",
      "Sync matters if you use more than one device. Many people plan on a laptop, check the map on a phone, and look back through notes on a tablet at home. A Wainwright tracker should let your progress follow you. If it only works on one device, you will eventually end up with duplicate lists, half-remembered dates, or a notes file that drifts away from the actual checklist.",
      "Bulk import is another underrated feature. Plenty of walkers discover digital tracking after they have already climbed dozens of fells. Starting again by tapping every summit one by one is friction at the exact moment the app should be earning trust. A useful tracker should make it possible to bring in an existing list from a spreadsheet, text file, or rough notes, then tidy it up into a structured record.",
      "Offline and mobile behaviour also deserve attention. The Lake District is not designed around perfect signal. You should still carry proper navigation, know the forecast, and treat battery life seriously, but the app itself should be comfortable on a phone and quick to open when you are away from a desk. A progressive web app can be a good fit because it works across devices without forcing every walker into a single app store path.",
      "There is also a design question. Wainwright bagging is slow by nature. Some people finish in a year; others take decades. A good tracker should not make the experience feel like a noisy fitness dashboard. It should be clear, calm, and durable: the sort of tool you can return to after a winter away and immediately understand where you left off.",
      "Wainwrights Baggers is built around that opinion. It gives you the 214 fells, a map-first view, progress tracking, notes, photos, albums, and a private account so your round can move with you. It is intentionally focused on the Wainwright challenge rather than trying to be every hiking product at once.",
      "If you are choosing a Wainwright app, use this checklist: does it know all 214 fells, show them clearly on a map, make completions easy, preserve notes and photos, sync across devices, support existing lists, and stay pleasant enough to use for years? If the answer is yes, it can become more than software. It can become the record of your round.",
      "Open the tracker, mark the fells you have already climbed, and use the map to plan the next small step. The 214 do not need to be rushed. They just need to be remembered well.",
    ],
  },
  {
    slug: "introducing-the-tracker",
    title: "Introducing the Wainwright tracker",
    excerpt:
      "A map-first field journal for tracking all 214 Wainwright fells — with notes, photos, albums, and progress that follows you from ridge to browser.",
    publishedAt: "2026-05-18",
    readMinutes: 4,
    body: [
      "If you have ever stood on a Lakeland summit with a battered tick-list in your pocket, you already know the feeling: one more fell bagged, one more line crossed off, and the quiet satisfaction of another chapter in a very long story. Alfred Wainwright's 214 fells are not just hills on a map — they are a personal geography, a lifetime's worth of ridges, tarns, and weather.",
      "This tracker is our answer to that tradition, rebuilt for the way people walk and remember today. At its heart is an interactive map of every Wainwright, from Scafell Pike to Castle Crag, each peak placed with care using open fell data. Tap a summit on the map or search the journal list — filter by area, height, or what you still have left to climb.",
      "When you mark a fell as done, it becomes more than a checkbox. Add a note from the day: the mist rolling in over Striding Edge, the sheep blocking the path, the flask of tea at the trig point. Attach photos — compressed and stored so your journal stays light on the trail and rich when you look back. Over time, your completions weave into albums: chronological chapters of your Lake District years.",
      "Progress syncs through Convex, so your journal is private to your account but available wherever you sign in — phone at the car park, laptop on a rainy evening, tablet planning next weekend's route. You can bulk-import an existing list from a spreadsheet or document, follow other walkers, and install the app as a PWA with offline map tiles for when the signal drops on Great Gable.",
      "We built this tracker because the Wainwright challenge deserves better than a dog-eared list. It deserves a proper field journal: editorial in spirit, practical on the hill, and honest about the slow pleasure of working through all 214.",
      "Create an account, open the map, and log your first summit. The fells have waited a long time — but they are patient.",
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
