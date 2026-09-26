// FellPage — /fells/<id>. A placeholder until the fell pages ship (#31): the
// catalogue facts and the way back to the lists, marked noindex, so the links
// from /fells and the book hubs never land on a 404.

import Link from "next/link";
import type { Wainwright } from "@wainwrights/catalog/wainwrights";

import { DataCredit } from "@/components/fells/FellsParts";
import { GuideBand } from "@/components/guides/GuideBand";
import { FellFacts, TrackerCta } from "@/components/guides/GuideComponents";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { type Book, bookPath, bookPosition, fellsInBook } from "@/lib/fells";
import type { RouteSeo } from "@/lib/seo";

export function FellPage({
  seo,
}: {
  seo: RouteSeo & { fell: Wainwright; book: Book };
}) {
  const { fell, book } = seo;

  return (
    <SlopeShell>
      <GuideBand crumbs={seo.breadcrumbs ?? []}>
        <p className="ld-kicker">
          Book {book.number} · {book.title}
        </p>
        <h1 className="gd-h1">{fell.name}</h1>
        <p className="gd-dek">
          One of the 214 Wainwrights: number {bookPosition(fell)} of{" "}
          {fellsInBook(book).length} in {book.title}.
        </p>
      </GuideBand>

      <div className="gd-body gd-body--single">
        <article className="gd-prose">
          <FellFacts id={fell.id} />
          <p className="fl-more">
            <Link href={bookPath(book)}>All the fells in {book.title}</Link>
            <Link href="/fells">All 214 Wainwrights</Link>
          </p>
          <DataCredit />
          <TrackerCta />
        </article>
      </div>
    </SlopeShell>
  );
}
