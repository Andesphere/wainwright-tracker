// LandingPage — the public "/" route, rendered on the server.
// Sells the iPhone app and the web tracker in the app's own visual
// language: sage map greens, warm cream, a serif for titles, glass cards.
// Shares the Slope nav and footer with the guides; page-only styles live in
// styles/landing.css under the ld-* prefix. The journal CTAs are client
// islands (components/marketing/AuthCta.tsx).

import Link from "next/link";

import { AppStoreBadge } from "@/components/marketing/AppStoreBadge";
import { JournalCta } from "@/components/marketing/AuthCta";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { getGuides } from "@/lib/guides";

// Real captures from the iPhone app (apps/web/public/screens/ios).
const SCREENS = {
  overview: {
    src: "/screens/ios/01-launch-overview.png",
    alt: "The Wainwrights Baggers iPhone app: a 3D map of the Lake District with all 214 fells marked, a search bar and a progress ring reading 2 of 214.",
  },
  fellCard: {
    src: "/screens/ios/02-fell-card.png",
    alt: "Great Gable's card over the 3D map: height 899 m, Book Seven, ranked 7th by height, a date picker and a Bag it button.",
  },
  books: {
    src: "/screens/ios/03-medium-sheet-books.png",
    alt: "The sheet pulled up over the map, showing progress for each of the seven Pictorial Guide books and the list of all 214 fells.",
  },
  zoomed: {
    src: "/screens/ios/05-zoomed-3d.png",
    alt: "Zoomed in on Great Gable in 3D, with contour lines across the fellside and the fell card opening below.",
  },
  bagged: {
    src: "/screens/ios/06-bagged-card.png",
    alt: "Skiddaw bagged: its marker has turned orange with a tick and the card reads Bagged, 2 of 214 done.",
  },
  night: {
    src: "/screens/ios/07-night-dark-mode.png",
    alt: "The same map at night: dark terrain, pale markers for every fell and the progress card in dark mode.",
  },
};

const STATS = [
  { n: "214", l: "fells in the round" },
  { n: "vii", l: "Pictorial Guide books" },
  { n: "3D", l: "terrain and contour lines" },
  { n: "Free", l: "the map and the round, for good" },
];

const FREE_INCLUDES = [
  "The full 3D map",
  "All 214 fells",
  "Bagging with a date",
  "Sync between iPhone and web",
  "Search and filters",
  "Progress by book",
];

const PRO_INCLUDES = [
  "Photo journal: notes and photos for every fell",
  "Yearly albums, with print export",
  "Extra map layers: satellite and detailed contours",
  "Stats",
];

const PHONE_SIZES = "(min-width: 900px) 280px, 66vw";

export function LandingPage() {
  const notes = getGuides().slice(0, 3);
  return (
    <SlopeShell>
      {/* ── HERO — copy left, the app itself right */}
      <section className="ld-hero">
        <div className="ld-contours" aria-hidden />
        <SlopeNav variant="plain" />

        <div className="ld-wrap ld-hero-grid">
          <div className="ld-hero-copy">
            <p className="ld-kicker">For iPhone and the web</p>
            <h1 className="ld-h1">
              A <em>quiet</em> tracker for the 214 Wainwrights.
            </h1>
            <p className="ld-lede">
              Wainwrights Baggers is a map, checklist and journal for every fell
              in the Lake District. Tap a summit, bag it with a date, and watch
              the seven books fill in. Your round stays in step between your
              iPhone and the browser.
            </p>
            <div className="ld-cta-row">
              <AppStoreBadge location="home_hero" />
              <JournalCta label="Open the journal" location="home_hero" />
            </div>
            <p className="ld-fine">
              Free forever. Pro adds the photo journal and more, from £1.99 a
              month.
            </p>
          </div>

          <div className="ld-hero-phones">
            <PhoneFrame
              src={SCREENS.overview.src}
              alt={SCREENS.overview.alt}
              priority
              sizes="(min-width: 900px) 300px, 72vw"
            />
            <PhoneFrame
              src={SCREENS.fellCard.src}
              alt={SCREENS.fellCard.alt}
              sizes="(min-width: 900px) 260px, 0px"
              className="ld-hero-phone-2"
            />
          </div>
        </div>
      </section>

      {/* ── STRIP — four quiet figures */}
      <section className="ld-strip" aria-label="In brief">
        <dl className="ld-wrap ld-strip-grid">
          {STATS.map((s) => (
            <div key={s.n} className="ld-stat">
              <dt className="ld-stat-n">{s.n}</dt>
              <dd className="ld-stat-l">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── THE MAP */}
      <section className="ld-feature" id="map">
        <div className="ld-wrap ld-feature-grid">
          <div className="ld-feature-copy">
            <p className="ld-tag">The map</p>
            <h2 className="ld-h2">The Lake District in three dimensions.</h2>
            <p className="ld-p">
              The whole national park, full screen, with terrain, contour lines
              and the light of the hour. Every one of the 214 fells is a marker.
              Your own position is on there too, so you know which summit is the
              one in front of you.
            </p>
            <ul className="ld-list">
              <li>Tilt and turn the map, or flatten it to 2D</li>
              <li>Contours close enough to read the ridge</li>
              <li>Dusk on the map when it is dusk outside</li>
            </ul>
          </div>
          <div className="ld-rail">
            <PhoneFrame
              src={SCREENS.zoomed.src}
              alt={SCREENS.zoomed.alt}
              caption="Great Gable, up close."
              sizes={PHONE_SIZES}
            />
            <PhoneFrame
              src={SCREENS.night.src}
              alt={SCREENS.night.alt}
              caption="The same fells after dark."
              sizes={PHONE_SIZES}
            />
          </div>
        </div>
      </section>

      {/* ── BAGGING */}
      <section className="ld-feature ld-feature--flip" id="bag">
        <div className="ld-wrap ld-feature-grid">
          <div className="ld-feature-copy">
            <p className="ld-tag">Bagging</p>
            <h2 className="ld-h2">
              Tap a fell. Fly to it. Bag it with a date.
            </h2>
            <p className="ld-p">
              Each card gives the height, the book and the rank by height. Pick
              the day you walked it and the marker turns bracken orange. Tapped
              the wrong one? Mark it as not bagged.
            </p>
            <ul className="ld-list">
              <li>Height in metres and feet</li>
              <li>The Pictorial Guide book it belongs to</li>
              <li>Your count of the 214, updated as you go</li>
            </ul>
          </div>
          <div className="ld-rail">
            <PhoneFrame
              src={SCREENS.fellCard.src}
              alt={SCREENS.fellCard.alt}
              caption="Before: pick the date, bag it."
              sizes={PHONE_SIZES}
            />
            <PhoneFrame
              src={SCREENS.bagged.src}
              alt={SCREENS.bagged.alt}
              caption="After: Skiddaw, done."
              sizes={PHONE_SIZES}
            />
          </div>
        </div>
      </section>

      {/* ── THE SEVEN BOOKS */}
      <section className="ld-feature" id="books">
        <div className="ld-wrap ld-feature-grid">
          <div className="ld-feature-copy">
            <p className="ld-tag">Progress</p>
            <h2 className="ld-h2">Seven books, one round.</h2>
            <p className="ld-p">
              Progress counts by each of Wainwright&rsquo;s Pictorial Guides,
              from the Eastern Fells to the Western. Search all 214 by name, or
              filter to the ones still to go.
            </p>
            <ul className="ld-list">
              <li>A ring for each book, filling as you walk</li>
              <li>Search by name, filter by bagged or to go</li>
              <li>The full list, always a swipe away</li>
            </ul>
          </div>
          <div className="ld-rail ld-rail--one">
            <PhoneFrame
              src={SCREENS.books.src}
              alt={SCREENS.books.alt}
              caption="The seven books, and the list beneath."
              sizes={PHONE_SIZES}
            />
          </div>
        </div>
      </section>

      {/* ── IPHONE AND WEB */}
      <section className="ld-sync" id="web">
        <div className="ld-wrap">
          <div className="ld-sync-head">
            <p className="ld-tag">iPhone and web</p>
            <h2 className="ld-h2">Bag it on the hill. Write it up at home.</h2>
            <p className="ld-p">
              One account, one round. Whatever you bag on the iPhone is on the
              web when you get back, and the other way round.
            </p>
          </div>
          <div className="ld-ways">
            <article className="ld-way">
              <h3>On your iPhone</h3>
              <p>
                A native app built for the phone in your pocket: the 3D map,
                your location, and bagging with a date.
              </p>
              <AppStoreBadge location="home_ways" />
            </article>
            <article className="ld-way">
              <h3>In the browser</h3>
              <p>
                Sign in on any computer and the tracker opens on the same round.
                Nothing to install.
              </p>
              <JournalCta label="Open the journal" location="home_ways" />
            </article>
          </div>
        </div>
      </section>

      {/* ── PRICE */}
      <section className="ld-pricing" id="pricing">
        <div className="ld-wrap">
          <div className="ld-pricing-head">
            <p className="ld-tag">Price</p>
            <h2 className="ld-h2">
              Free forever. Pro if you want the journal.
            </h2>
          </div>
          <div className="ld-plans">
            <article className="ld-plan">
              <h3 className="ld-plan-name">Free</h3>
              <p className="ld-plan-price">
                <strong>£0</strong> for good
              </p>
              <ul className="ld-list">
                {FREE_INCLUDES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="ld-plan ld-plan--pro">
              <h3 className="ld-plan-name">Pro</h3>
              <p className="ld-plan-price">
                <strong>£1.99</strong> a month, or £14.99 a year with a 7-day
                free trial
              </p>
              <ul className="ld-list">
                {PRO_INCLUDES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="ld-plan-note">
                Bought in the App Store. Offline maps coming later.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── GUIDES — the newest three, from the MDX index */}
      <section className="ld-notes" aria-labelledby="ld-notes-h">
        <div className="ld-wrap">
          <div className="ld-notes-head">
            <h2 className="ld-h2 ld-h2--small" id="ld-notes-h">
              From the guides
            </h2>
            <Link href="/guides" className="ld-notes-all">
              All guides
            </Link>
          </div>
          <ul className="ld-notes-list">
            {notes.map((guide) => (
              <li key={guide.slug} className="ld-note">
                <Link href={`/guides/${guide.slug}`}>
                  <span className="ld-note-cat">{guide.category}</span>
                  <h3>{guide.title}</h3>
                  <p>{guide.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CLOSE */}
      <section className="ld-close">
        <div className="ld-contours" aria-hidden />
        <div className="ld-wrap ld-close-inner">
          <h2 className="ld-close-h">Begin the round in your own time.</h2>
          <p>
            Two hundred and fourteen fells. No streaks, no scores, no badge for
            finishing. Just a map, and a record you keep for as long as you
            walk.
          </p>
          <div className="ld-cta-row ld-cta-row--center">
            <AppStoreBadge location="home_bottom" />
            <JournalCta
              label="Open the journal"
              location="home_bottom"
              variant="light"
            />
          </div>
        </div>
      </section>
    </SlopeShell>
  );
}
