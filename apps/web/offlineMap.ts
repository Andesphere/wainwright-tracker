export const LAKE_DISTRICT_OFFLINE_BOUNDS = [
  -3.55, 54.25, -2.65, 54.8,
] as const;
export const LAKE_DISTRICT_MIN_ZOOM = 7;
export const LAKE_DISTRICT_MAX_ZOOM = 13;
export const LAKE_DISTRICT_TILE_CACHE = "wainwright-lake-district-topo-v1";
export const OPENTOPOMAP_TILE_TEMPLATE =
  "https://tile.opentopomap.org/{z}/{x}/{y}.png";

export type Bounds = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
];

export type TileRange = {
  z: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type OfflineMapEstimate = {
  bounds: Bounds;
  minZoom: number;
  maxZoom: number;
  tileCount: number;
};

export type DownloadProgress = {
  downloaded: number;
  total: number;
  failed: number;
};

function longitudeToTileX(longitude: number, zoom: number) {
  const tiles = 2 ** zoom;
  return Math.floor(((longitude + 180) / 360) * tiles);
}

function latitudeToTileY(latitude: number, zoom: number) {
  const tiles = 2 ** zoom;
  const radians = (latitude * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * tiles,
  );
}

export function tileRangeForBounds(bounds: Bounds, zoom: number): TileRange {
  const [west, south, east, north] = bounds;
  return {
    z: zoom,
    minX: longitudeToTileX(west, zoom),
    maxX: longitudeToTileX(east, zoom),
    minY: latitudeToTileY(north, zoom),
    maxY: latitudeToTileY(south, zoom),
  };
}

export function getLakeDistrictTileUrls(
  bounds: Bounds = LAKE_DISTRICT_OFFLINE_BOUNDS,
  minZoom = LAKE_DISTRICT_MIN_ZOOM,
  maxZoom = LAKE_DISTRICT_MAX_ZOOM,
) {
  const urls: string[] = [];
  for (let z = minZoom; z <= maxZoom; z += 1) {
    const range = tileRangeForBounds(bounds, z);
    for (let x = range.minX; x <= range.maxX; x += 1) {
      for (let y = range.minY; y <= range.maxY; y += 1) {
        urls.push(
          OPENTOPOMAP_TILE_TEMPLATE.replace("{z}", String(z))
            .replace("{x}", String(x))
            .replace("{y}", String(y)),
        );
      }
    }
  }
  return urls;
}

export function estimateLakeDistrictDownload(): OfflineMapEstimate {
  return {
    bounds: LAKE_DISTRICT_OFFLINE_BOUNDS,
    minZoom: LAKE_DISTRICT_MIN_ZOOM,
    maxZoom: LAKE_DISTRICT_MAX_ZOOM,
    tileCount: getLakeDistrictTileUrls().length,
  };
}

async function cacheTile(cache: Cache, url: string) {
  const request = new Request(url, { mode: "no-cors" });
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return;

  const response = await fetch(request);
  await cache.put(request, response.clone());
}

export async function downloadLakeDistrictMap(
  onProgress?: (progress: DownloadProgress) => void,
) {
  if (!("caches" in window)) {
    throw new Error("Offline map downloads are not supported in this browser.");
  }

  const urls = getLakeDistrictTileUrls();
  const cache = await caches.open(LAKE_DISTRICT_TILE_CACHE);
  const progress: DownloadProgress = {
    downloaded: 0,
    total: urls.length,
    failed: 0,
  };
  let nextIndex = 0;

  onProgress?.({ ...progress });

  async function worker() {
    while (nextIndex < urls.length) {
      const url = urls[nextIndex];
      nextIndex += 1;
      try {
        await cacheTile(cache, url);
      } catch {
        progress.failed += 1;
      } finally {
        progress.downloaded += 1;
        onProgress?.({ ...progress });
      }
    }
  }

  await Promise.all(Array.from({ length: 6 }, () => worker()));

  if (progress.failed > 0) {
    throw new Error(
      `${progress.failed} map tiles failed to download. Try again to fill the gaps.`,
    );
  }

  return progress;
}
