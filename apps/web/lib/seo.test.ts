import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Author } from "@/content/authors";
import { BOOKS } from "@/lib/fells";
import { getGuides } from "@/lib/guides";
import {
  buildJsonLd,
  authorRouteSeo,
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
  ["guides"],
  ...getGuides().map((guide) => ["guides", guide.slug]),
  ["fells"],
  ...BOOKS.map((book) => ["fells", "books", book.slug]),
];
const ALL_PATHS = [...INDEXABLE_PATHS, ["app"], ["fells", "catbells"]];

type GraphNode = { "@type": string; [key: string]: unknown };
const graphOf = (slug: string[]) =>
  buildJsonLd(getRouteSeo(slug))["@graph"] as GraphNode[];
const typesOf = (slug: string[]) => graphOf(slug).map((node) => node["@type"]);

describe("titles and descriptions", () => {
  it("are unique across indexable pages", () => {
    const seos = INDEXABLE_PATHS.map((slug) => getRouteSeo(slug));
    expect(new Set(seos.map((seo) => seo.title)).size).toBe(seos.length);
    expect(new Set(seos.map((seo) => seo.description)).size).toBe(seos.length);
  });

  it("keeps unreleased fell pages out of the index", () => {
    expect(buildMetadata(getRouteSeo(["fells", "catbells"])).robots).toEqual(
      expect.objectContaining({ index: false, follow: true }),
    );
  });
});

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
    [["guides"], ["Organization", "WebSite", "Blog", "BreadcrumbList"]],
    [
      ["guides", "best-wainwright-app"],
      ["Organization", "WebSite", "BlogPosting", "BreadcrumbList"],
    ],
  ])("graph for /%s has %j", (slug, types) => {
    expect(typesOf(slug)).toEqual(types);
  });

  it.each([
    [["fells"], ["Organization", "WebSite", "ItemList", "BreadcrumbList"]],
    [
      ["fells", "books", "eastern-fells"],
      ["Organization", "WebSite", "ItemList", "BreadcrumbList"],
    ],
    [
      ["fells", "catbells"],
      ["Organization", "WebSite", "BreadcrumbList"],
    ],
  ])("graph for /%s has %j", (slug, types) => {
    expect(typesOf(slug)).toEqual(types);
  });

  type ItemList = {
    numberOfItems: number;
    itemListElement: { position: number; name: string; url: string }[];
  };
  const itemListOf = (slug: string[]) =>
    graphOf(slug).find(
      (node) => node["@type"] === "ItemList",
    ) as unknown as ItemList;

  it("lists all 214 fells on /fells, highest first, linking fell pages", () => {
    const list = itemListOf(["fells"]);
    expect(list.numberOfItems).toBe(214);
    expect(list.itemListElement).toHaveLength(214);
    expect(list.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Scafell Pike",
      url: "https://wainwrightsbaggers.com/fells/scafell-pike",
    });
    expect(list.itemListElement.at(-1)?.name).toBe("Castle Crag");
  });

  it("lists each book's fells in book order with the book's total", () => {
    expect(
      BOOKS.map(
        (book) => itemListOf(["fells", "books", book.slug]).numberOfItems,
      ),
    ).toEqual([35, 36, 27, 30, 24, 29, 33]);
    const eastern = itemListOf(["fells", "books", "eastern-fells"]);
    expect(eastern.itemListElement[0].name).toBe("Arnison Crag");
    expect(eastern.itemListElement.at(-1)?.name).toBe("White Side");
  });

  it("trails a book hub and a fell page back through /fells", () => {
    const trail = (slug: string[]) =>
      getRouteSeo(slug).breadcrumbs?.map((crumb) => crumb.path);
    expect(trail(["fells", "books", "north-western-fells"])).toEqual([
      "/",
      "/fells",
      "/fells/books/north-western-fells",
    ]);
    expect(trail(["fells", "catbells"])).toEqual([
      "/",
      "/fells",
      "/fells/books/north-western-fells",
      "/fells/catbells",
    ]);
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

  it("gives a guide a three-step trail and its real modified date", () => {
    const graph = graphOf(["guides", "easiest-wainwrights"]);
    const article = graph.find((node) => node["@type"] === "BlogPosting");
    expect(article).toMatchObject({
      headline: "The Easiest Wainwrights: Gentle First Fells for Beginners",
      datePublished: "2026-05-22",
      dateModified: "2026-09-26",
      author: { "@id": "https://wainwrightsbaggers.com/#organization" },
      image:
        "https://wainwrightsbaggers.com/images/guides/easiest-wainwrights-hero.jpg",
    });
    const trail = graph.find(
      (node) => node["@type"] === "BreadcrumbList",
    ) as unknown as {
      itemListElement: { name: string; item: string }[];
    };
    expect(trail.itemListElement.map((item) => item.item)).toEqual([
      "https://wainwrightsbaggers.com/",
      "https://wainwrightsbaggers.com/guides",
      "https://wainwrightsbaggers.com/guides/easiest-wainwrights",
    ]);
  });

  it("tags a guide as an article by its author, with its own card", () => {
    const metadata = buildMetadata(
      getRouteSeo(["guides", "easiest-wainwrights"]),
    );
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-05-22",
      modifiedTime: "2026-09-26",
      authors: ["Wainwrights Baggers"],
      images: [
        {
          url: "https://wainwrightsbaggers.com/images/guides/easiest-wainwrights-og.jpg",
        },
      ],
    });
  });

  describe("a person author", () => {
    const alex: Author = {
      slug: "alex-example",
      name: "Alex Example",
      kind: "person",
      role: "Fell walker",
      bio: ["Walks the fells."],
      portrait: {
        src: "/images/authors/alex-example/portrait.jpg",
        width: 800,
        height: 800,
        alt: "Alex on a summit",
      },
    };

    it("gets a profile page with a Person", () => {
      const graph = buildJsonLd(authorRouteSeo(alex))["@graph"] as GraphNode[];
      expect(graph.map((node) => node["@type"])).toEqual([
        "Organization",
        "WebSite",
        "ProfilePage",
        "BreadcrumbList",
      ]);
      expect(graph[2]).toMatchObject({
        url: "https://wainwrightsbaggers.com/guides/authors/alex-example",
        mainEntity: {
          "@type": "Person",
          name: "Alex Example",
          url: "https://wainwrightsbaggers.com/guides/authors/alex-example",
          image:
            "https://wainwrightsbaggers.com/images/authors/alex-example/portrait.jpg",
        },
      });
    });
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

    const guide = seo.buildJsonLd(
      seo.getRouteSeo(["guides", "best-wainwright-app"]),
    )["@graph"] as GraphNode[];
    expect(guide.map((node) => node["@type"])).not.toContain(
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

  it("dates a guide by its update and the hub by its newest guide", () => {
    const byUrl = new Map(
      sitemapEntries().map((entry) => [entry.url, entry.lastModified]),
    );
    expect(
      byUrl.get("https://wainwrightsbaggers.com/guides/best-wainwright-app"),
    ).toBe("2026-05-19");
    expect(byUrl.get("https://wainwrightsbaggers.com/guides")).toBe(
      "2026-09-26",
    );
  });

  it("leaves out the noindex tracker", () => {
    expect(sitemapEntries().map((entry) => entry.url)).not.toContain(
      "https://wainwrightsbaggers.com/app",
    );
  });

  it("leaves out fell pages until they are released", () => {
    const urls = sitemapEntries().map((entry) => entry.url);
    expect(urls.filter((url) => url.includes("/fells/"))).toEqual(
      BOOKS.map(
        (book) => `https://wainwrightsbaggers.com/fells/books/${book.slug}`,
      ),
    );
  });
});
