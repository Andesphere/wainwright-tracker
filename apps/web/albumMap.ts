import type { WainwrightAlbumItem } from "./albums";

export type AlbumMapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type AlbumMapMarker = {
  index: number;
  latitude: number;
  longitude: number;
  name: string;
};

export function getAlbumMapBounds(
  items: WainwrightAlbumItem[],
  minSpan = 0.015,
): AlbumMapBounds | null {
  if (items.length === 0) return null;
  const latitudes = items.map((item) => item.peak.latitude);
  const longitudes = items.map((item) => item.peak.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latMid = (minLat + maxLat) / 2;
  const lngMid = (minLng + maxLng) / 2;
  const latSpan = Math.max(maxLat - minLat, minSpan);
  const lngSpan = Math.max(maxLng - minLng, minSpan);
  return {
    minLat: latMid - latSpan / 2,
    maxLat: latMid + latSpan / 2,
    minLng: lngMid - lngSpan / 2,
    maxLng: lngMid + lngSpan / 2,
  };
}

export function getAlbumMapMarkers(items: WainwrightAlbumItem[]): AlbumMapMarker[] {
  return items.map((item, index) => ({
    index: index + 1,
    latitude: item.peak.latitude,
    longitude: item.peak.longitude,
    name: item.peak.name,
  }));
}

export function buildMapPinsHtml(
  items: WainwrightAlbumItem[],
  pinClass = "map-pin",
) {
  if (items.length === 0) return "";
  const bounds = getAlbumMapBounds(items, 0.015);
  if (!bounds) return "";
  const latSpan = bounds.maxLat - bounds.minLat;
  const lngSpan = bounds.maxLng - bounds.minLng;

  return items
    .map((item, index) => {
      const left =
        8 + ((item.peak.longitude - bounds.minLng) / lngSpan) * 84;
      const top =
        88 - ((item.peak.latitude - bounds.minLat) / latSpan) * 76;
      const title = item.peak.name
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
      return `<span class="${pinClass}" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%" title="${title}">${index + 1}</span>`;
    })
    .join("");
}
