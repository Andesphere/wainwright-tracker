// LandingPage — the public "/" route. Sells the iPhone app and the web
// tracker. Shares SlopeShell/SlopeNav/SlopeFooter with the blog; the
// landing's own styles are the "LANDING" block in styles/slope.css.
// Every product claim here must match docs/RELEASE.md.

import { SignUpButton } from "@clerk/clerk-react";
import Image from "next/image";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { AppStoreBadge } from "@/components/marketing/AppStoreBadge";
import { BOOKS, FellMap } from "@/components/marketing/FellMap";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { trackCtaClick, trackSignupClick } from "@/lib/analytics";

type LandingPageProps = {
  /** When true, CTAs deep-link into /app; otherwise they open Clerk modals. */
  signedIn?: boolean;
};

// Static content tables — kept up here so the JSX below stays scannable.
const MAP_POINTS = [
  "Terrain and contour lines",
  "Light that follows the time of day",
  "Every fell as a marker",
  "Your location on the map",
];

const FREE_FEATURES = [
  "The map, in 3D on iPhone",
  "All 214 fells",
  "Bagging with a date",
  "Sync between iPhone and the web",
  "Search and filters",
  "Progress by book",
];

const PRO_FEATURES = [
  "Photo journal: notes and photos for each fell",
  "Yearly albums, with print export",
  "Extra map layers: satellite and detailed contours",
  "Stats on your round",
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. The map, all 214 fells, bagging with a date, search, filters, progress by book and sync between iPhone and the web are free, and will stay free. Pro is optional.",
  },
  {
    q: "Is there an Android app?",
    a: "No, the app is for iPhone. On Android, or on any computer, use the tracker in your web browser.",
  },
  {
    q: "Can I download maps for offline use?",
    a: "Not yet. Offline maps are coming.",
  },
  {
    q: "How do I pay for Pro?",
    a: "Pro is a subscription you start in the iPhone app, paid through the App Store: £1.99 a month, or £14.99 a year with a 7-day free trial. You can cancel in your Apple account's subscription settings.",
  },
];

export function LandingPage({ signedIn = false }: LandingPageProps) {
  // Nav links are router links to "/#section", which the browser won't
  // scroll to by itself. The key changes on every click, so a second click
  // on the same link scrolls again.
  const { hash, key } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, key]);

  // "Open the journal" renders the same button whether the user is signed in
  // (Link to /app) or not (Clerk sign-up modal). Keeps the markup tidy.
  const journalCta = (location: string, tone: "moss" | "light" = "moss") => {
    const label = "Open the journal";
    const className = tone === "light" ? "lp-btn lp-btn-light" : "lp-btn";
    const trackClick = () => {
      trackCtaClick(location, label);
      if (!signedIn) trackSignupClick(location, label);
    };

    if (signedIn) {
      return (
        <Link to="/app" className={className} onClick={trackClick}>
          {label}
          <i className="btn-arr" aria-hidden />
        </Link>
      );
    }
    return (
      <SignUpButton mode="modal">
        <button type="button" className={className} onClick={trackClick}>
          {label}
          <i className="btn-arr" aria-hidden />
        </button>
      </SignUpButton>
    );
  };

  return (
    <SlopeShell signedIn={signedIn}>
      <SlopeNav signedIn={signedIn} variant="hero" />

      {/* ── HERO — the pitch beside the app itself, over contour lines drawn
              from the heights of the 214 fells */}
      <section className="lp-hero" aria-labelledby="lp-hero-title">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">For iPhone and the web</p>
            <h1 id="lp-hero-title" className="lp-h1">
              Your Wainwrights tracker, on a 3D map of the Lakes
            </h1>
            <p className="lp-lede">
              Bag all 214 fells with the date you walked them and watch your
              round fill in, book by book. Free, and in sync between your iPhone
              and the browser.
            </p>
            <div className="lp-actions">
              <AppStoreBadge location="home_hero" />
              {journalCta("home_hero")}
            </div>
            <p className="lp-note">Free forever. Pro from £1.99 a month.</p>
          </div>
          <div className="lp-hero-phone">
            <PhoneFrame
              src="/screens/ios/01-launch-overview.png"
              alt="The app's 3D map of the Lake District with every fell as a marker, a search bar and progress reading 2 of 214"
              sizes="(min-width: 960px) 320px, 250px"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── THE APP — two chapters, each a pair of real screenshots */}
      <section className="lp-app" id="iphone" aria-labelledby="lp-app-title">
        <div className="lp-wrap">
          <header className="lp-head">
            <p className="lp-eyebrow">The iPhone app</p>
            <h2 id="lp-app-title" className="lp-h2">
              A proper map of the Lakes, on your iPhone
            </h2>
            <p className="lp-sub">
              Built natively for iPhone, with every one of the 214 fells on a
              map that looks like the ground you walk.
            </p>
          </header>

          <article className="lp-chapter">
            <div className="lp-duo">
              <PhoneFrame
                src="/screens/ios/05-zoomed-3d.png"
                alt="The 3D map close in on Great Gable, with contour lines on its slopes"
                sizes="(min-width: 960px) 280px, 56vw"
              />
              <PhoneFrame
                src="/screens/ios/07-night-dark-mode.png"
                alt="The whole map at night, lit for the time of day, with the fells as pale markers"
                sizes="(min-width: 960px) 280px, 56vw"
              />
            </div>
            <div className="lp-chapter-copy">
              <h3 className="lp-h3">The Lakes in 3D</h3>
              <p>
                A full-screen map of the Lake District with terrain and contour
                lines, lit for the time of day. Every Wainwright is on it, and
                so are you.
              </p>
              <ul className="lp-ticks">
                {MAP_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="lp-chapter lp-chapter-flip">
            <div className="lp-duo">
              <PhoneFrame
                src="/screens/ios/02-fell-card.png"
                alt="Great Gable selected on the map, with a date walked and a Bag it button"
                sizes="(min-width: 960px) 280px, 56vw"
              />
              <PhoneFrame
                src="/screens/ios/06-bagged-card.png"
                alt="Skiddaw bagged: its marker has turned gold and the card reads 2 of 214 done"
                sizes="(min-width: 960px) 280px, 56vw"
              />
            </div>
            <div className="lp-chapter-copy">
              <h3 className="lp-h3">Tap a fell. Bag it.</h3>
              <p>
                Tap any fell and the map flies you there. Set the date you
                walked it, tap Bag it, and it joins your round on your iPhone
                and on the web.
              </p>
            </div>
          </article>

          <article className="lp-chapter">
            <div className="lp-solo">
              <PhoneFrame
                src="/screens/ios/03-medium-sheet-books.png"
                alt="The app's sheet with a search bar, progress for each book, filters for all, to go and bagged, and the list of fells"
                sizes="(min-width: 960px) 290px, 66vw"
              />
            </div>
            <div className="lp-chapter-copy">
              <h3 className="lp-h3">Book by book</h3>
              <p>
                Your progress is counted for each of Wainwright&apos;s seven
                books, from the Eastern Fells to the Western. Search all 214 by
                name, or show only the fells you still have to go.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* ── THE SEVEN BOOKS — every fell on the map; point at a book to find
              its fells */}
      <section className="lp-books" id="books" aria-labelledby="lp-books-title">
        <div className="lp-wrap lp-books-grid">
          <div className="lp-books-copy">
            <p className="lp-eyebrow">The seven books</p>
            <h2 id="lp-books-title" className="lp-h2">
              Seven books, 214 fells
            </h2>
            <p>
              Alfred Wainwright described the Lakeland fells in his seven
              Pictorial Guides, published between 1955 and 1966. Every dot on
              this map is one of them, placed at its summit.
            </p>
            <p className="lp-hint">Point at a book to light up its fells.</p>
          </div>
          <FellMap />
          <ol className="lp-booklist">
            {BOOKS.map((book) => (
              <li key={book.area} data-book={book.number}>
                <span className="lp-booklist-n">Book {book.word}</span>
                <span className="lp-booklist-name">The {book.area} Fells</span>
                <span className="lp-booklist-count">{book.count}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── WEB — the same account in the browser */}
      <section className="lp-web" id="web" aria-labelledby="lp-web-title">
        <div className="lp-wrap lp-web-grid">
          <div className="lp-web-copy">
            <p className="lp-eyebrow">In your browser</p>
            <h2 id="lp-web-title" className="lp-h2">
              The same round, on any computer
            </h2>
            <p>
              Open the tracker here at wainwrightsbaggers.com and sign in with
              the same account. Fells you bag on your iPhone show up in the
              browser, and the other way round. No iPhone? The web tracker works
              on its own.
            </p>
            {journalCta("home_web", "light")}
          </div>
          <SyncIllustration />
        </div>
      </section>

      {/* ── FREE AND PRO */}
      <section
        className="lp-pricing"
        id="pricing"
        aria-labelledby="lp-pricing-title"
      >
        <div className="lp-wrap">
          <header className="lp-head lp-head-center">
            <p className="lp-eyebrow">Free and Pro</p>
            <h2 id="lp-pricing-title" className="lp-h2">
              Free for the whole round
            </h2>
            <p className="lp-sub">
              Everything you need to track the 214 is free on iPhone and the
              web, and stays free. Pro adds a journal for the walks themselves.
            </p>
          </header>

          <div className="lp-plans">
            <article className="lp-plan">
              <h3 className="lp-plan-name">Free</h3>
              <p className="lp-plan-price">
                £0 <span>forever</span>
              </p>
              <ul className="lp-ticks">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>

            <article className="lp-plan lp-plan-pro">
              <h3 className="lp-plan-name">Pro</h3>
              <p className="lp-plan-price">
                £14.99 <span>a year</span>
              </p>
              <p className="lp-plan-alt">
                <span className="lp-chip">7-day free trial</span> or £1.99 a
                month
              </p>
              <ul className="lp-ticks">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className="lp-plan-note">
                Start Pro in the iPhone app. It&apos;s bought through the App
                Store.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── FAQ — native <details>, no script */}
      <section className="lp-faq" id="faq" aria-labelledby="lp-faq-title">
        <div className="lp-wrap lp-faq-grid">
          <h2 id="lp-faq-title" className="lp-h2">
            Good to know
          </h2>
          <div className="lp-faq-list">
            {FAQS.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSE — the old hero illustration, so the page ends on the fells
              and the dark foreground runs into the footer */}
      <section className="lp-close" aria-labelledby="lp-close-title">
        <div className="lp-wrap lp-close-copy">
          <h2 id="lp-close-title" className="lp-h2">
            Begin the round in your own time
          </h2>
          <p>
            214 fells, no deadline and no streaks. Just the date you stood on
            each top, kept on a map of the Lakes.
          </p>
          <div className="lp-actions lp-actions-center">
            <AppStoreBadge location="home_bottom" />
            {journalCta("home_bottom")}
          </div>
        </div>
        <div className="lp-close-art">
          <Image
            src="/hero-slope.png"
            alt=""
            fill
            sizes="100vw"
            className="lp-close-img"
          />
        </div>
      </section>
    </SlopeShell>
  );
}

/* A phone and a browser window sharing one bagged fell. Decorative. */
function SyncIllustration() {
  return (
    <svg viewBox="0 0 440 300" className="lp-sync" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* browser */}
        <rect x="8" y="30" width="300" height="210" rx="14" />
        <path d="M8 62h300" />
        <rect x="70" y="40" width="176" height="13" rx="6.5" opacity=".6" />
        <g opacity=".35">
          <path d="M40 200c40-50 70-20 110-60s80-30 120-10" />
          <path d="M40 222c46-44 82-10 124-46s72-24 116-6" />
          <path d="M60 110c30 20 60-12 96 6s50 30 90 8" />
        </g>
        {/* phone */}
        <rect x="318" y="86" width="112" height="206" rx="22" />
        <rect x="352" y="96" width="44" height="10" rx="5" opacity=".6" />
        <g opacity=".35">
          <path d="M328 238c24-30 44-8 64-30s24-10 30-4" />
          <path d="M328 256c26-26 48-4 70-24" />
        </g>
        {/* the sync between them */}
        <path d="M240 26c40-28 110-22 136 42" strokeDasharray="3 6" />
      </g>
      <g fill="currentColor" opacity=".7">
        <circle cx="30" cy="46" r="4" />
        <circle cx="44" cy="46" r="4" />
        <circle cx="96" cy="170" r="5" />
        <circle cx="210" cy="118" r="5" />
        <circle cx="250" cy="188" r="5" />
        <circle cx="352" cy="180" r="4.5" />
        <circle cx="404" cy="214" r="4.5" />
      </g>
      {/* the fell bagged in both places */}
      <g className="lp-sync-bagged">
        <circle cx="158" cy="142" r="13" />
        <circle cx="378" cy="150" r="11" />
        <path
          d="M151 142l5 5 9-10M372 150l4 4 8-9"
          fill="none"
          stroke="#112318"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
