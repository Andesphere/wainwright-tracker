import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Component, type ErrorInfo, type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL");
}

const convex = new ConvexReactClient(convexUrl);

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
          {error.name}: {error.message}\n{error.stack}
        </pre>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ErrorBoundary>
          <TooltipProvider delayDuration={200}>
            <App />
          </TooltipProvider>
        </ErrorBoundary>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
);

registerSW({ immediate: true });
