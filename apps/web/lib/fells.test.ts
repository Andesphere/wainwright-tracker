import { describe, expect, it } from "vitest";

import {
  bookOf,
  formatGridReference,
  heightRank,
  ordinal,
  requireFell,
} from "@/lib/fells";

describe("fell facts", () => {
  it("ranks Scafell Pike first and Castle Crag last of 214", () => {
    expect(heightRank(requireFell("scafell-pike"))).toBe(1);
    expect(heightRank(requireFell("castle-crag"))).toBe(214);
  });

  it("puts a fell in its Pictorial Guide", () => {
    expect(bookOf(requireFell("catbells"))).toMatchObject({
      number: 6,
      title: "The North Western Fells",
    });
    expect(bookOf(requireFell("latrigg")).number).toBe(5);
  });

  it("spaces a grid reference", () => {
    expect(formatGridReference(requireFell("catbells"))).toMatch(
      /^NY \d{3} \d{3}$/,
    );
  });

  it("writes ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 112, 214].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "112th",
      "214th",
    ]);
  });

  it("fails on an unknown id", () => {
    expect(() => requireFell("nope")).toThrow('Unknown fell id "nope"');
  });
});
