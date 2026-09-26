// Fell facts read from the catalogue, for guides and (later) fell pages.

import { type Wainwright, WAINWRIGHTS } from "@wainwrights/catalog/wainwrights";

/** The seven Pictorial Guides, in order; `area` in the catalogue is the book's area. */
export const BOOKS = [
  { number: 1, area: "Eastern", title: "The Eastern Fells" },
  { number: 2, area: "Far Eastern", title: "The Far Eastern Fells" },
  { number: 3, area: "Central", title: "The Central Fells" },
  { number: 4, area: "Southern", title: "The Southern Fells" },
  { number: 5, area: "Northern", title: "The Northern Fells" },
  { number: 6, area: "North Western", title: "The North Western Fells" },
  { number: 7, area: "Western", title: "The Western Fells" },
] as const;

export type Book = (typeof BOOKS)[number];

const BY_ID = new Map(WAINWRIGHTS.map((fell) => [fell.id, fell]));

const BY_HEIGHT = [...WAINWRIGHTS].sort(
  (a, b) => b.heightMetres - a.heightMetres,
);

export function getFell(id: string): Wainwright | undefined {
  return BY_ID.get(id);
}

/** A fell the caller knows exists; throws on an unknown id so a typo fails the build. */
export function requireFell(id: string): Wainwright {
  const fell = getFell(id);
  if (!fell) throw new Error(`Unknown fell id "${id}"`);
  return fell;
}

export function bookOf(fell: Wainwright): Book {
  const book = BOOKS.find((entry) => entry.area === fell.area);
  if (!book) throw new Error(`No book for area "${fell.area}"`);
  return book;
}

/** 1 for Scafell Pike, 214 for the lowest. Ties share the higher rank. */
export function heightRank(fell: Wainwright): number {
  return (
    BY_HEIGHT.findIndex((entry) => entry.heightMetres === fell.heightMetres) + 1
  );
}

export function formatHeight(fell: Wainwright): string {
  return `${Math.round(fell.heightMetres)} m`;
}

export function formatFeet(fell: Wainwright): string {
  return `${fell.heightFt.toLocaleString("en-GB")} ft`;
}

/** "NY 236 085" from "NY236085". */
export function formatGridReference(fell: Wainwright): string {
  const digits = fell.gridReference.slice(2);
  const half = digits.length / 2;
  return `${fell.gridReference.slice(0, 2)} ${digits.slice(0, half)} ${digits.slice(half)}`;
}

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
}
