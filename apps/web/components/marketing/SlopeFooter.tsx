// SlopeFooter — single footer used across the marketing surface.
// Left column carries the brand mark + a quiet description; right column
// is metadata + small links. Visual styles live in styles/slope.css.

import { Link } from "react-router-dom";

import { APP_STORE_URL } from "@/lib/appStore";
import { SlopeMark } from "./SlopeMark";

type SlopeFooterProps = {
  signedIn?: boolean;
};

export function SlopeFooter({ signedIn = false }: SlopeFooterProps) {
  const year = new Date().getFullYear();
  // Where the right-hand link points: into the app when signed in,
  // otherwise back to the marketing home.
  const trackerHref = signedIn ? "/app" : "/";

  return (
    <footer className="slope-footer">
      <div className="slope-footer-l">
        <Link to="/" className="slope-brand" aria-label="Home">
          <SlopeMark />
        </Link>
        <p>
          A quiet companion for the long Wainwright round — kept simple, kept
          honest, written on the bothy table after the wind drops.
        </p>
      </div>
      <div className="slope-footer-r">
        <a href={APP_STORE_URL}>iPhone app</a>
        <Link to={trackerHref}>
          {signedIn ? "Open journal" : "The tracker"}
        </Link>
        <Link to="/blog">Field Notes</Link>
        <Link to="/contact">Contact</Link>
        <a href="/privacy">Privacy</a>
        <span>© {year} · made in the dales</span>
      </div>
    </footer>
  );
}
