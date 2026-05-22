"use client";

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Analytics } from "@vercel/analytics/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import {
  Component,
  StrictMode,
  useMemo,
  useSyncExternalStore,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const subscribeToClientSnapshot = () => () => {};

type ClientProvidersProps = {
  children: ReactNode;
};

type ErrorBoundaryState = { error: Error | null };

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <pre style={{ color: "#fff", padding: 24, whiteSpace: "pre-wrap" }}>
          {error.name}: {error.message}
          {"\n"}
          {error.stack}
        </pre>
      );
    }

    return this.props.children;
  }
}

function RequiredRuntimeProviders({ children }: ClientProvidersProps) {
  const convex = useMemo(() => {
    if (!convexUrl) return null;
    return new ConvexReactClient(convexUrl);
  }, []);

  if (!clerkPublishableKey) {
    if (typeof window === "undefined") return children;
    throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  if (!convex) {
    if (typeof window === "undefined") return children;
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const mounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    () => true,
    () => false,
  );

  return (
    <StrictMode>
      <ErrorBoundary>
        <RequiredRuntimeProviders>
          <TooltipProvider delayDuration={200}>
            {mounted ? <BrowserRouter>{children}</BrowserRouter> : null}
            <Analytics
              framework="react"
              scriptSrc="https://va.vercel-scripts.com/v1/script.js"
            />
          </TooltipProvider>
        </RequiredRuntimeProviders>
      </ErrorBoundary>
    </StrictMode>
  );
}
