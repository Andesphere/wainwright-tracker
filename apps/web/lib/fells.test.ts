import { describe, expect, it } from "vitest";

import {
  BOOKS,
  bookOf,
  bookPosition,
  fellRow,
  fellsInBook,
  getBook,
  formatGridReference,
  heightRank,
  isThreeThousander,
  nearestFells,
  ordinal,
  requireFell,
} from "@/lib/fells";

describe("fell facts", () => {
  it("ranks Scafell Pike first and Castle Crag last of 214", () => {
    expect(heightRank(requireFell("scafell-pike"))).toBe(1);
    expect(heightRank(requireFell("castle-crag"))).toBe(214);
  });

  it("finds the five nearest summits, nearest first", () => {
    const near = nearestFells(requireFell("catbells"));
    expect(near).toHaveLength(5);
    expect(near[0].fell.id).toBe("maiden-moor");
    expect(near.map(({ fell }) => fell.id)).not.toContain("catbells");
    const distances = near.map(({ metres }) => metres);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it("counts four Wainwrights of 3,000 ft or more", () => {
    expect(
      ["scafell-pike", "scafell", "helvellyn", "skiddaw"].map((id) =>
        isThreeThousander(requireFell(id)),
      ),
    ).toEqual([true, true, true, true]);
    expect(isThreeThousander(requireFell("great-end"))).toBe(false);
  });

  it("puts a fell in its Pictorial Guide", () => {
    expect(bookOf(requireFell("catbells"))).toMatchObject({
      number: 6,
      title: "The North Western Fells",
    });
    expect(bookOf(requireFell("latrigg")).number).toBe(5);
  });

  it("puts 35, 36, 27, 30, 24, 29 and 33 fells in the seven books", () => {
    expect(BOOKS.map((book) => fellsInBook(book).length)).toEqual([
      35, 36, 27, 30, 24, 29, 33,
    ]);
  });

  it("numbers a fell within its book", () => {
    expect(bookPosition(requireFell("arnison-crag"))).toBe(1);
    expect(getBook("western-fells")).toBe(BOOKS[6]);
    expect(fellRow(requireFell("catbells"))).toMatchObject({
      bookNumber: 6,
      bookTitle: "The North Western Fells",
      position: bookPosition(requireFell("catbells")),
    });
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
