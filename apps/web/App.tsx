"use client";

// The client-only app behind /app (the tracker) and, until the guides
// replace it, /blog. The public pages are server-rendered App Router routes.

import { SignIn, useAuth } from "@clerk/clerk-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Route, Routes } from "react-router-dom";

import { AppErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { BlogPage } from "@/marketing-pages/BlogPage";
import { BlogPostPage } from "@/marketing-pages/BlogPostPage";
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
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/app" element={<TrackerRoute />} />
      </Routes>
    </AppErrorBoundary>
  );
}

/** Signed-out visitors to /app sign in (or sign up) in place, then land in the tracker. */
function TrackerSignIn() {
  const { isSignedIn } = useAuth();
  // Signed in with Clerk while Convex still waits for its token: keep waiting.
  if (isSignedIn) return <LoadingGate />;
  return (
    <main className="grid min-h-dvh place-items-center bg-parchment p-5">
      <SignIn
        routing="hash"
        withSignUp
        forceRedirectUrl="/app"
        signUpForceRedirectUrl="/app"
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
