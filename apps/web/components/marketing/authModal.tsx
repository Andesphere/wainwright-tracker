"use client";

// Clerk's sign-in and sign-up modals for the server-rendered marketing pages.
// This module is only imported when a visitor clicks an auth CTA, so Clerk
// stays off the page until then. It mounts one ClerkProvider in its own root
// and reuses it for every later click.

import { ClerkProvider, useClerk } from "@clerk/clerk-react";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";

export type AuthModal = "signIn" | "signUp";

let open: ((modal: AuthModal) => void) | undefined;

function Opener({ initial }: { initial: AuthModal }) {
  const clerk = useClerk();
  useEffect(() => {
    // Clerk queues the call until clerk-js has loaded.
    open = (modal) =>
      modal === "signUp"
        ? clerk.openSignUp({
            forceRedirectUrl: "/app",
            signInForceRedirectUrl: "/app",
          })
        : clerk.openSignIn({
            forceRedirectUrl: "/app",
            signUpForceRedirectUrl: "/app",
          });
    open(initial);
  }, [clerk, initial]);
  return null;
}

export function openAuthModal(modal: AuthModal) {
  if (open) {
    open(modal);
    return;
  }
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey)
    throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  const host = document.createElement("div");
  document.body.append(host);
  createRoot(host).render(
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <Opener initial={modal} />
    </ClerkProvider>,
  );
}
