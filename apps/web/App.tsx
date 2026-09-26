"use client";

// The client-only app behind /app: the tracker. Every public page is a
// server-rendered App Router route.

import { SignIn, useAuth } from "@clerk/clerk-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Route, Routes, useLocation } from "react-router-dom";

import { AppErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { TrackerApp } from "@/tracker/TrackerApp";

function TrackerRoute() {
  return (
    <>
      <Authenticated>
        <TrackerApp />
      </Authenticated>
      <Unauthenticated>
        <TrackerSignIn />
      </Unauthenticated>
      <AuthLoading>
        <LoadingGate />
      </AuthLoading>
      <Toaster richColors position="top-center" />
    </>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        <Route path="/app" element={<TrackerRoute />} />
      </Routes>
    </AppErrorBoundary>
  );
}

/**
 * Signed-out visitors to /app sign in (or sign up) in place, then land in the
 * tracker on the same URL, so /app?fell=<id> still opens that fell.
 */
function TrackerSignIn() {
  const { isSignedIn } = useAuth();
  const { search } = useLocation();
  // Signed in with Clerk while Convex still waits for its token: keep waiting.
  if (isSignedIn) return <LoadingGate />;
  return (
    <main className="grid min-h-dvh place-items-center bg-parchment p-5">
      <SignIn
        routing="hash"
        withSignUp
        forceRedirectUrl={`/app${search}`}
        signUpForceRedirectUrl={`/app${search}`}
      />
    </main>
  );
}

function LoadingGate() {
  return (
    <main className="grid min-h-dvh place-items-center bg-parchment p-5 text-ink">
      <div className="font-mono text-xs tracking-[0.22em] text-muted-foreground">
        loading journal
      </div>
    </main>
  );
}

export default App;
