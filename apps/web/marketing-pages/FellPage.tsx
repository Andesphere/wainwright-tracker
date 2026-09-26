// FellPage — /fells/<id>, one page per Wainwright. Every fell gets the
// catalogue facts, where it stands and its nearest neighbours. A released fell
// (content/fells/release.ts) also gets its desk-checked ascent: the route map,
// our own description and a free GPX. Styles: styles/fells.css (fl-) on the
// guides' long-read layout (gd-).

import Link from "next/link";
import type { Wainwright } from "@wainwrights/catalog/wainwrights";

import { FellMap } from "@/components/fells/FellMap";
import { DataCredit, RouteCredits } from "@/components/fells/FellsParts";
import { RouteMap } from "@/components/fells/RouteMap";
import { GuideBand } from "@/components/guides/GuideBand";
import { FellFacts, TrackerCta } from "@/components/guides/GuideComponents";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { formatDate } from "@/lib/dates";
import type { Ascent, FellText } from "@/lib/fellPages";
import {
  type FellRoute,
  feeText,
  formatDistance,
  formatKm,
  startName,
} from "@/lib/fellRoutes";
import {
  type Book,
  bookPath,
  bookPosition,
  fellPath,
  fellsInBook,
  formatHeight,
  isThreeThousander,
  nearestFells,
} from "@/lib/fells";
import { ODBL_URL, OSM_COPYRIGHT_URL } from "@/lib/gpx";
import type { RouteSeo } from "@/lib/seo";

type FellPageProps = {
  seo: RouteSeo & { fell: Wainwright; book: Book };
  /** Present for released fells only. */
  ascent?: Ascent;
};

export function FellPage({ seo, ascent }: FellPageProps) {
  const { fell, book } = seo;
  const position = bookPosition(fell);
  const count = fellsInBook(book).length;

  return (
    <SlopeShell>
      <GuideBand crumbs={seo.breadcrumbs ?? []}>
        <p className="ld-kicker">
          Book {book.number} · {book.title}
        </p>
        <h1 className="gd-h1">{fell.name}</h1>
        <p className="gd-dek">
          {ascent
            ? `A ${formatHeight(fell)} Wainwright in ${book.title}, with one desk-checked ascent from ${ascent.text.start}: ${formatKm(ascent.route.distanceMetres)} and ${ascent.route.checks.ascentMetres} m of climbing.`
            : `One of the 214 Wainwrights: number ${position} of ${count} in ${book.title}.`}
        </p>
      </GuideBand>

      <div className="gd-body gd-body--single">
        <article className="gd-prose">
          <FellFacts id={fell.id} />

          <h2>Is {fell.name} a Wainwright?</h2>
          <p>
            Yes. {fell.name} is one of the 214 Wainwrights: number {position} of{" "}
            {count} in Book {book.number}, {book.title}, of Alfred
            Wainwright&rsquo;s Pictorial Guide to the Lakeland Fells.
            {isThreeThousander(fell)
              ? ` At ${fell.heightFt.toLocaleString("en-GB")} ft it is one of only four Wainwrights over 3,000 ft.`
              : null}
          </p>

          {ascent ? <Ascent fell={fell} {...ascent} /> : null}

          <h2>Where {fell.name} stands</h2>
          <figure className="fl-map-frame fl-map-frame--fell">
            <FellMap fell={fell} />
            <figcaption>
              {fell.name} among all 214 Wainwright summits, each in its true
              position.
            </figcaption>
          </figure>

          <section className="gd-fells" aria-labelledby="fl-near-h">
            <h2 id="fl-near-h">Nearest Wainwrights</h2>
            <ul>
              {nearestFells(fell).map(({ fell: other, metres }) => (
                <li key={other.id}>
                  <strong>
                    <Link href={fellPath(other)}>{other.name}</Link>
                  </strong>
                  <span>
                    {formatKm(metres)} away · {formatHeight(other)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="fl-note">Straight-line distances between summits.</p>
          </section>

          <TrackerCta fell={fell} />

          <p className="fl-more">
            <Link href={bookPath(book)}>All the fells in {book.title}</Link>
            <Link href="/fells">All 214 Wainwrights</Link>
          </p>
          {ascent ? <RouteCredits /> : <DataCredit />}
        </article>
      </div>
    </SlopeShell>
  );
}

function Ascent({
  fell,
  route,
  text,
}: {
  fell: Wainwright;
  route: FellRoute;
  text: FellText;
}) {
  const { start, bus, checks } = route;
  return (
    <section className="fl-route" aria-labelledby="fl-route-h">
      <h2 id="fl-route-h">
        Climbing {fell.name} from {text.start}
      </h2>
      <p className="fl-status">
        <span className="fl-status-label">Desk-checked</span>
        <span>
          Checked against the map data on{" "}
          <time dateTime={checks.checkedOn}>
            {formatDate(checks.checkedOn)}
          </time>
          ; not yet walked for this page.
        </span>
        <Link href={`/contact?fell=${fell.id}`}>Report a problem</Link>
      </p>

      <aside className="gd-facts fl-route-facts" aria-label="Route facts">
        <dl className="gd-facts-grid">
          <div>
            <dt>Distance</dt>
            <dd>
              {formatKm(route.distanceMetres)}
              <small>one way, to the summit</small>
            </dd>
          </div>
          <div>
            <dt>Ascent</dt>
            <dd>
              {checks.ascentMetres} m
              <small>from {checks.startHeightMetres} m at the start</small>
            </dd>
          </div>
          <div>
            <dt>Parking</dt>
            <dd>
              {feeText(start)}
              <small>{startName(start)}</small>
            </dd>
          </div>
          <div>
            <dt>Bus</dt>
            <dd>
              {bus
                ? bus.services.map((service) => service.line).join(", ")
                : "None"}
              <small>
                {bus
                  ? `${bus.name} stop, ${bus.locality}: ${formatDistance(bus.distanceFromStartMetres)} from the start`
                  : "no stop with a current service within 6 km"}
              </small>
            </dd>
          </div>
        </dl>
        <p className="gd-facts-grid-ref">
          Bus services change with the seasons. Check the timetable before you
          travel.
        </p>
      </aside>

      <figure className="fl-map-frame fl-route-map">
        <RouteMap
          route={route}
          label={`Map of the ascent of ${fell.name} from ${text.start}`}
        />
        <figcaption>
          The route in green, from the car park (P) to the summit (triangle),
          with the bus stop (B) where it falls on the map and nearby Wainwrights
          as dots. Map data ©{" "}
          <a href={OSM_COPYRIGHT_URL}>OpenStreetMap contributors</a>.
        </figcaption>
      </figure>

      {text.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}

      <p className="fl-gpx">
        <a
          href={`${fellPath(fell)}/ascent.gpx`}
          download
          className="btn-pill btn-pill-light"
        >
          Download the GPX
          <i className="btn-arr" />
        </a>
        <span>
          Free. The route is © OpenStreetMap contributors and the file is
          released under the{" "}
          <a href={ODBL_URL} rel="license">
            Open Database Licence
          </a>
          : you may copy, share and adapt it.
        </span>
      </p>

      <aside className="gd-callout" aria-label="Safety">
        <p className="gd-callout-title">Before you go</p>
        <div className="gd-callout-body">
          <p>
            Mountain weather changes fast. Check the forecast for the fells,
            carry a map and compass and know how to use them, and turn back if
            conditions turn. This description and the GPX are a planning aid,
            not a substitute for navigation on the hill.
          </p>
        </div>
      </aside>
    </section>
  );
}
