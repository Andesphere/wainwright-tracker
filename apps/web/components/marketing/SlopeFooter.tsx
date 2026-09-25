// SlopeFooter — single footer used across the marketing surface.
// Left column carries the brand mark + a quiet description; right column
// is metadata + small links. Visual styles live in styles/slope.css.

import Link from "next/link";

import { APP_STORE_LIVE } from "@/lib/appStore";
import { AppStoreLink } from "./AppStoreLink";
import { FooterTrackerLink } from "./AuthCta";
import { SlopeMark } from "./SlopeMark";

export function SlopeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="slope-footer">
      <div className="slope-footer-l">
        <Link href="/" className="slope-brand" aria-label="Home">
          <SlopeMark />
        </Link>
        <p>
          A quiet companion for the long Wainwright round. Kept simple, kept
          honest, written on the bothy table after the wind drops.
        </p>
      </div>
      <div className="slope-footer-r">
        {APP_STORE_LIVE ? (
          <AppStoreLink location="footer">iPhone app</AppStoreLink>
        ) : (
          <span>iPhone app soon</span>
        )}
        <FooterTrackerLink />
        <Link href="/blog">Field Notes</Link>
        <Link href="/contact">Contact</Link>
        <a href="/privacy">Privacy</a>
        <span>© {year} · made in the dales</span>
      </div>
    </footer>
  );
}
