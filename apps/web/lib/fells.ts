// Fell facts read from the catalogue, for guides, the fell hubs and fell pages.

import { type Wainwright, WAINWRIGHTS } from "@wainwrights/catalog/wainwrights";

/** The seven Pictorial Guides, in order; `area` in the catalogue is the book's area. */
export const BOOKS = [
  {
    number: 1,
    area: "Eastern",
    title: "The Eastern Fells",
    slug: "eastern-fells",
  },
  {
    number: 2,
    area: "Far Eastern",
    title: "The Far Eastern Fells",
    slug: "far-eastern-fells",
  },
  {
    number: 3,
    area: "Central",
    title: "The Central Fells",
    slug: "central-fells",
  },
  {
    number: 4,
    area: "Southern",
    title: "The Southern Fells",
    slug: "southern-fells",
  },
  {
    number: 5,
    area: "Northern",
    title: "The Northern Fells",
    slug: "northern-fells",
  },
  {
    number: 6,
    area: "North Western",
    title: "The North Western Fells",
    slug: "north-western-fells",
  },
  {
    number: 7,
    area: "Western",
    title: "The Western Fells",
    slug: "western-fells",
  },
] as const;

export type Book = (typeof BOOKS)[number];

const BY_ID = new Map(WAINWRIGHTS.map((fell) => [fell.id, fell]));

/** Highest first; equal heights by name. The default order of the /fells list. */
export const BY_HEIGHT = [...WAINWRIGHTS].sort(
  (a, b) => b.heightMetres - a.heightMetres || a.name.localeCompare(b.name),
);

/** Book 1's first fell to Book 7's last: the order of the Pictorial Guides. */
const BY_BOOK = [...WAINWRIGHTS].sort((a, b) => a.bookNumber - b.bookNumber);

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

export function getBook(slug: string): Book | undefined {
  return BOOKS.find((book) => book.slug === slug);
}

export function bookPath(book: Book): string {
  return `/fells/books/${book.slug}`;
}

export function fellPath(fell: Wainwright): string {
  return `/fells/${fell.id}`;
}

/** A book's fells in the order the book lists them. */
export function fellsInBook(book: Book): Wainwright[] {
  return BY_BOOK.filter((fell) => fell.area === book.area);
}

/** The highest of some fells. */
export function highestOf(fells: Wainwright[]): Wainwright {
  return fells.reduce((a, b) => (b.heightMetres > a.heightMetres ? b : a));
}

/** The lowest of some fells. */
export function lowestOf(fells: Wainwright[]): Wainwright {
  return fells.reduce((a, b) => (b.heightMetres < a.heightMetres ? b : a));
}

/** 1 for the first fell in its book. */
export function bookPosition(fell: Wainwright): number {
  return fellsInBook(bookOf(fell)).indexOf(fell) + 1;
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

/** What the fell list needs of each fell; plain data, so it can cross to the client. */
export type FellRow = {
  id: string;
  name: string;
  /** As surveyed, to a decimal; shown rounded. */
  metres: number;
  feet: number;
  bookNumber: number;
  bookTitle: string;
  /** Number in its book, 1 for the book's first fell. */
  position: number;
  /** Place in book order across all seven books, 1 to 214. */
  guideOrder: number;
  /** Height rank, 1 for Scafell Pike. */
  rank: number;
};

export function fellRow(fell: Wainwright): FellRow {
  const book = bookOf(fell);
  return {
    id: fell.id,
    name: fell.name,
    metres: fell.heightMetres,
    feet: fell.heightFt,
    bookNumber: book.number,
    bookTitle: book.title,
    position: bookPosition(fell),
    guideOrder: fell.bookNumber,
    rank: heightRank(fell),
  };
}
