import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BLOG_POSTS } from "@/content/blog/posts";
import {
  buildJsonLd,
  buildMetadata,
  DEFAULT_OG_IMAGE,
  defaultMetadata,
  getRouteSeo,
  LOGO,
  type OgImage,
  sitemapEntries,
} from "@/lib/seo";

const PUBLIC_DIR = path.join(__dirname, "..", "public");

/** Width, height and MIME type read from a PNG or JPEG file's header. */
function readImage(url: string) {
  const bytes = readFileSync(path.join(PUBLIC_DIR, url));
  if (bytes.subarray(1, 4).toString() === "PNG") {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      type: "image/png",
      size: bytes.length,
    };
  }
  // JPEG: walk the segments to the start-of-frame marker.
  let offset = 2;
  while (offset < bytes.length) {
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        width: bytes.readUInt16BE(offset + 7),
        height: bytes.readUInt16BE(offset + 5),
        type: "image/jpeg",
        size: bytes.length,
      };
    }
    offset += 2 + length;
  }
  throw new Error(`Not a PNG or JPEG: ${url}`);
}

const INDEXABLE_PATHS = [
  [],
  ["contact"],
  ["privacy"],
  ["blog"],
  ...BLOG_POSTS.map((post) => ["blog", post.slug]),
];
const ALL_PATHS = [...INDEXABLE_PATHS, ["app"]];

type GraphNode = { "@type": string; [key: string]: unknown };
const graphOf = (slug: string[]) =>
  buildJsonLd(getRouteSeo(slug))["@graph"] as GraphNode[];
const typesOf = (slug: string[]) => graphOf(slug).map((node) => node["@type"]);

describe("share cards", () => {
  const images = new Map<string, OgImage>(
    ALL_PATHS.map((slug) => {
      const { image } = getRouteSeo(slug);
      return [image.url, image];
    }),
  );

  it.each([...images.values()])(
    "$url has the size and type the tags claim, under 300 KB",
    (image) => {
      const file = readImage(image.url);
      expect(file).toMatchObject({
        width: image.width,
        height: image.height,
        type: image.type,
      });
      expect(file.size).toBeLessThan(300 * 1024);
      expect(image.width / image.height).toBeCloseTo(1.9, 1);
    },
  );

  it("emits width, height, type and alt for Open Graph and Twitter", () => {
    const metadata = buildMetadata(getRouteSeo(["privacy"]));
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://wainwrightsbaggers.com/wainwrights-214-og.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: DEFAULT_OG_IMAGE.alt,
      },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [{ alt: DEFAULT_OG_IMAGE.alt }],
    });
  });

  it("gives the root layout a default card", () => {
    const metadata = defaultMetadata();
    expect(metadata.openGraph?.images).toHaveLength(1);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("never emits a keywords meta", () => {
    for (const slug of ALL_PATHS) {
      expect(buildMetadata(getRouteSeo(slug))).not.toHaveProperty("keywords");
    }
  });
});

describe("structured data", () => {
  it("uses a square PNG logo of at least 112 px", () => {
    const file = readImage(LOGO.url);
    expect(file.type).toBe("image/png");
    expect(file.width).toBe(file.height);
    expect(file).toMatchObject({ width: LOGO.width, height: LOGO.height });
    expect(LOGO.width).toBeGreaterThanOrEqual(112);
  });

  it("names Andesphere Ltd as the parent organisation", () => {
    const organization = graphOf([]).find(
      (node) => node["@type"] === "Organization",
    );
    expect(organization).toMatchObject({
      parentOrganization: { name: "Andesphere Ltd" },
      logo: { url: "https://wainwrightsbaggers.com/logo-512.png" },
    });
  });

  it.each([
    [[], ["Organization", "WebSite", "WebApplication"]],
    [["contact"], ["Organization", "WebSite"]],
    [["privacy"], ["Organization", "WebSite"]],
    [["blog"], ["Organization", "WebSite", "Blog", "BreadcrumbList"]],
    [
      ["blog", "best-wainwright-app"],
      ["Organization", "WebSite", "BlogPosting", "BreadcrumbList"],
    ],
  ])("graph for /%s has %j", (slug, types) => {
    expect(typesOf(slug)).toEqual(types);
  });

  it("files the web app under Travel with a free offer and no rating", () => {
    const app = graphOf([]).find((node) => node["@type"] === "WebApplication");
    expect(app).toMatchObject({
      applicationCategory: "TravelApplication",
      offers: { price: "0", priceCurrency: "GBP" },
    });
    expect(app).not.toHaveProperty("aggregateRating");
  });

  it("keeps the App Store out of the graph before launch", () => {
    const json = JSON.stringify(buildJsonLd(getRouteSeo([])));
    expect(json).not.toContain("apps.apple.com");
    expect(json).not.toContain("MobileApplication");
  });

  it("gives a post a three-step trail and its real modified date", () => {
    const post = BLOG_POSTS.find(
      (entry) => entry.slug === "introducing-the-tracker",
    )!;
    const graph = graphOf(["blog", post.slug]);
    const article = graph.find((node) => node["@type"] === "BlogPosting");
    expect(article).toMatchObject({
      datePublished: "2026-05-18",
      dateModified: "2026-09-24",
    });
    const trail = graph.find(
      (node) => node["@type"] === "BreadcrumbList",
    ) as unknown as {
      itemListElement: { name: string; item: string }[];
    };
    expect(trail.itemListElement.map((item) => item.item)).toEqual([
      "https://wainwrightsbaggers.com/",
      "https://wainwrightsbaggers.com/blog",
      `https://wainwrightsbaggers.com/blog/${post.slug}`,
    ]);
  });
});

describe("launch day", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/appStore");
    vi.resetModules();
  });

  it("adds the iPhone app on the home page only, and sameAs", async () => {
    vi.resetModules();
    vi.doMock("@/lib/appStore", async (importOriginal) => ({
      ...(await importOriginal<typeof import("@/lib/appStore")>()),
      APP_STORE_LIVE: true,
    }));
    const seo = await import("@/lib/seo");
    const listing =
      "https://apps.apple.com/gb/app/wainwrights-baggers/id6771147426";

    const home = seo.buildJsonLd(seo.getRouteSeo([]))["@graph"] as GraphNode[];
    expect(home.find((node) => node["@type"] === "MobileApplication")).toEqual(
      expect.objectContaining({
        operatingSystem: "iOS",
        applicationCategory: "TravelApplication",
        installUrl: listing,
      }),
    );
    expect(home.find((node) => node["@type"] === "Organization")).toEqual(
      expect.objectContaining({ sameAs: [listing] }),
    );

    const post = seo.buildJsonLd(seo.getRouteSeo(["blog", BLOG_POSTS[0].slug]))[
      "@graph"
    ] as GraphNode[];
    expect(post.map((node) => node["@type"])).not.toContain(
      "MobileApplication",
    );
  });
});

describe("sitemap", () => {
  it("lists every indexable page once with a real content date", () => {
    const entries = sitemapEntries();
    expect(entries.map((entry) => entry.url)).toEqual(
      INDEXABLE_PATHS.map(
        (slug) => `https://wainwrightsbaggers.com/${slug.join("/")}`,
      ),
    );
    for (const entry of entries) {
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry).not.toHaveProperty("changeFrequency");
      expect(entry).not.toHaveProperty("priority");
    }
  });

  it("dates a post by its update and the blog by its newest post", () => {
    const byUrl = new Map(
      sitemapEntries().map((entry) => [entry.url, entry.lastModified]),
    );
    expect(
      byUrl.get("https://wainwrightsbaggers.com/blog/introducing-the-tracker"),
    ).toBe("2026-09-24");
    expect(byUrl.get("https://wainwrightsbaggers.com/blog")).toBe("2026-09-24");
  });

  it("leaves out the noindex tracker", () => {
    expect(sitemapEntries().map((entry) => entry.url)).not.toContain(
      "https://wainwrightsbaggers.com/app",
    );
  });
});
