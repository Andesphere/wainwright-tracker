import { describe, expect, it } from "vitest";
import { computeStats, parseBagDate } from "./stats";

describe("stats", () => {
  it("reads calendar days and older ISO timestamps", () => {
    expect(parseBagDate("2025-08-09")?.getDate()).toBe(9);
    expect(parseBagDate("2025-08-09T10:00:00.000Z")?.getMonth()).toBe(7);
    expect(parseBagDate("not a date")).toBeNull();
    expect(parseBagDate(undefined)).toBeNull();
  });

  it("counts years, books and records from bagged fells", () => {
    const stats = computeStats([
      { completedAt: "2024-05-01", id: "helvellyn" },
      { completedAt: "2025-08-09", id: "scafell-pike" },
      { completedAt: "2025-09-01", id: "catbells" },
      { id: "skiddaw" },
    ]);

    expect(stats.bagged).toHaveLength(4);
    expect(stats.perYear).toEqual([
      { count: 1, year: 2024 },
      { count: 2, year: 2025 },
    ]);
    expect(stats.undated).toBe(1);
    expect(stats.highest?.id).toBe("scafell-pike");
    expect(stats.lowest?.id).toBe("catbells");
    expect(stats.first?.fell.id).toBe("helvellyn");
    expect(stats.latest?.fell.id).toBe("catbells");
    expect(stats.booksComplete).toBe(0);
    expect(stats.summitMetres).toBe(950 + 978 + 451 + 931);
    expect(stats.perBook.find((item) => item.book.name === "Eastern")).toEqual(
      expect.objectContaining({ done: 1, total: 35 }),
    );
  });
});
