import { describe, expect, it } from "vitest";

import { sortWainwrightsForJournal, type JournalSort } from "./mapSorting";
import type { Wainwright } from "./data/wainwrights";

function fell(id: string, bookNumber: number, heightMetres = 500): Wainwright {
  return {
    id,
    name: id,
    bookNumber,
    heightMetres,
    heightFt: Math.round(heightMetres * 3.28084),
    gridReference: "NY000000",
    gridZone: "NY",
    gridEast: 0,
    gridNorth: 0,
    area: "Eastern Fells",
    latitude: 54.5,
    longitude: -3.1,
  };
}

const fells = [
  fell("alpha", 1, 400),
  fell("bravo", 2, 900),
  fell("charlie", 3, 700),
];
const entries = new Map([
  ["alpha", { id: "alpha", completedAt: "2024-05-02" }],
  ["charlie", { id: "charlie", completedAt: "2024-06-10" }],
]);
const completed = new Set(["alpha", "charlie"]);

describe("journal sorting", () => {
  it("keeps the default progress sort: to-go first, then book order", () => {
    expect(
      sortWainwrightsForJournal(fells, {
        completed,
        entriesById: entries,
        sortBy: "progress",
      }).map((peak) => peak.id),
    ).toEqual(["bravo", "alpha", "charlie"]);
  });

  it("sorts completed fells by newest bagged date first", () => {
    expect(
      sortWainwrightsForJournal(fells, {
        completed,
        entriesById: entries,
        sortBy: "date-desc",
      }).map((peak) => peak.id),
    ).toEqual(["charlie", "alpha", "bravo"]);
  });

  it("sorts completed fells by oldest bagged date first", () => {
    expect(
      sortWainwrightsForJournal(fells, {
        completed,
        entriesById: entries,
        sortBy: "date-asc",
      }).map((peak) => peak.id),
    ).toEqual(["alpha", "charlie", "bravo"]);
  });

  it("supports guidebook and height sort options for the visible filter bar", () => {
    const guideSort: JournalSort = "guide";
    const heightSort: JournalSort = "height-desc";

    expect(
      sortWainwrightsForJournal(fells, {
        completed,
        entriesById: entries,
        sortBy: guideSort,
      }).map((peak) => peak.id),
    ).toEqual(["alpha", "bravo", "charlie"]);
    expect(
      sortWainwrightsForJournal(fells, {
        completed,
        entriesById: entries,
        sortBy: heightSort,
      }).map((peak) => peak.id),
    ).toEqual(["bravo", "charlie", "alpha"]);
  });
});
