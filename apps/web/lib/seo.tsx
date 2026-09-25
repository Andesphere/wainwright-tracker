import type { Metadata } from "next";
import type { BlogPost } from "@/content/blog/posts";
import { BLOG_POSTS, getBlogPost } from "@/content/blog/posts";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/appStore";

export const SITE_URL = "https://wainwrightsbaggers.com";
export const SITE_NAME = "Wainwrights Baggers";
export const DEFAULT_OG_IMAGE = "/wainwrights-214-og.jpg";
const DEFAULT_OG_IMAGE_ALT =
  "Bag all 214 Wainwrights: fells of the Lake District under a Wainwrights Baggers title card";

export type SeoRoute = "home" | "contact" | "blog" | "app" | "post";

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
  "Track all 214 Wainwright fells on a 3D Lake District map. Free on iPhone and the web, with your round in sync. Pro adds a photo journal.";

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
      imageAlt: DEFAULT_OG_IMAGE_ALT,
    };
  }

  if (path === "/contact") {
    return {
      route: "contact",
      path,
      title: "Contact Wainwrights Baggers",
      description:
        "Send a note to the people behind Wainwrights Baggers: questions about the tracker, the iPhone app, your account or a fell we got wrong.",
      image: DEFAULT_OG_IMAGE,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
    };
  }

  if (path === "/blog") {
    return {
      route: "blog",
      path,
      title: "Wainwright Walking Guides & Tracker Tips",
      description: blogDescription,
      image: DEFAULT_OG_IMAGE,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
    };
  }

  if (path === "/app") {
    return {
      route: "app",
      path,
      title: "Open the Wainwright Tracker",
      description: appDescription,
      image: DEFAULT_OG_IMAGE,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
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

  throw new Error(`No SEO route for ${path}`);
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
      images: [{ url: imageUrl, alt: seo.imageAlt }],
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
    ...(APP_STORE_LIVE ? { installUrl: APP_STORE_URL } : {}),
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

export function getIndexableBlogUrls() {
  return BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.publishedAt),
  }));
}
