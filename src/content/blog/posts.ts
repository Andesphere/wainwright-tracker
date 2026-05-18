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
