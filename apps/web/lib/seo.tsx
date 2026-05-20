import type { Metadata } from "next";
import type { BlogPost } from "@/content/blog/posts";
import { BLOG_POSTS, getBlogPost } from "@/content/blog/posts";

export const SITE_URL = "https://wainwrightsbaggers.com";
export const SITE_NAME = "Wainwrights Baggers";
export const DEFAULT_OG_IMAGE = "/hero-slope.png";

export type SeoRoute = "home" | "blog" | "app" | "post" | "unknown";

export type RouteSeo = {
  route: SeoRoute;
  path: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  noIndex?: boolean;
  post?: BlogPost;
};

const homeDescription =
  "Track all 214 Wainwright fells with a quiet Lake District map, checklist, notes, photos and a private walking journal that syncs across devices.";

const blogDescription =
  "Wainwright walking guides, tracker tips, Lake District checklist advice and field notes for planning and remembering the 214 fells.";

const appDescription =
  "Open the Wainwrights Baggers tracker to mark completed fells, add notes and photos, and plan the rest of your Lake District round.";

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function normalizePath(slug?: string[]): string {
  if (!slug || slug.length === 0) return "/";
  return `/${slug.join("/")}`;
}

export function getRouteSeo(slug?: string[]): RouteSeo {
  const path = normalizePath(slug);

  if (path === "/") {
    return {
      route: "home",
      path,
      title: "Wainwrights Baggers | Map, Checklist & Journal for the 214 Fells",
      description: homeDescription,
      image: DEFAULT_OG_IMAGE,
      imageAlt: "Lake District fells above a Wainwright walking journal",
    };
  }

  if (path === "/blog") {
    return {
      route: "blog",
      path,
      title: "Wainwright Walking Guides & Tracker Tips",
      description: blogDescription,
      image: DEFAULT_OG_IMAGE,
      imageAlt: "Lake District fells and Wainwright walking notes",
    };
  }

  if (path === "/app") {
    return {
      route: "app",
      path,
      title: "Open the Wainwright Tracker",
      description: appDescription,
      image: DEFAULT_OG_IMAGE,
      imageAlt: "Interactive map for tracking Wainwright fells",
      noIndex: true,
    };
  }

  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const post = getBlogPost(blogMatch[1]);
    if (post) {
      return {
        route: "post",
        path,
        post,
        title: post.title,
        description: post.excerpt,
        image: post.ogImage || post.heroImage || DEFAULT_OG_IMAGE,
        imageAlt: post.heroImageAlt,
      };
    }
  }

  return {
    route: "unknown",
    path,
    title: "Wainwrights Baggers",
    description: homeDescription,
    image: DEFAULT_OG_IMAGE,
    imageAlt: "Lake District fells above a Wainwright walking journal",
    noIndex: true,
  };
}

export function buildMetadata(seo: RouteSeo): Metadata {
  const canonical = absoluteUrl(seo.path);
  const imageUrl = absoluteUrl(seo.image);
  const isArticle = seo.route === "post";

  return {
    metadataBase: new URL(SITE_URL),
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
    keywords: seo.post?.keywords ?? [
      "Wainwright tracker",
      "Wainwright app",
      "Wainwright checklist",
      "Lake District walking app",
      "Wainwright bagging",
      "214 Wainwrights",
    ],
    openGraph: {
      type: isArticle ? "article" : "website",
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: "en_GB",
      images: [
        {
          url: imageUrl,
          width: seo.image.endsWith("-og.jpg") ? 1200 : 1672,
          height: seo.image.endsWith("-og.jpg") ? 630 : 941,
          alt: seo.imageAlt,
        },
      ],
      ...(isArticle && seo.post
        ? {
            publishedTime: seo.post.publishedAt,
            authors: [seo.post.author],
            tags: seo.post.keywords,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [imageUrl],
    },
  };
}

function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
  };
}

function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: homeDescription,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-GB",
  };
}

function softwareSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: SITE_NAME,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web, iOS",
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: homeDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
  };
}

function breadcrumbSchema(seo: RouteSeo) {
  const items = [{ name: "Home", item: SITE_URL }];
  if (seo.route === "blog" || seo.route === "post") {
    items.push({ name: "Wainwright Journal", item: absoluteUrl("/blog") });
  }
  if (seo.route === "post" && seo.post) {
    items.push({ name: seo.post.title, item: absoluteUrl(seo.path) });
  }
  if (seo.route === "app") {
    items.push({ name: "Tracker", item: absoluteUrl("/app") });
  }

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function blogSchema() {
  return {
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    url: absoluteUrl("/blog"),
    name: "Wainwright Journal",
    description: blogDescription,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-GB",
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      author: { "@type": "Organization", name: post.author },
    })),
  };
}

function articleSchema(post: BlogPost, path: string) {
  const image = absoluteUrl(post.ogImage || post.heroImage || DEFAULT_OG_IMAGE);
  return {
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(path)}#article`,
    mainEntityOfPage: absoluteUrl(path),
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author,
      url: SITE_URL,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    inLanguage: "en-GB",
  };
}

export function buildJsonLd(seo: RouteSeo) {
  const graph: unknown[] = [
    organizationSchema(),
    websiteSchema(),
    breadcrumbSchema(seo),
  ];

  if (seo.route === "home") graph.push(softwareSchema());
  if (seo.route === "blog") graph.push(blogSchema());
  if (seo.route === "post" && seo.post)
    graph.push(articleSchema(seo.post, seo.path));

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fallbackHtml(seo: RouteSeo) {
  if (seo.route === "app") return "";

  if (seo.route === "post" && seo.post) {
    return `<main><article><h1>${escapeHtml(seo.post.title)}</h1><p>${escapeHtml(seo.post.excerpt)}</p><ul>${seo.post.keywords
      .map((keyword) => `<li>${escapeHtml(keyword)}</li>`)
      .join("")}</ul></article></main>`;
  }

  if (seo.route === "blog") {
    return `<main><h1>Wainwright walking guides and tracker tips</h1><p>${escapeHtml(blogDescription)}</p><ul>${BLOG_POSTS.map(
      (post) =>
        `<li><a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></li>`,
    ).join("")}</ul></main>`;
  }

  return `<main><h1>Wainwrights Baggers: map, checklist and journal for the 214 fells</h1><p>${escapeHtml(homeDescription)}</p><ul><li>Track every Wainwright fell on a Lake District map.</li><li>Keep notes, photos and completion dates in a private walking journal.</li><li>Use the blog for Wainwright checklist, map and app guidance.</li></ul></main>`;
}

export function SeoFallbackContent({ seo }: { seo: RouteSeo }) {
  const html = fallbackHtml(seo);
  if (!html) return null;
  return <noscript dangerouslySetInnerHTML={{ __html: html }} />;
}

export function getIndexableBlogUrls() {
  return BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.publishedAt),
  }));
}
