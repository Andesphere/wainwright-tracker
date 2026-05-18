// LandingPage — the public "/" route.
// Uses the shared Slope layout (SlopeShell/SlopeNav/SlopeFooter) so the
// blog and the landing carry the exact same navbar, footer and palette.
// This file just describes the page-specific sections: hero, numbers,
// feature cards and the quiet bottom CTA.

import { SignUpButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";

type LandingPageProps = {
  /** When true, CTAs deep-link into /app; otherwise they open Clerk modals. */
  signedIn?: boolean;
};

// Static content tables — kept up here so the JSX below stays scannable.
const FEATURES = [
  {
    n: "01",
    t: "One Map.",
    d: "Every Wainwright plotted on a single Lake District atlas, ready to filter, search and pin.",
  },
  {
    n: "02",
    t: "Slow Journal.",
    d: "Mark each summit with a date, a note, and a photograph. Sync across phone and desktop, offline-first.",
  },
  {
    n: "03",
    t: "Albums by Year.",
    d: "Completions group themselves into chronological albums — chapters of your walking years.",
  },
];

const NUMBERS = [
  { n: "214", l: "summits in the round" },
  { n: "vii", l: "pictorial areas" },
  { n: "978", l: "metres at Scafell" },
];

export function LandingPage({ signedIn = false }: LandingPageProps) {
  // Primary CTA renders the same visual button whether the user is signed in
  // (Link to /app) or not (Clerk sign-up modal). Keeps the markup tidy.
  const primaryCta = (label: string, variant: "light" | "dark" = "light") => {
    const className =
      variant === "dark" ? "btn-pill btn-pill-light" : "btn-pill";
    if (signedIn) {
      return (
        <Link to="/app" className={className}>
          {label}
          <i className="btn-arr" />
        </Link>
      );
    }
    return (
      <SignUpButton mode="modal">
        <button type="button" className={className}>
          {label}
          <i className="btn-arr" />
        </button>
      </SignUpButton>
    );
  };

  return (
    <SlopeShell signedIn={signedIn}>
      {/* ── HERO — image fills the section, nav sits transparently over it */}
      <section className="hero">
        <img
          src="/hero-slope.png"
          alt="Lake District fells at midday"
          className="hero-illu"
        />
        {/* soft top-down gradient keeps light copy legible over pale sky */}
        <div className="hero-scrim" aria-hidden />

        <SlopeNav signedIn={signedIn} variant="hero" />

        <div className="hero-text">
          <p className="kicker">— a journal for the slow walker</p>
          <h1 className="hero-h">
            Walking <em>quietly</em>
            <br />
            through every fell.
          </h1>
          <p className="hero-lede">
            A field journal for the two hundred and fourteen Wainwrights — log
            your round on a map you can hold in your pocket, and watch the years
            gather, summit by summit.
          </p>
          <div className="hero-cta">
            {primaryCta("Open the journal")}
            <span className="hero-aside">
              free, forever &middot; no fitness scores
            </span>
          </div>
        </div>
      </section>

      {/* ── NUMBERS — quiet figures the round can be measured by */}
      <section className="numbers">
        {NUMBERS.map((n) => (
          <div key={n.n} className="num">
            <span className="num-n">{n.n}</span>
            <span className="num-l">{n.l}</span>
          </div>
        ))}
        <div className="num num-mini">
          <span className="num-l">
            recorded by walkers, since the spring of mmxxvi
          </span>
        </div>
      </section>

      {/* ── FEATURES — three cards, deliberately understated */}
      <section className="features" id="features">
        <header className="sec-head">
          <p className="sec-tag">— three things it does well</p>
          <h2 className="sec-h">
            A small, quiet tool
            <br />
            that respects your time on the hill.
          </h2>
        </header>

        <div className="feat-grid">
          {FEATURES.map((f) => (
            <article key={f.n} className="feat-card">
              <div className="feat-illu">
                <FeatureIllu n={f.n} />
              </div>
              <span className="feat-n">{f.n}</span>
              <h3 className="feat-t">{f.t}</h3>
              <p className="feat-d">{f.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── QUIET CTA — reuses the hero image, darkened, so the page closes
              on the same mountain it opened on */}
      <section className="quiet-cta" id="journal">
        <div className="quiet-cta-bg">
          <img src="/hero-slope.png" alt="" className="hero-illu" aria-hidden />
          <div className="hero-scrim hero-scrim-strong" aria-hidden />
        </div>
        <div className="quiet-cta-inner">
          <h2 className="quiet-h">
            Begin the round
            <br />
            in your own time.
          </h2>
          <p className="quiet-p">
            Two hundred and fourteen fells. No deadline, no streak, no badge for
            finishing. Just a journal you keep for as long as you walk.
          </p>
          {primaryCta("Open the journal", "dark")}
        </div>
      </section>
    </SlopeShell>
  );
}

/* ── Feature card illustrations ─────────────────────────────────────────
   Three tiny flat-vector vignettes that hint at the three features:
   01 — a contour map with a labelled summit pin
   02 — an open notebook
   03 — a fan of polaroid photographs
*/
function FeatureIllu({ n }: { n: string }) {
  if (n === "01") {
    return (
      <svg viewBox="0 0 120 80" className="f-illu" aria-hidden>
        <rect x="0" y="0" width="120" height="80" fill="#E8EDDC" />
        <g stroke="#3E6E54" strokeWidth="0.6" fill="none" opacity="0.7">
          <path d="M5 60 Q40 30 75 50 T115 40" />
          <path d="M5 65 Q40 38 75 55 T115 48" />
          <path d="M5 70 Q40 48 75 62 T115 56" />
        </g>
        <circle cx="55" cy="40" r="3" fill="#3E6E54" />
        <line
          x1="55"
          y1="40"
          x2="55"
          y2="18"
          stroke="#3E6E54"
          strokeWidth="1"
        />
        <rect x="55" y="10" width="40" height="10" fill="#3E6E54" />
        <text
          x="75"
          y="17.5"
          textAnchor="middle"
          fill="#E8EDDC"
          fontSize="6"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="500"
        >
          HELVELLYN
        </text>
      </svg>
    );
  }
  if (n === "02") {
    return (
      <svg viewBox="0 0 120 80" className="f-illu" aria-hidden>
        <rect x="0" y="0" width="120" height="80" fill="#E8EDDC" />
        <rect
          x="20"
          y="14"
          width="80"
          height="52"
          fill="#FAFAE8"
          stroke="#3E6E54"
          strokeWidth="0.8"
        />
        <line
          x1="34"
          y1="14"
          x2="34"
          y2="66"
          stroke="#3E6E54"
          strokeWidth="0.5"
        />
        {[24, 30, 36, 42, 48, 54].map((y, i) => (
          <line
            key={y}
            x1="40"
            y1={y}
            x2={92 - i * 4}
            y2={y}
            stroke="#3E6E54"
            strokeWidth="0.5"
            opacity="0.5"
          />
        ))}
        <circle cx="86" cy="58" r="4" fill="#3E6E54" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 80" className="f-illu" aria-hidden>
      <rect x="0" y="0" width="120" height="80" fill="#E8EDDC" />
      <g>
        <rect
          x="14"
          y="18"
          width="32"
          height="40"
          fill="#FAFAE8"
          stroke="#3E6E54"
          strokeWidth="0.8"
          transform="rotate(-8 30 38)"
        />
        <rect
          x="44"
          y="22"
          width="32"
          height="40"
          fill="#FAFAE8"
          stroke="#3E6E54"
          strokeWidth="0.8"
          transform="rotate(2 60 42)"
        />
        <rect
          x="74"
          y="18"
          width="32"
          height="40"
          fill="#FAFAE8"
          stroke="#3E6E54"
          strokeWidth="0.8"
          transform="rotate(7 90 38)"
        />
      </g>
    </svg>
  );
}
