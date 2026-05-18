import { describe, expect, it } from "vitest";

import {
  buildWainwrightAlbums,
  flattenAlbumsChronologically,
  formatAlbumDateLabel,
  getProgressivelyDisclosedAlbums,
  type AlbumCompletionEntry,
} from "./albums";
import type { Wainwright } from "@wainwrights/catalog/wainwrights";

function fell(
  id: string,
  bookNumber: number,
  latitude: number,
  longitude: number,
): Wainwright {
  return {
    id,
    name: id,
    bookNumber,
    heightMetres: 500 + bookNumber,
    heightFt: Math.round((500 + bookNumber) * 3.28084),
    gridReference: "NY000000",
    gridZone: "NY",
    gridEast: 0,
    gridNorth: 0,
    area: "Eastern Fells",
    latitude,
    longitude,
  };
}

const fells = [
  fell("arnison", 1, 54.53, -2.93),
  fell("helvellyn", 2, 54.52, -3.02),
  fell("skiddaw", 3, 54.65, -3.15),
  fell("undated", 4, 54.42, -3.2),
];

const entries: AlbumCompletionEntry[] = [
  {
    id: "skiddaw",
    completedAt: "2024-05-02",
    photos: [
      {
        storageId: "s",
        url: "/skiddaw.jpg",
        originalName: "skiddaw",
        uploadedAt: "2024-05-02T12:00:00Z",
      },
    ],
  },
  { id: "arnison", completedAt: "2024-04-30" },
  { id: "helvellyn", completedAt: "2024-05-02T16:30:00Z" },
  { id: "undated" },
];

describe("Wainwright albums", () => {
  it("groups bagged fells by the calendar date they were bagged in reverse chronological album order", () => {
    const albums = buildWainwrightAlbums(fells, entries);

    expect(albums.map((album) => album.dateKey)).toEqual([
      "2024-05-02",
      "2024-04-30",
    ]);
    expect(albums[0].items.map((item) => item.peak.id)).toEqual([
      "skiddaw",
      "helvellyn",
    ]);
  });

  it("keeps a whole-history album in chronological order and excludes undated completions", () => {
    const albums = buildWainwrightAlbums(fells, entries);
    const wholeHistory = flattenAlbumsChronologically(albums);

    expect(wholeHistory.map((item) => item.peak.id)).toEqual([
      "arnison",
      "skiddaw",
      "helvellyn",
    ]);
    expect(wholeHistory.every((item) => item.completedDateKey)).toBe(true);
  });

  it("keeps timezone-offset timestamps grouped by their recorded calendar day", () => {
    const albums = buildWainwrightAlbums(fells, [
      { id: "arnison", completedAt: "2024-05-02T23:30:00-04:00" },
    ]);

    expect(albums.map((album) => album.dateKey)).toEqual(["2024-05-02"]);
  });

  it("formats album date labels for human-readable day picking", () => {
    expect(formatAlbumDateLabel("2024-05-02")).toBe("2 May 2024");
  });

  it("progressively discloses album buttons while preserving a selected older album", () => {
    const manyAlbums = Array.from({ length: 9 }, (_, index) => ({
      dateKey: `2024-05-${String(10 - index).padStart(2, "0")}`,
      items: [],
    }));

    expect(
      getProgressivelyDisclosedAlbums(
        manyAlbums,
        "whole-history",
        false,
        3,
      ).map((album) => album.dateKey),
    ).toEqual(["2024-05-10", "2024-05-09", "2024-05-08"]);

    expect(
      getProgressivelyDisclosedAlbums(manyAlbums, "2024-05-04", false, 3).map(
        (album) => album.dateKey,
      ),
    ).toEqual(["2024-05-10", "2024-05-09", "2024-05-08", "2024-05-04"]);

    expect(
      getProgressivelyDisclosedAlbums(manyAlbums, "2024-05-04", true, 3),
    ).toHaveLength(9);
  });
});
