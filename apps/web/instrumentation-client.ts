import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

import {
  isSentryEnabled,
  sentryDsn,
  sentryEnvironment,
} from "./lib/sentry-env";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// Anonymous product analytics: nobody is identified, nothing is stored in the
// browser, and replays mask every input and every piece of text.
if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: "/pulse",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    persistence: "memory",
    session_recording: { maskAllInputs: true, maskTextSelector: "*" },
    debug: process.env.NODE_ENV === "development",
  });
  posthog.register({ app: "web" });
}

if (isSentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
