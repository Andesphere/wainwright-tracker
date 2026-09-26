// BookPage — /fells/books/<book>, one of Wainwright's seven Pictorial Guides:
// its fells in book order, on the map among the rest. Styles: styles/fells.css.

import Link from "next/link";

import { FellMap } from "@/components/fells/FellMap";
import { FellTable } from "@/components/fells/FellTable";
import { BookCards, DataCredit } from "@/components/fells/FellsParts";
import { GuideBand } from "@/components/guides/GuideBand";
import { TrackerCta } from "@/components/guides/GuideComponents";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { type Book, fellPath, fellRow, formatHeight } from "@/lib/fells";
import type { RouteSeo } from "@/lib/seo";

export function BookPage({ seo }: { seo: RouteSeo & { book: Book } }) {
  const { book } = seo;
  const fells = seo.fells ?? [];
  const byHeight = [...fells].sort((a, b) => b.heightMetres - a.heightMetres);
  const highest = byHeight[0];
  const lowest = byHeight[byHeight.length - 1];

  return (
    <SlopeShell>
      <GuideBand crumbs={seo.breadcrumbs ?? []} variant="hub">
        <p className="ld-kicker">Book {book.number} of 7</p>
        <h1 className="gd-h1">
          The <em>{book.area}</em> Fells
        </h1>
        <p className="gd-dek">
          All {fells.length} Wainwrights in Book {book.number} of the Pictorial
          Guide to the Lakeland Fells, in the order the book lists them.
        </p>
      </GuideBand>

      <div className="ld-wrap fl-page">
        <dl className="fl-stats">
          <div>
            <dt>Fells</dt>
            <dd>{fells.length}</dd>
          </div>
          <div>
            <dt>Highest</dt>
            <dd>
              <Link href={fellPath(highest)}>{highest.name}</Link>
              <small>{formatHeight(highest)}</small>
            </dd>
          </div>
          <div>
            <dt>Lowest</dt>
            <dd>
              <Link href={fellPath(lowest)}>{lowest.name}</Link>
              <small>{formatHeight(lowest)}</small>
            </dd>
          </div>
        </dl>

        <section className="fl-atlas" aria-labelledby="fl-map-h">
          <figure className="fl-map-frame">
            <h2 className="fl-h2" id="fl-map-h">
              Where the {book.area} Fells lie
            </h2>
            <FellMap highlight={book} />
            <figcaption>
              The {fells.length} summits of Book {book.number} among all 214
              Wainwrights, placed by grid reference.
            </figcaption>
          </figure>
          <div className="fl-atlas-books">
            <h2 className="fl-h2">The seven books</h2>
            <BookCards current={book} />
          </div>
        </section>

        <section aria-labelledby="fl-list-h">
          <h2 className="fl-h2" id="fl-list-h">
            The {fells.length} fells in book order
          </h2>
          <FellTable
            rows={fells.map(fellRow)}
            defaultSort="book"
            caption={`The ${fells.length} Wainwrights in ${book.title}, in book order, with height in metres and feet`}
          />
          <p className="fl-more">
            <Link href="/fells">All 214 Wainwrights by height</Link>
          </p>
          <DataCredit />
        </section>

        <div className="fl-cta">
          <TrackerCta />
        </div>
      </div>
    </SlopeShell>
  );
}
