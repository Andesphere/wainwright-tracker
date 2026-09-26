import { describe, expect, it } from "vitest";

import { getGuide, getGuides, parseGuide, relatedGuides } from "@/lib/guides";

const valid = {
  title: "A guide to a gentle fell",
  description:
    "A description long enough for a search result snippet, about a gentle fell.",
  publishedAt: "2026-05-22",
  updatedAt: "2026-09-26",
  author: "wainwrights-baggers",
  category: "Beginner guide",
  primaryKeyword: "gentle fell",
  heroImage: "/images/guides/easiest-wainwrights-hero.jpg",
  heroImageAlt: "Boots and a map above a fell path",
  ogImage: "/images/guides/easiest-wainwrights-og.jpg",
  relatedFells: ["catbells"],
};

function source(frontMatter: Record<string, unknown>, body = "Text.\n") {
  const yaml = Object.entries(frontMatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
  return `---\n${yaml}\n---\n\n${body}`;
}

describe("guide front matter", () => {
  it("accepts a complete guide", () => {
    const guide = parseGuide(
      "gentle",
      source(valid, "## First\n\n## Second\n"),
    );
    expect(guide).toMatchObject({
      slug: "gentle",
      author: "wainwrights-baggers",
    });
    expect(guide.headings).toEqual([
      { id: "first", text: "First" },
      { id: "second", text: "Second" },
    ]);
  });

  it.each([
    ["a missing title", { title: undefined }, "title"],
    ["a bad date", { updatedAt: "26/09/2026" }, "updatedAt"],
    ["an update before publishing", { updatedAt: "2026-01-01" }, "updatedAt"],
    ["an unknown author", { author: "nobody" }, "unknown author"],
    ["an unknown fell", { relatedFells: ["not-a-fell"] }, "unknown fell id"],
    [
      "a missing image",
      { ogImage: "/images/guides/none.jpg" },
      "file not found",
    ],
    ["an unknown field", { keywords: ["x"] }, "keywords"],
  ])("rejects %s", (_, change, message) => {
    const frontMatter = { ...valid, ...change };
    expect(() => parseGuide("broken", source(frontMatter))).toThrow(message);
  });

  it("rejects a file without front matter", () => {
    expect(() => parseGuide("bare", "# Just text\n")).toThrow(
      "no front matter",
    );
  });
});

describe("the guides", () => {
  it("all parse, newest first, with a reading time", () => {
    const guides = getGuides();
    expect(guides.map((guide) => guide.slug)).toEqual([
      "easiest-wainwrights",
      "best-wainwright-app",
    ]);
    for (const guide of guides) {
      expect(guide.readMinutes).toBeGreaterThan(2);
      expect(guide.headings.length).toBeGreaterThan(2);
    }
  });

  it("link each guide to others", () => {
    const guide = getGuide("easiest-wainwrights")!;
    expect(relatedGuides(guide).map((other) => other.slug)).toEqual([
      "best-wainwright-app",
    ]);
  });
});
