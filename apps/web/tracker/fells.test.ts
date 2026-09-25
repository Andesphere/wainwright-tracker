import { describe, expect, it } from "vitest";
import {
  BOOKS,
  FELLS_BY_BOOK,
  FELLS_BY_ID,
  HEIGHT_RANK,
  browseFells,
  feetLabel,
  heightLabel,
} from "./fells";

const fell = (id: string) => FELLS_BY_ID.get(id)!;

describe("fells", () => {
  it("puts every fell in one of the seven books", () => {
    const counts = BOOKS.map((book) => FELLS_BY_BOOK.get(book.number)?.length);
    expect(counts).toEqual([35, 36, 27, 30, 24, 29, 33]);
  });

  it("formats heights like the iPhone app", () => {
    expect(heightLabel(fell("helvellyn"))).toBe("950 m");
    expect(feetLabel(fell("helvellyn"))).toBe("3,117 ft");
  });

  it("ranks by height with Scafell Pike first", () => {
    expect(HEIGHT_RANK.get("scafell-pike")).toBe(1);
    expect(HEIGHT_RANK.get("helvellyn")).toBe(3);
  });

  it("searches every fell by name, ignoring the filters", () => {
    const results = browseFells({
      bagged: new Set(["helvellyn"]),
      book: BOOKS[6],
      query: "helv",
      status: "toGo",
    });
    expect(results.map((item) => item.id)).toEqual(["helvellyn"]);
  });

  it("filters by book and status when there is no search", () => {
    const bagged = new Set(["helvellyn", "catbells"]);
    const eastern = browseFells({
      bagged,
      book: BOOKS[0],
      query: "",
      status: "bagged",
    });
    expect(eastern.map((item) => item.id)).toEqual(["helvellyn"]);
    expect(
      browseFells({ bagged, book: null, query: "", status: "toGo" }),
    ).toHaveLength(212);
  });
});
