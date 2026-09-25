import type { Metadata, MetadataRoute } from "next";
import type { BlogPost } from "@/content/blog/posts";
import { BLOG_POSTS, getBlogPost } from "@/content/blog/posts";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/appStore";

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
  | "blog"
  | "post"
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
  post?: BlogPost;
};

const homeDescription =
  "Track all 214 Wainwright fells on a 3D Lake District map. Free on iPhone and the web, with your round in sync. Pro adds a photo journal.";

const blogDescription =
  "Wainwright walking guides, tracker tips, Lake District checklist advice and field notes for planning and remembering the 214 fells.";

const appDescription =
  "Open the Wainwrights Baggers tracker to mark completed fells, add notes and photos, and plan the rest of your Lake District round.";

const BLOG_NAME = "Wainwright Journal";
const blogCrumbs: Breadcrumb[] = [
  { name: "Home", path: "/" },
  { name: BLOG_NAME, path: "/blog" },
];

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function normalizePath(slug?: string[]): string {
  if (!slug || slug.length === 0) return "/";
  return `/${slug.join("/")}`;
}

function postImage(post: BlogPost): OgImage {
  if (!post.ogImage) return DEFAULT_OG_IMAGE;
  return {
    url: post.ogImage,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: post.heroImageAlt,
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
      lastModified: "2026-09-25",
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

  if (path === "/blog") {
    return {
      kind: "blog",
      path,
      title: "Wainwright Walking Guides & Tracker Tips",
      description: blogDescription,
      image: DEFAULT_OG_IMAGE,
      lastModified: BLOG_POSTS.map((post) => post.updatedAt)
        .sort()
        .at(-1),
      breadcrumbs: blogCrumbs,
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

  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const post = getBlogPost(blogMatch[1]);
    if (post) {
      return {
        kind: "post",
        path,
        post,
        title: post.title,
        description: post.excerpt,
        image: postImage(post),
        lastModified: post.updatedAt,
        breadcrumbs: [...blogCrumbs, { name: post.title, path }],
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
  const post = seo.kind === "post" ? seo.post : undefined;

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
      type: post ? "article" : "website",
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: "en_GB",
      images: [openGraphImage(seo.image)],
      ...(post
        ? {
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt,
            authors: [post.author],
            tags: post.keywords,
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

function postAuthor(post: BlogPost) {
  return { "@type": "Organization", name: post.author, url: SITE_URL };
}

function blogSchema() {
  return {
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    url: absoluteUrl("/blog"),
    name: BLOG_NAME,
    description: blogDescription,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en-GB",
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: postAuthor(post),
    })),
  };
}

function articleSchema(post: BlogPost, path: string) {
  return {
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(path)}#article`,
    mainEntityOfPage: absoluteUrl(path),
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(postImage(post).url),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: postAuthor(post),
    publisher: { "@id": ORGANIZATION_ID },
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    inLanguage: "en-GB",
  };
}

/** One JSON-LD graph per page: the site nodes, then what this route kind adds. */
export function buildJsonLd(seo: RouteSeo) {
  const graph: unknown[] = [organizationSchema(), websiteSchema()];

  if (seo.kind === "home") {
    graph.push(webAppSchema());
    if (APP_STORE_LIVE) graph.push(mobileAppSchema());
  }
  if (seo.kind === "blog") graph.push(blogSchema());
  if (seo.kind === "post" && seo.post)
    graph.push(articleSchema(seo.post, seo.path));
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
    ["blog"],
    ...BLOG_POSTS.map((post) => ["blog", post.slug]),
  ];
  return slugs.map((slug) => {
    const seo = getRouteSeo(slug);
    return { url: absoluteUrl(seo.path), lastModified: seo.lastModified };
  });
}
