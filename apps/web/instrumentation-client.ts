import type * as SentryNext from "@sentry/nextjs";

import { setPosthog } from "./lib/analytics";
import {
  isSentryEnabled,
  sentryDsn,
  sentryEnvironment,
} from "./lib/sentry-env";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// The tracker needs replays from the first second. Marketing pages start
// Sentry and PostHog once the page is idle, without the session recorder or
// surveys, so their code never competes with the first paint.
const isTracker =
  location.pathname === "/app" || location.pathname.startsWith("/app/");

let sentry: typeof SentryNext | undefined;

async function startObservability() {
  if (isSentryEnabled) {
    sentry = await import("@sentry/nextjs");
    sentry.init({
      dsn: sentryDsn,
      environment: sentryEnvironment,
      sendDefaultPii: false,
    });
  }

  // Anonymous product analytics: nobody is identified, nothing is stored in
  // the browser, clicks are not autocaptured (their text can name other
  // walkers), and replays mask every input and every piece of text.
  if (posthogToken) {
    const { default: posthog } = await import("posthog-js");
    posthog.init(posthogToken, {
      api_host: "/pulse",
      ui_host: "https://us.posthog.com",
      defaults: "2026-05-30",
      person_profiles: "identified_only",
      persistence: "memory",
      autocapture: false,
      session_recording: { maskAllInputs: true, maskTextSelector: "*" },
      disable_session_recording: !isTracker,
      disable_surveys: !isTracker,
      debug: process.env.NODE_ENV === "development",
    });
    posthog.register({ app: "web" });
    setPosthog(posthog);
  }
}

function whenIdle(start: () => void) {
  const schedule = () =>
    "requestIdleCallback" in window
      ? requestIdleCallback(start, { timeout: 3000 })
      : setTimeout(start, 1000);
  if (document.readyState === "complete") schedule();
  else addEventListener("load", schedule, { once: true });
}

if (isTracker) void startObservability();
else whenIdle(() => void startObservability());

export const onRouterTransitionStart: typeof SentryNext.captureRouterTransitionStart =
  (href, navigationType) =>
    sentry?.captureRouterTransitionStart(href, navigationType);
