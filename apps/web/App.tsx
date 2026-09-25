"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { BlogPage } from "@/marketing-pages/BlogPage";
import { BlogPostPage } from "@/marketing-pages/BlogPostPage";
import { LandingPage } from "@/marketing-pages/LandingPage";
import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { TrackerApp } from "@/tracker/TrackerApp";

/** Marketing routes pass through Clerk sign-in state for header CTAs. */
function MarketingRoute({ page }: { page: "home" | "blog" | "post" }) {
  const { isSignedIn } = useAuth();
  const signedIn = isSignedIn ?? false;

  if (page === "home") return <LandingPage signedIn={signedIn} />;
  if (page === "blog") return <BlogPage signedIn={signedIn} />;
  return <BlogPostPage signedIn={signedIn} />;
}

function TrackerRoute() {
  return (
    <>
      <Authenticated>
        <TrackerApp />
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/" replace />
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
        <Route path="/" element={<MarketingRoute page="home" />} />
        <Route path="/contact" element={<ContactRoute />} />
        <Route path="/blog" element={<MarketingRoute page="blog" />} />
        <Route path="/blog/:slug" element={<MarketingRoute page="post" />} />
        <Route path="/app" element={<TrackerRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppErrorBoundary>
  );
}

function ContactRoute() {
  const { isSignedIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "sent" | "error"
  >("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    const response = await fetch("/api/relay/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        message,
        currentUrl: window.location.href,
      }),
    });

    if (response.ok) {
      setName("");
      setEmail("");
      setMessage("");
      setStatus("sent");
      return;
    }

    setStatus("error");
  };

  return (
    <SlopeShell signedIn={isSignedIn ?? false}>
      <section className="min-h-dvh bg-parchment px-4 py-8 text-ink">
        <SlopeNav signedIn={isSignedIn ?? false} variant="solid" />
        <div className="mx-auto grid max-w-3xl gap-6 pt-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              contact
            </p>
            <h1 className="mt-2 font-display text-5xl italic text-foreground">
              Send a note
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 rounded-3xl border border-border bg-card/80 p-5 shadow-sm"
          >
            <Input
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
            />
            <Input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
            />
            <Textarea
              required
              minLength={10}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What should we know?"
            />
            {status === "sent" ? (
              <p className="text-sm text-primary">
                Thanks, your note was sent.
              </p>
            ) : null}
            {status === "error" ? (
              <p className="text-sm text-destructive">
                We could not send that. Try again in a moment.
              </p>
            ) : null}
            <Button
              type="submit"
              className="justify-self-start rounded-full"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </SlopeShell>
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
