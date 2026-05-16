import type { Wainwright } from "./data/wainwrights";
import type { WainwrightPhotoMetadata } from "./photoCompression";

export type AlbumCompletionEntry = {
  completedAt?: string;
  id: string;
  note?: string;
  photos?: WainwrightPhotoMetadata[];
};

export type WainwrightAlbumItem = {
  completedAt: string;
  completedDateKey: string;
  entry: AlbumCompletionEntry;
  peak: Wainwright;
};

export type WainwrightAlbum = {
  dateKey: string;
  items: WainwrightAlbumItem[];
};

export const WHOLE_HISTORY_ALBUM = "whole-history";
export const INITIAL_VISIBLE_ALBUM_COUNT = 6;

function dateKeyFromCompletedAt(completedAt?: string) {
  if (!completedAt) return null;
  const recordedDate = completedAt.match(/^(\d{4}-\d{2}-\d{2})/);
  if (recordedDate) return recordedDate[1];
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function completionTime(item: WainwrightAlbumItem) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(item.completedAt)
    ? `${item.completedAt}T00:00:00`
    : item.completedAt;
  const time = new Date(normalized).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function buildWainwrightAlbums(
  peaks: Wainwright[],
  entries: AlbumCompletionEntry[],
): WainwrightAlbum[] {
  const peaksById = new Map(peaks.map((peak) => [peak.id, peak]));
  const albumsByDate = new Map<string, WainwrightAlbumItem[]>();

  for (const entry of entries) {
    const peak = peaksById.get(entry.id);
    const dateKey = dateKeyFromCompletedAt(entry.completedAt);
    if (!peak || !dateKey || !entry.completedAt) continue;
    const item: WainwrightAlbumItem = {
      completedAt: entry.completedAt,
      completedDateKey: dateKey,
      entry,
      peak,
    };
    const items = albumsByDate.get(dateKey) ?? [];
    items.push(item);
    albumsByDate.set(dateKey, items);
  }

  return Array.from(albumsByDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => ({
      dateKey,
      items: items.sort(
        (a, b) =>
          completionTime(a) - completionTime(b) ||
          a.peak.bookNumber - b.peak.bookNumber,
      ),
    }));
}

export function flattenAlbumsChronologically(albums: WainwrightAlbum[]) {
  return [...albums]
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .flatMap((album) => album.items);
}

export function getProgressivelyDisclosedAlbums(
  albums: WainwrightAlbum[],
  selectedAlbumKey: string,
  expanded: boolean,
  initialCount = INITIAL_VISIBLE_ALBUM_COUNT,
) {
  if (expanded || albums.length <= initialCount) return albums;

  const visible = albums.slice(0, initialCount);
  const selectedAlbum = albums.find((album) => album.dateKey === selectedAlbumKey);
  if (
    selectedAlbum &&
    !visible.some((album) => album.dateKey === selectedAlbum.dateKey)
  ) {
    return [...visible, selectedAlbum];
  }

  return visible;
}

export function formatAlbumDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
