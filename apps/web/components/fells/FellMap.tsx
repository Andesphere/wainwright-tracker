// A light map of the summits: one dot per fell, placed by latitude and
// longitude, the seven books labelled where their fells cluster. Plain SVG,
// rendered on the server, so it costs no script and no map tiles.

import { type Wainwright, WAINWRIGHTS } from "@wainwrights/catalog/wainwrights";

import { BOOKS, type Book, bookOf, fellsInBook } from "@/lib/fells";

const WIDTH = 1000;
const PAD = 40;
const LATS = WAINWRIGHTS.map((fell) => fell.latitude);
const LONS = WAINWRIGHTS.map((fell) => fell.longitude);
const [minLat, maxLat] = [Math.min(...LATS), Math.max(...LATS)];
const [minLon, maxLon] = [Math.min(...LONS), Math.max(...LONS)];
// Degrees of longitude shrink with latitude; scale them so the fells keep their shape.
const lonScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const scale = (WIDTH - PAD * 2) / ((maxLon - minLon) * lonScale);
const HEIGHT = Math.round((maxLat - minLat) * scale + PAD * 2);

function project(latitude: number, longitude: number) {
  return {
    x: PAD + (longitude - minLon) * lonScale * scale,
    y: PAD + (maxLat - latitude) * scale,
  };
}

function centre(book: Book) {
  const fells = fellsInBook(book);
  const mean = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  return project(
    mean(fells.map((fell) => fell.latitude)),
    mean(fells.map((fell) => fell.longitude)),
  );
}

/** All 214 summits; `highlight` picks out a book, `fell` a single summit. */
export function FellMap({
  highlight,
  fell,
}: {
  highlight?: Book;
  fell?: Wainwright;
}) {
  const label = fell
    ? `Map of the 214 Wainwright summits with ${fell.name} marked`
    : highlight
      ? `Map of the 214 Wainwright summits with the ${fellsInBook(highlight).length} fells of ${highlight.title} highlighted`
      : "Map of the 214 Wainwright summits, grouped into Wainwright's seven books";
  const marked = fell ? project(fell.latitude, fell.longitude) : null;

  return (
    <svg
      className="fl-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
    >
      {WAINWRIGHTS.map((other) => {
        if (other === fell) return null;
        const { x, y } = project(other.latitude, other.longitude);
        const on = !fell && (!highlight || bookOf(other) === highlight);
        return (
          <circle
            key={other.id}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={on ? 6 : 4}
            className={on ? "fl-dot" : "fl-dot fl-dot--off"}
          />
        );
      })}
      {BOOKS.map((book) => {
        const { x, y } = centre(book);
        const on = !fell && (!highlight || book === highlight);
        return (
          <text
            key={book.slug}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            className={on ? "fl-map-label" : "fl-map-label fl-map-label--off"}
            textAnchor="middle"
          >
            {book.number} · {book.area}
          </text>
        );
      })}
      {marked && fell ? (
        <g>
          <circle
            cx={marked.x.toFixed(1)}
            cy={marked.y.toFixed(1)}
            r={11}
            className="fl-dot fl-dot--this"
          />
          <text
            x={marked.x.toFixed(1)}
            y={(marked.y - 22).toFixed(1)}
            className="fl-map-label"
            textAnchor="middle"
          >
            {fell.name}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
