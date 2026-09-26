import { describe, expect, it } from "vitest";

import { RELEASED_FELLS } from "@/content/fells/release";
import { ROUTE_STARTS } from "@/scripts/fell-routes/starts";
import { getFellText, parseFellText } from "@/lib/fellPages";
import { getFellRoute, ROUTE_IDS } from "@/lib/fellRoutes";
import { getRouteSeo } from "@/lib/seo";

/** Summit gaps, unconnected paths and a moved summit: walker check first (#47). */
const FLAGGED = [
  "great-end",
  "broom-fell",
  "shipman-knotts",
  "pavey-ark",
  "raven-crag",
  "low-fell",
  "fellbarrow-mosser-fell",
  "great-mell-fell",
  "bonscale-pike",
];

describe("the release list", () => {
  it("holds the first 20 and none of the nine flagged fells", () => {
    expect(RELEASED_FELLS).toHaveLength(20);
    for (const id of FLAGGED) {
      expect(RELEASED_FELLS).not.toContain(id);
      expect(getRouteSeo(["fells", id]).noIndex).toBe(true);
    }
  });

  it("has a route built for every released fell and no other", () => {
    expect([...ROUTE_IDS].sort()).toEqual([...RELEASED_FELLS].sort());
    expect(Object.keys(ROUTE_STARTS).sort()).toEqual(
      [...RELEASED_FELLS].sort(),
    );
  });

  it("gives each released fell 150 to 300 words and a unique description", () => {
    const texts = RELEASED_FELLS.map((id) => getFellText(id)!);
    for (const text of texts) {
      const words = text.paragraphs.join(" ").split(" ").length;
      expect(words).toBeGreaterThanOrEqual(150);
      expect(words).toBeLessThanOrEqual(300);
    }
    const descriptions = new Set(texts.map((text) => text.description));
    expect(descriptions.size).toBe(RELEASED_FELLS.length);
  });
});

describe("fell text files", () => {
  const body = Array.from({ length: 160 }, () => "word").join(" ");

  it("rejects a text outside 150 to 300 words", () => {
    const source = `---\ndescription: ${"d".repeat(90)}\nstart: Somewhere\nupdatedAt: 2026-09-26\n---\nToo short.\n`;
    expect(() => parseFellText("x", source)).toThrow(/150 to 300/);
  });

  it("rejects unknown front matter", () => {
    const source = `---\ndescription: ${"d".repeat(90)}\nstart: Somewhere\nupdatedAt: 2026-09-26\nview: lovely\n---\n${body}\n`;
    expect(() => parseFellText("x", source)).toThrow(/invalid front matter/);
  });

  it("splits the body into paragraphs", () => {
    const source = `---\ndescription: ${"d".repeat(90)}\nstart: Somewhere\nupdatedAt: 2026-09-26\n---\n${body}\n\nSecond\nparagraph.\n`;
    expect(parseFellText("x", source).paragraphs).toEqual([
      body,
      "Second paragraph.",
    ]);
  });
});

describe("route data", () => {
  it.each(RELEASED_FELLS)(
    "%s runs from its car park to near the summit",
    (id) => {
      const route = getFellRoute(id)!;
      expect(route.line.length).toBeGreaterThan(2);
      expect(route.distanceMetres).toBeGreaterThan(500);
      expect(route.checks.ascentMetres).toBeGreaterThan(0);
      expect(route.checks.summitGapMetres).toBeLessThan(30);
      expect(route.start.fee).not.toBeNull();
      expect(["private", "no", "customers"]).not.toContain(route.start.access);
      if (route.bus) expect(route.bus.services.length).toBeGreaterThan(0);
    },
  );
});
