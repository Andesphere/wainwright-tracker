import type { Wainwright } from "@wainwrights/catalog/wainwrights";
import type { Metadata, MetadataRoute } from "next";
import { type Author, AUTHORS, authorPath, getAuthor } from "@/content/authors";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/appStore";
import {
  type Guide,
  getGuide,
  getGuides,
  guideAuthor,
  latestUpdate,
} from "@/lib/guides";
import {
  type Book,
  BOOKS,
  BY_HEIGHT,
  bookOf,
  bookPath,
  fellPath,
  fellsInBook,
  formatHeight,
  getBook,
  getFell,
  highestOf,
} from "@/lib/fells";
import { getAscent, isReleased } from "@/lib/fellPages";

export const SITE_URL = "https://wainwrightsbaggers.com";
export const SITE_NAME = "Wainwrights Baggers";

/** A share card. Width, height and type must match the file in public/ (seo.test.ts checks). */
export type OgImage = {
  url: string;
  width: number;
  height: number;
  type: "image/jpeg" | "image/png";
  alt: string;
};

/**
 * The site-wide share card. Social networks cache cards by image URL, so a new
 * design gets a new file name; never overwrite this file in place.
 */
export const DEFAULT_OG_IMAGE: OgImage = {
  url: "/wainwrights-214-og.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Bag all 214 Wainwrights: fells of the Lake District under a Wainwrights Baggers title card",
};

/** Square PNG logo for Organization structured data (Google wants 112 px or more). */
export const LOGO = { url: "/logo-512.png", width: 512, height: 512 };

export type SeoRouteKind =
  | "home"
  | "contact"
  | "privacy"
  | "guides"
  | "guide"
  | "author"
  | "fells"
  | "book"
  | "fell"
  | "app";

export type Breadcrumb = { name: string; path: string };

export type RouteSeo = {
  kind: SeoRouteKind;
  path: string;
  title: string;
  description: string;
  image: OgImage;
  /**
   * Date (YYYY-MM-DD) the page's copy last changed; drives the sitemap. Kept
   * by hand: bump it in the same change as the copy. Indexable pages only.
   */
  lastModified?: string;
  /** The trail above and including this page; omitted where there is none. */
  breadcrumbs?: Breadcrumb[];
  noIndex?: boolean;
  guide?: Guide;
  author?: Author;
  /** The fells a hub lists, in the order its HTML lists them (ItemList). */
  fells?: Wainwright[];
  book?: Book;
  fell?: Wainwright;
};

const homeDescription =
  "Track all 214 Wainwright fells on a 3D Lake District map. Free on iPhone and the web, with your round in sync. Pro adds a photo journal.";

const guidesDescription =
  "Wainwright walking guides for planning and remembering the 214 fells: gentle first fells, checklists, the seven books and the tools for the round.";

const appDescription =
  "Open the Wainwrights Baggers tracker to mark completed fells, add notes and photos, and plan the rest of your Lake District round.";

const GUIDES_NAME = "Wainwright Guides";

/** Date the hub and book hub copy last changed; bump it with the copy. */
const FELLS_UPDATED = "2026-09-26";
const fellsCrumbs: Breadcrumb[] = [
  { name: "Home", path: "/" },
  { name: "All 214 Wainwrights", path: "/fells" },
];
const guidesCrumbs: Breadcrumb[] = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
];

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function normalizePath(slug?: string[]): string {
  if (!slug || slug.length === 0) return "/";
  return `/${slug.join("/")}`;
}

/** Front matter requires a 1200x630 JPEG card; seo.test.ts reads each file to check. */
function guideImage(guide: Guide): OgImage {
  return {
    url: guide.ogImage,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: guide.heroImageAlt,
  };
}

/** The SEO for an author's profile page; exported so tests can pass a fixture. */
export function authorRouteSeo(author: Author): RouteSeo {
  const path = authorPath(author);
  if (!path) throw new Error(`${author.name} has no profile page`);
  return {
    kind: "author",
    path,
    author,
    title: `${author.name}, Wainwright guides author`,
    description: `${author.name}: ${author.role}. ${author.bio[0] ?? ""}`
      .trim()
      .slice(0, 160),
    image: DEFAULT_OG_IMAGE,
    lastModified: latestUpdate(
      getGuides().filter((guide) => guide.author === author.slug),
    ),
    breadcrumbs: [...guidesCrumbs, { name: author.name, path }],
  };
}

/** The SEO for a book hub. */
export function bookRouteSeo(book: Book): RouteSeo {
  const path = bookPath(book);
  const fells = fellsInBook(book);
  const highest = highestOf(fells);
  return {
    kind: "book",
    path,
    book,
    fells,
    title: `${book.title}: all ${fells.length} Wainwrights in Book ${book.number}`,
    description: `The ${fells.length} fells of ${book.title}, Book ${book.number} of Wainwright's Pictorial Guide to the Lakeland Fells, in book order with heights in metres and feet. Highest: ${highest.name}, ${formatHeight(highest)}.`,
    image: DEFAULT_OG_IMAGE,
    lastModified: FELLS_UPDATED,
    breadcrumbs: [...fellsCrumbs, { name: book.title, path }],
  };
}

/**
 * A fell's share card, generated at build time (app/fells/[id]/card-v1.png).
 * Bump the version in the path when the design changes; networks cache by URL.
 */
export function fellCard(fell: Wainwright): OgImage {
  return {
    url: `${fellPath(fell)}/card-v1.png`,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: `${fell.name}, ${formatHeight(fell)}, a Wainwright in ${bookOf(fell).title}`,
  };
}

/**
 * The SEO for a fell page. Fells on the release list are indexable, with
 * their own description; the rest stay noindex and out of the sitemap.
 */
export function fellRouteSeo(fell: Wainwright): RouteSeo {
  const path = fellPath(fell);
  const book = bookOf(fell);
  const text = getAscent(fell.id)?.text;
  return {
    kind: "fell",
    path,
    fell,
    book,
    title: text
      ? `${fell.name} (${formatHeight(fell)}): walk, route map and free GPX`
      : `${fell.name} (${formatHeight(fell)}): a Wainwright in ${book.title}`,
    description:
      text?.description ??
      `${fell.name} is one of the 214 Wainwrights, ${formatHeight(fell)} high, in Book ${book.number} of Wainwright's Pictorial Guides, ${book.title}.`,
    image: fellCard(fell),
    lastModified: text?.updatedAt,
    noIndex: !text,
    breadcrumbs: [
      ...fellsCrumbs,
      { name: book.title, path: bookPath(book) },
      { name: fell.name, path },
    ],
  };
}

export function getRouteSeo(slug?: string[]): RouteSeo {
  const path = normalizePath(slug);

  if (path === "/") {
    return {
      kind: "home",
      path,
      title: "Wainwrights Baggers | Map, Checklist & Journal for the 214 Fells",
      description: homeDescription,
      image: DEFAULT_OG_IMAGE,
      lastModified: "2026-09-26",
    };
  }

  if (path === "/contact") {
    return {
      kind: "contact",
      path,
      title: "Contact Wainwrights Baggers",
      description:
        "Send a note to the people behind Wainwrights Baggers: questions about the tracker, the iPhone app, your account or a fell we got wrong.",
      image: DEFAULT_OG_IMAGE,
      lastModified: "2026-09-26",
    };
  }

  if (path === "/privacy") {
    return {
      kind: "privacy",
      path,
      title: `Privacy policy · ${SITE_NAME}`,
      description:
        "What Wainwrights Baggers stores about you, who processes it, and how to delete it.",
      image: DEFAULT_OG_IMAGE,
      lastModified: "2026-09-25",
    };
  }

  if (path === "/guides") {
    return {
      kind: "guides",
      path,
      title: "Wainwright Walking Guides for the 214 Fells",
      description: guidesDescription,
      image: DEFAULT_OG_IMAGE,
      lastModified: latestUpdate(getGuides()),
      breadcrumbs: guidesCrumbs,
    };
  }

  if (path === "/fells") {
    return {
      kind: "fells",
      path,
      fells: BY_HEIGHT,
      title: "All 214 Wainwrights: List, Map and Heights",
      description:
        "The full list of the 214 Wainwright fells of the Lake District, with heights in metres and feet, the Pictorial Guide each is in, and a map of every summit.",
      image: DEFAULT_OG_IMAGE,
      lastModified: FELLS_UPDATED,
      breadcrumbs: fellsCrumbs,
    };
  }

  if (path === "/app") {
    return {
      kind: "app",
      path,
      title: "Open the Wainwright Tracker",
      description: appDescription,
      image: DEFAULT_OG_IMAGE,
      noIndex: true,
    };
  }

  const authorMatch = path.match(/^\/guides\/authors\/([^/]+)$/);
  if (authorMatch) {
    const author = getAuthor(authorMatch[1]);
    if (author && authorPath(author)) return authorRouteSeo(author);
  }

  const bookMatch = path.match(/^\/fells\/books\/([^/]+)$/);
  if (bookMatch) {
    const book = getBook(bookMatch[1]);
    if (book) return bookRouteSeo(book);
  }

  const fellMatch = path.match(/^\/fells\/([^/]+)$/);
  if (fellMatch) {
    const fell = getFell(fellMatch[1]);
    if (fell) return fellRouteSeo(fell);
  }

  const guideMatch = path.match(/^\/guides\/([^/]+)$/);
  if (guideMatch) {
    const guide = getGuide(guideMatch[1]);
    if (guide) {
      return {
        kind: "guide",
        path,
        guide,
        title: guide.title,
        description: guide.description,
        image: guideImage(guide),
        lastModified: guide.updatedAt,
        breadcrumbs: [...guidesCrumbs, { name: guide.title, path }],
      };
    }
  }

  throw new Error(`No SEO route for ${path}`);
}

function openGraphImage(image: OgImage) {
  return {
    url: absoluteUrl(image.url),
    width: image.width,
    height: image.height,
    type: image.type,
    alt: image.alt,
  };
}

/** Root layout defaults, so any page without its own card (the 404) still has one. */
export function defaultMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_NAME,
    description: homeDescription,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_GB",
      title: SITE_NAME,
      description: homeDescription,
      images: [openGraphImage(DEFAULT_OG_IMAGE)],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: homeDescription,
      images: [
        { url: absoluteUrl(DEFAULT_OG_IMAGE.url), alt: DEFAULT_OG_IMAGE.alt },
      ],
    },
  };
}

export function buildMetadata(seo: RouteSeo): Metadata {
  const canonical = absoluteUrl(seo.path);
  const guide = seo.kind === "guide" ? seo.guide : undefined;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical,
    },
    robots: seo.noIndex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: guide ? "article" : seo.kind === "author" ? "profile" : "website",
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: "en_GB",
      images: [openGraphImage(seo.image)],
      ...(guide
        ? {
            publishedTime: guide.publishedAt,
            modifiedTime: guide.updatedAt,
            authors: [guideAuthor(guide).name],
            section: guide.category,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [{ url: absoluteUrl(seo.image.url), alt: seo.image.alt }],
    },
  };
}

function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(LOGO.url),
      width: LOGO.width,
      height: LOGO.height,
    },
    parentOrganization: {
      "@type": "Organization",
      name: "Andesphere Ltd",
      url: "https://www.andesphere.com",
    },
    ...(APP_STORE_LIVE ? { sameAs: [APP_STORE_URL] } : {}),
  };
}

function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: homeDescription,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en-GB",
  };
}

const freeOffer = {
  "@type": "Offer",
  price: "0",
  priceCurrency: "GBP",
};

function webAppSchema() {
  return {
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    description: homeDescription,
    publisher: { "@id": ORGANIZATION_ID },
    offers: freeOffer,
  };
}

function mobileAppSchema() {
  return {
    "@type": "MobileApplication",
    "@id": `${SITE_URL}/#iosapp`,
    name: SITE_NAME,
    url: APP_STORE_URL,
    installUrl: APP_STORE_URL,
    applicationCategory: "TravelApplication",
    operatingSystem: "iOS",
    image: absoluteUrl(LOGO.url),
    description: homeDescription,
    publisher: { "@id": ORGANIZATION_ID },
    offers: freeOffer,
  };
}

function breadcrumbSchema(crumbs: Breadcrumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function personId(author: Author) {
  return `${absoluteUrl(authorPath(author)!)}#person`;
}

function personSchema(author: Author) {
  return {
    "@type": "Person",
    "@id": personId(author),
    name: author.name,
    url: absoluteUrl(authorPath(author)!),
    description: author.role,
    ...(author.portrait ? { image: absoluteUrl(author.portrait.src) } : {}),
  };
}

/** The brand points at the Organization node; a person is named in full. */
function authorRef(author: Author) {
  return author.kind === "person"
    ? personSchema(author)
    : { "@id": ORGANIZATION_ID };
}

function guidesSchema() {
  return {
    "@type": "Blog",
    "@id": `${SITE_URL}/guides#blog`,
    url: absoluteUrl("/guides"),
    name: GUIDES_NAME,
    description: guidesDescription,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en-GB",
    blogPost: getGuides().map((guide) => ({
      "@type": "BlogPosting",
      headline: guide.title,
      url: absoluteUrl(`/guides/${guide.slug}`),
      datePublished: guide.publishedAt,
      dateModified: guide.updatedAt,
      author: authorRef(guideAuthor(guide)),
    })),
  };
}

function articleSchema(guide: Guide, path: string) {
  return {
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(path)}#article`,
    mainEntityOfPage: absoluteUrl(path),
    headline: guide.title,
    description: guide.description,
    image: absoluteUrl(guide.heroImage),
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: authorRef(guideAuthor(guide)),
    publisher: { "@id": ORGANIZATION_ID },
    keywords: guide.primaryKeyword,
    articleSection: guide.category,
    inLanguage: "en-GB",
  };
}

function profileSchema(author: Author, path: string) {
  return {
    "@type": "ProfilePage",
    "@id": `${absoluteUrl(path)}#profile`,
    url: absoluteUrl(path),
    mainEntity: personSchema(author),
    inLanguage: "en-GB",
  };
}

function placeSchema(seo: RouteSeo, fell: Wainwright) {
  return {
    "@type": "Place",
    "@id": `${absoluteUrl(seo.path)}#place`,
    name: fell.name,
    description: seo.description,
    url: absoluteUrl(seo.path),
    geo: {
      "@type": "GeoCoordinates",
      latitude: fell.latitude,
      longitude: fell.longitude,
      elevation: fell.heightMetres,
    },
    containedInPlace: {
      "@type": "Place",
      name: "Lake District National Park",
    },
  };
}

function itemListSchema(seo: RouteSeo, fells: Wainwright[]) {
  return {
    "@type": "ItemList",
    "@id": `${absoluteUrl(seo.path)}#list`,
    name: seo.title,
    numberOfItems: fells.length,
    itemListElement: fells.map((fell, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: fell.name,
      url: absoluteUrl(fellPath(fell)),
    })),
  };
}

/** One JSON-LD graph per page: the site nodes, then what this route kind adds. */
export function buildJsonLd(seo: RouteSeo) {
  const graph: unknown[] = [organizationSchema(), websiteSchema()];

  if (seo.kind === "home") {
    graph.push(webAppSchema());
    if (APP_STORE_LIVE) graph.push(mobileAppSchema());
  }
  if (seo.kind === "guides") graph.push(guidesSchema());
  if (seo.kind === "guide" && seo.guide)
    graph.push(articleSchema(seo.guide, seo.path));
  if (seo.kind === "author" && seo.author)
    graph.push(profileSchema(seo.author, seo.path));
  if (seo.kind === "fell" && seo.fell) graph.push(placeSchema(seo, seo.fell));
  if (seo.fells) graph.push(itemListSchema(seo, seo.fells));
  if (seo.breadcrumbs) graph.push(breadcrumbSchema(seo.breadcrumbs));

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function JsonLd({ seo }: { seo: RouteSeo }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(buildJsonLd(seo)) }}
    />
  );
}

/** Every indexable page with the date its content last changed. */
export function sitemapEntries(): MetadataRoute.Sitemap {
  const slugs = [
    [],
    ["contact"],
    ["privacy"],
    ["guides"],
    ...getGuides().map((guide) => ["guides", guide.slug]),
    ["fells"],
  ];
  const authors = AUTHORS.filter((author) => authorPath(author)).map(
    authorRouteSeo,
  );
  const fells = BY_HEIGHT.filter((fell) => isReleased(fell.id)).map(
    fellRouteSeo,
  );
  return [
    ...slugs.map((slug) => getRouteSeo(slug)),
    ...BOOKS.map(bookRouteSeo),
    ...fells,
    ...authors,
  ].map((seo) => ({
    url: absoluteUrl(seo.path),
    lastModified: seo.lastModified,
  }));
}
