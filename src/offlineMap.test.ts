import { describe, expect, it } from "vitest";

import {
  estimateLakeDistrictDownload,
  getLakeDistrictTileUrls,
  tileRangeForBounds,
} from "./offlineMap";

describe("offline Lake District map download planning", () => {
  it("covers the full Wainwright area with a bounded tile set", () => {
    const estimate = estimateLakeDistrictDownload();

    expect(estimate.bounds).toEqual([-3.55, 54.25, -2.65, 54.8]);
    expect(estimate.minZoom).toBe(7);
    expect(estimate.maxZoom).toBe(13);
    expect(estimate.tileCount).toBe(662);
  });

  it("generates OpenTopoMap tile URLs for every tile in the Lake District pack", () => {
    const urls = getLakeDistrictTileUrls();

    expect(urls).toHaveLength(662);
    expect(urls[0]).toBe("https://tile.opentopomap.org/7/62/40.png");
    expect(urls).toContain("https://tile.opentopomap.org/13/4035/2620.png");
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("calculates inclusive XYZ tile ranges for a bounding box", () => {
    expect(tileRangeForBounds([-3.55, 54.25, -2.65, 54.8], 10)).toEqual({
      z: 10,
      minX: 501,
      maxX: 504,
      minY: 324,
      maxY: 327,
    });
  });
});
