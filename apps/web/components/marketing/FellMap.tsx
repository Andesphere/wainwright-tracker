// FellMap — every Wainwright placed by its summit, over contour lines that
// were drawn from the same 214 heights (public/landing/lakeland-contours.svg).
// The bounds below are the ones that SVG was generated with; change both
// together or the dots drift off their hills.

import { WAINWRIGHTS } from "@wainwrights/catalog/wainwrights";

const LON_W = -3.5;
const LON_E = -2.69;
const LAT_S = 54.325;
const LAT_N = 54.755;
const WIDTH = 1000;
const HEIGHT = 914;

// Wainwright's seven Pictorial Guides, in book order, with a label spot
// just outside each group of fells.
export const BOOKS = [
  { area: "Eastern", word: "One", label: [676, 262] },
  { area: "Far Eastern", word: "Two", label: [838, 352] },
  { area: "Central", word: "Three", label: [522, 338] },
  { area: "Southern", word: "Four", label: [400, 858] },
  { area: "Northern", word: "Five", label: [490, 70] },
  { area: "North Western", word: "Six", label: [250, 190] },
  { area: "Western", word: "Seven", label: [150, 700] },
].map((book, index) => ({
  ...book,
  number: index + 1,
  count: WAINWRIGHTS.filter((fell) => fell.area === book.area).length,
}));

const bookNumber = (area: string) =>
  BOOKS.findIndex((book) => book.area === area) + 1;

const round = (value: number) => Math.round(value * 10) / 10;

export function FellMap() {
  return (
    <div className="fellmap">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Map of the ${WAINWRIGHTS.length} Wainwright fells, grouped into Wainwright's seven books`}
      >
        {WAINWRIGHTS.map((fell) => (
          <circle
            key={fell.id}
            className="fellmap-fell"
            data-book={bookNumber(fell.area)}
            cx={round(((fell.longitude - LON_W) / (LON_E - LON_W)) * WIDTH)}
            cy={round(((LAT_N - fell.latitude) / (LAT_N - LAT_S)) * HEIGHT)}
            r={7}
          >
            <title>{`${fell.name}, ${fell.heightMetres} m`}</title>
          </circle>
        ))}
        {BOOKS.map((book) => (
          <text
            key={book.area}
            className="fellmap-label"
            data-book={book.number}
            x={book.label[0]}
            y={book.label[1]}
          >
            {book.area}
          </text>
        ))}
      </svg>
    </div>
  );
}
