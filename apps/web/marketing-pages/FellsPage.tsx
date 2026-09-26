// FellsPage — /fells, all 214 Wainwrights: what they are, a map of every
// summit, the seven books and the full list, rendered on the server from the
// catalogue. Styles live in styles/fells.css under the fl- prefix.

import Link from "next/link";

import { FellMap } from "@/components/fells/FellMap";
import { FellTable } from "@/components/fells/FellTable";
import { BookCards, DataCredit } from "@/components/fells/FellsParts";
import { GuideBand } from "@/components/guides/GuideBand";
import { TrackerCta } from "@/components/guides/GuideComponents";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import {
  BOOKS,
  BY_HEIGHT,
  fellRow,
  fellsInBook,
  formatHeight,
} from "@/lib/fells";
import type { RouteSeo } from "@/lib/seo";

export function FellsPage({ seo }: { seo: RouteSeo }) {
  const fells = seo.fells ?? [];
  const highest = BY_HEIGHT[0];
  const lowest = BY_HEIGHT[BY_HEIGHT.length - 1];
  const counts = BOOKS.map(
    (book) => `${fellsInBook(book).length} in the ${book.area} Fells`,
  );

  return (
    <SlopeShell>
      <GuideBand crumbs={seo.breadcrumbs ?? []} variant="hub">
        <p className="ld-kicker">The full list</p>
        <h1 className="gd-h1">
          All {fells.length} Wainwrights: <em>list, map and heights</em>
        </h1>
        <p className="gd-dek">
          Every fell in Alfred Wainwright&rsquo;s seven Pictorial Guides, with
          its height, its book and where it stands.
        </p>
      </GuideBand>

      <div className="ld-wrap fl-page">
        <section className="fl-intro">
          <div>
            <h2 className="fl-h2">How many Wainwrights are there?</h2>
            <p>
              There are {fells.length}: {counts.slice(0, -1).join(", ")} and{" "}
              {counts[counts.length - 1]}.
            </p>
          </div>
          <div>
            <h2 className="fl-h2">What is a Wainwright?</h2>
            <p>
              A Wainwright is a Lake District fell with its own chapter in one
              of Alfred Wainwright&rsquo;s seven Pictorial Guides to the
              Lakeland Fells, published between 1955 and 1966. They run from{" "}
              {highest.name}, {formatHeight(highest)} and the highest ground in
              England, down to {lowest.name} at {formatHeight(lowest)}. Walkers
              who climb all {fells.length} have completed the Wainwrights.{" "}
              <Link href="/guides">More in the guides</Link>.
            </p>
          </div>
        </section>

        <section className="fl-atlas" aria-labelledby="fl-map-h">
          <figure className="fl-map-frame">
            <h2 className="fl-h2" id="fl-map-h">
              Map of the Wainwrights
            </h2>
            <FellMap />
            <figcaption>
              Every summit, placed by its grid reference. The numbers mark
              Wainwright&rsquo;s seven books, from the Eastern Fells (1) to the
              Western Fells (7).
            </figcaption>
          </figure>
          <div className="fl-atlas-books">
            <h2 className="fl-h2">The seven books</h2>
            <BookCards />
          </div>
        </section>

        <section aria-labelledby="fl-list-h">
          <h2 className="fl-h2" id="fl-list-h">
            The {fells.length} Wainwrights by height
          </h2>
          <FellTable
            rows={fells.map(fellRow)}
            defaultSort="height"
            caption={`All ${fells.length} Wainwrights with height in metres and feet and the book each is in`}
            showBook
          />
          <DataCredit />
        </section>

        <div className="fl-cta">
          <TrackerCta />
        </div>
      </div>
    </SlopeShell>
  );
}
