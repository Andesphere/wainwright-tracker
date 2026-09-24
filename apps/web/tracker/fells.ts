import {
  TOTAL_WAINWRIGHTS,
  WAINWRIGHTS,
  type Wainwright,
} from "@wainwrights/catalog/wainwrights";

/** Wainwright's seven Pictorial Guides, in publication order. `area` in the catalogue is the book name. */
export const BOOKS = [
  { number: 1, name: "Eastern", ordinal: "One" },
  { number: 2, name: "Far Eastern", ordinal: "Two" },
  { number: 3, name: "Central", ordinal: "Three" },
  { number: 4, name: "Southern", ordinal: "Four" },
  { number: 5, name: "Northern", ordinal: "Five" },
  { number: 6, name: "North Western", ordinal: "Six" },
  { number: 7, name: "Western", ordinal: "Seven" },
] as const;

export type Book = (typeof BOOKS)[number];
export type StatusFilter = "all" | "toGo" | "bagged";

export const bookTitle = (book: Book) => `The ${book.name} Fells`;

export const bookOf = (fell: Wainwright): Book =>
  BOOKS.find((book) => book.name === fell.area) ?? BOOKS[6];

export const FELLS_BY_ID = new Map(WAINWRIGHTS.map((fell) => [fell.id, fell]));

export const FELLS_BY_BOOK = new Map(
  BOOKS.map((book) => [
    book.number,
    WAINWRIGHTS.filter((fell) => fell.area === book.name),
  ]),
);

export const ALPHABETICAL = [...WAINWRIGHTS].sort((a, b) =>
  a.name.localeCompare(b.name, "en-GB", { numeric: true }),
);

/** 1 is Scafell Pike. Ties keep catalogue order, like the iPhone app. */
export const HEIGHT_RANK = new Map(
  [...WAINWRIGHTS]
    .sort((a, b) => b.heightMetres - a.heightMetres)
    .map((fell, index) => [fell.id, index + 1]),
);

const metres = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 1,
  useGrouping: false,
});
const feet = new Intl.NumberFormat("en-GB");

/** "950 m", or "481.2 m" where the survey height has a decimal. */
export const heightLabel = (fell: Wainwright) =>
  `${metres.format(fell.heightMetres)} m`;

export const feetLabel = (fell: Wainwright) =>
  `${feet.format(fell.heightFt)} ft`;

const fold = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** The sheet's list: a search looks at every fell by name; otherwise the book and status filters apply. */
export function browseFells({
  bagged,
  book,
  query,
  status,
}: {
  bagged: Set<string>;
  book: Book | null;
  query: string;
  status: StatusFilter;
}) {
  const needle = fold(query.trim());
  return ALPHABETICAL.filter((fell) => {
    if (needle) return fold(fell.name).includes(needle);
    if (book && fell.area !== book.name) return false;
    if (status === "toGo") return !bagged.has(fell.id);
    if (status === "bagged") return bagged.has(fell.id);
    return true;
  });
}

export { TOTAL_WAINWRIGHTS, WAINWRIGHTS, type Wainwright };
