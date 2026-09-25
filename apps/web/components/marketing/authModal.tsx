"use client";

// Clerk's sign-in and sign-up modals for the server-rendered marketing pages.
// This module is only imported when a visitor clicks an auth CTA, so Clerk
// stays off the page until then. It mounts one ClerkProvider in its own root
// and reuses it for every later click.

import { ClerkProvider, useClerk } from "@clerk/clerk-react";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";

export type AuthModal = "signIn" | "signUp";

/** The modal asked for most recently; set before Clerk's root mounts. */
let requested: AuthModal | undefined;
/** Opens a modal once the Clerk root has mounted. */
let showModal: ((modal: AuthModal) => void) | undefined;

function ModalOpener() {
  const clerk = useClerk();
  useEffect(() => {
    // Clerk queues the call until clerk-js has loaded.
    showModal = (modal) =>
      modal === "signUp"
        ? clerk.openSignUp({
            forceRedirectUrl: "/app",
            signInForceRedirectUrl: "/app",
          })
        : clerk.openSignIn({
            forceRedirectUrl: "/app",
            signUpForceRedirectUrl: "/app",
          });
    if (requested) showModal(requested);
  }, [clerk]);
  return null;
}

export function openAuthModal(modal: AuthModal) {
  if (showModal) {
    showModal(modal);
    return;
  }
  const mounting = requested !== undefined;
  requested = modal;
  if (mounting) return;

  const host = document.createElement("div");
  document.body.append(host);
  createRoot(host).render(
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}
      afterSignOutUrl="/"
    >
      <ModalOpener />
    </ClerkProvider>,
  );
}
