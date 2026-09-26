// Pieces shared by /fells, the book hubs and the fell pages.

import Link from "next/link";

import {
  BOOKS,
  type Book,
  bookPath,
  fellsInBook,
  formatHeight,
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

/** The seven books as cards, each linking to its hub. */
export function BookCards({ current }: { current?: Book }) {
  return (
    <ol className="fl-books">
      {BOOKS.map((book) => {
        const fells = fellsInBook(book);
        const highest = fells.reduce((a, b) =>
          b.heightMetres > a.heightMetres ? b : a,
        );
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
