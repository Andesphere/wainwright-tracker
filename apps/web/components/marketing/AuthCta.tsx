"use client";

// Client islands for the auth-dependent bits of the marketing pages. The
// server renders the signed-out version; after hydration a signed-in visitor
// sees the link into /app instead. Clerk loads only when a button is clicked.

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { trackCtaClick, trackSignupClick } from "@/lib/analytics";
import type { AuthModal } from "./authModal";

// clerk-js keeps `__client_uat` (sometimes with a suffix) on the site's
// domain: "0" when signed out, the sign-in time when signed in. Reading it
// tells us the auth state without loading Clerk.
function readSignedIn() {
  return document.cookie
    .split("; ")
    .some((cookie) => /^__client_uat(_[^=]+)?=[1-9]/.test(cookie));
}

const noSubscribe = () => () => {};

function useSignedIn() {
  return useSyncExternalStore(noSubscribe, readSignedIn, () => false);
}

function openModal(modal: AuthModal) {
  void import("./authModal").then(({ openAuthModal }) => openAuthModal(modal));
}

/** "Open the journal": into /app when signed in, else Clerk's sign-up modal. */
export function JournalCta({
  label,
  location,
  className,
}: {
  label: string;
  location: string;
  className: string;
}) {
  const signedIn = useSignedIn();
  const onClick = () => {
    trackCtaClick(location, label);
    if (!signedIn) trackSignupClick(location, label);
  };

  if (signedIn) {
    return (
      <a href="/app" className={className} onClick={onClick}>
        {label}
        <i className="btn-arr" />
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick();
        openModal("signUp");
      }}
    >
      {label}
      <i className="btn-arr" />
    </button>
  );
}

/** The nav's right-hand button: "Open journal" or Clerk's sign-in modal. */
export function NavAuthCta() {
  const signedIn = useSignedIn();
  if (signedIn) {
    return (
      <a
        href="/app"
        className="slope-nav-cta"
        onClick={() => trackCtaClick("nav", "Open journal")}
      >
        Open journal
      </a>
    );
  }
  return (
    <button
      type="button"
      className="slope-nav-cta"
      onClick={() => {
        trackSignupClick("nav", "Sign in");
        openModal("signIn");
      }}
    >
      Sign in
    </button>
  );
}

/** The footer's tracker link: into /app when signed in, else home. */
export function FooterTrackerLink() {
  const signedIn = useSignedIn();
  return signedIn ? (
    <a href="/app">Open journal</a>
  ) : (
    <Link href="/">The tracker</Link>
  );
}
