"use client";

// The fell list on /fells and the book hubs. The server renders every row in
// the default order, so crawlers and no-JS readers get the whole list; the
// sort buttons only reorder the rows already there.

import Link from "next/link";
import { useState } from "react";

import type { FellRow } from "@/lib/fells";

type SortKey = "height" | "book" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "height", label: "Height" },
  { key: "book", label: "Book order" },
  { key: "name", label: "Name" },
];

const COMPARE: Record<SortKey, (a: FellRow, b: FellRow) => number> = {
  height: (a, b) => b.metres - a.metres || a.name.localeCompare(b.name),
  book: (a, b) => a.guideOrder - b.guideOrder,
  name: (a, b) => a.name.localeCompare(b.name),
};

type FellTableProps = {
  rows: FellRow[];
  defaultSort: SortKey;
  caption: string;
  /**
   * The all-214 list: a book column and height rank. Book hubs show each
   * fell's number in its book instead.
   */
  showBook?: boolean;
};

export function FellTable({
  rows,
  defaultSort,
  caption,
  showBook = false,
}: FellTableProps) {
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const sorted = [...rows].sort(COMPARE[sort]);
  const ariaSort = (key: SortKey) =>
    sort === key ? (key === "height" ? "descending" : "ascending") : undefined;

  return (
    <div className="fl-list">
      <div className="fl-sort" role="group" aria-label="Sort the list">
        <span className="fl-sort-label">Sort by</span>
        {SORTS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className="fl-sort-btn"
            aria-pressed={sort === key}
            onClick={() => setSort(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="fl-table-scroll">
        <table className="fl-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="fl-num">
                {showBook ? "Rank" : "No."}
              </th>
              <th scope="col" aria-sort={ariaSort("name")}>
                Fell
              </th>
              <th scope="col" className="fl-num" aria-sort={ariaSort("height")}>
                Metres
              </th>
              <th scope="col" className="fl-num">
                Feet
              </th>
              {showBook ? (
                <th scope="col" aria-sort={ariaSort("book")}>
                  Book
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id}>
                <td className="fl-num fl-quiet">
                  {showBook ? row.rank : row.position}
                </td>
                <th scope="row">
                  <Link href={`/fells/${row.id}`}>{row.name}</Link>
                </th>
                <td className="fl-num">{Math.round(row.metres)}</td>
                <td className="fl-num fl-quiet">
                  {row.feet.toLocaleString("en-GB")}
                </td>
                {showBook ? (
                  <td className="fl-book">
                    <span className="fl-book-n">{row.bookNumber}</span>
                    <span className="fl-book-t">{row.bookTitle}</span>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
