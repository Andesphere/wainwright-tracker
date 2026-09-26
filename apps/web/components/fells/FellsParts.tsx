// Pieces shared by /fells, the book hubs and the fell pages.

import Link from "next/link";

import {
  BOOKS,
  type Book,
  bookPath,
  fellsInBook,
  formatHeight,
  highestOf,
} from "@/lib/fells";

/** The data licence asks for this credit wherever the facts appear. */
export function DataCredit() {
  return (
    <p className="fl-credit">
      Heights, grid references and summit positions come from{" "}
      <a href="https://www.hills-database.co.uk/">
        The Database of British and Irish Hills
      </a>{" "}
      v17.4 via{" "}
      <a href="https://github.com/thomaswilsonxyz/wainwright-peaks">
        wainwright-peaks
      </a>
      , used under{" "}
      <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">
        CC BY 4.0
      </a>
      .
    </p>
  );
}

/**
 * The combined credit for a page with a route (research: fell-route-data.md):
 * each source and its licence, the OGL layers named separately from OSM.
 */
export function RouteCredits() {
  return (
    <div className="fl-credit fl-credits">
      <p>
        Map and route data ©{" "}
        <a href="https://www.openstreetmap.org/copyright">
          OpenStreetMap contributors
        </a>
        , ODbL.
      </p>
      <p>
        Heights along the route from OS Terrain 50. Contains OS data © Crown
        copyright and database right 2026.
      </p>
      <p>
        Contains public sector information licensed under the{" "}
        <a
          href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
          rel="license"
        >
          Open Government Licence v3.0
        </a>{" "}
        (NaPTAN, Bus Open Data Service, Lake District National Park Authority
        rights of way).
      </p>
      <p>
        Access land © Natural England copyright. Contains Ordnance Survey data ©
        Crown copyright and database right 2026.
      </p>
      <DataCredit />
    </div>
  );
}

/** The seven books as cards, each linking to its hub. */
export function BookCards({ current }: { current?: Book }) {
  return (
    <ol className="fl-books">
      {BOOKS.map((book) => {
        const fells = fellsInBook(book);
        const highest = highestOf(fells);
        return (
          <li key={book.slug}>
            <Link
              href={bookPath(book)}
              aria-current={book === current ? "page" : undefined}
            >
              <span className="fl-books-n">Book {book.number}</span>
              <span className="fl-books-title">{book.title}</span>
              <span className="fl-books-meta">
                {fells.length} fells · top {highest.name},{" "}
                {formatHeight(highest)}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
