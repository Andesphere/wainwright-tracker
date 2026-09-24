// SlopeNav — the navbar shared between the landing hero and the blog pages.
// Two visual variants:
//   - "hero"  → sticky frosted glass over the landing (like the app's sheets)
//   - "solid" → paper background with a border (sits on a plain page)
//
// CTAs are wired through Clerk: when signedIn is false the right-hand
// button opens the sign-in modal; when true it deep-links to /app.

import { SignInButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

import { trackCtaClick, trackSignupClick } from "@/lib/analytics";
import { SlopeMark } from "./SlopeMark";

type SlopeNavProps = {
  signedIn?: boolean;
  /** Visual treatment — depends on what's behind the nav on this page. */
  variant?: "hero" | "solid";
};

export function SlopeNav({
  signedIn = false,
  variant = "solid",
}: SlopeNavProps) {
  // Right-hand button — Clerk sign-in modal, or deep-link into the tracker.
  const cta = signedIn ? (
    <Link
      to="/app"
      className="slope-nav-cta"
      onClick={() => trackCtaClick("nav", "Open journal")}
    >
      Open journal
    </Link>
  ) : (
    <SignInButton mode="modal">
      <button
        type="button"
        className="slope-nav-cta"
        onClick={() => trackSignupClick("nav", "Sign in")}
      >
        Sign in
      </button>
    </SignInButton>
  );

  return (
    <header className="slope-nav" data-variant={variant}>
      <Link
        to="/"
        className="slope-brand"
        aria-label="Wainwrights Baggers home"
      >
        <SlopeMark />
        <span className="slope-wordmark">Wainwrights Baggers</span>
      </Link>
      <nav className="slope-nav-links">
        {/* Hash links live on the landing, which scrolls to them. */}
        <Link to="/#iphone">The app</Link>
        <Link to="/#web">Web</Link>
        <Link to="/#pricing">Free and Pro</Link>
        <Link to="/blog">Field Notes</Link>
        <Link to="/contact">Contact</Link>
      </nav>
      {cta}
    </header>
  );
}
