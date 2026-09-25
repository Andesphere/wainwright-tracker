// SlopeNav — the navbar shared between the landing hero and the blog pages.
// Two visual variants:
//   - "solid" → paper background with a border (sits on a plain page)
//   - "plain" → transparent, dark text (sits on the cream landing hero)
//
// Server-rendered; only the right-hand auth button is a client island.

import Link from "next/link";

import { NavAuthCta } from "./AuthCta";
import { SlopeMark } from "./SlopeMark";

type SlopeNavProps = {
  /** Visual treatment — depends on what's behind the nav on this page. */
  variant?: "solid" | "plain";
};

export function SlopeNav({ variant = "solid" }: SlopeNavProps) {
  return (
    <header className="slope-nav" data-variant={variant}>
      <Link
        href="/"
        className="slope-brand"
        aria-label="Wainwrights Baggers home"
      >
        <SlopeMark />
        <span className="slope-wordmark">Wainwrights Baggers</span>
      </Link>
      <nav className="slope-nav-links">
        <Link href="/#map">The map</Link>
        <Link href="/#pricing">Free and Pro</Link>
        {/* The blog still runs in the client app: no prefetch of its code. */}
        <Link href="/blog" prefetch={false}>
          Field Notes
        </Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <NavAuthCta />
    </header>
  );
}
