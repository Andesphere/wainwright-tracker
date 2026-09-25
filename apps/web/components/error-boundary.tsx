"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  label: string;
};

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundaryBase extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error(`${this.props.label} crashed`, error, errorInfo);
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryBase
      label="Wainwright tracker"
      fallback={
        <main className="grid min-h-dvh place-items-center bg-parchment px-6 text-center text-ink">
          <Card className="max-w-sm rounded-3xl border-border/70 bg-card/90 p-6 shadow-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              app error
            </p>
            <h1 className="mt-2 font-display text-4xl italic text-foreground">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The tracker hit a temporary problem. Refresh the page to try
              again.
            </p>
            <Button
              type="button"
              className="mt-5 rounded-full"
              onClick={() => window.location.reload()}
            >
              Reload app
            </Button>
          </Card>
        </main>
      }
    >
      {children}
    </ErrorBoundaryBase>
  );
}

export function FeatureErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryBase
      label="Wainwright tracker section"
      fallback={
        <div className="rounded-3xl border border-destructive/25 bg-destructive/5 p-5 text-center">
          <p className="font-semibold text-foreground">
            We could not load this section
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Close it and try again in a moment.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundaryBase>
  );
}
