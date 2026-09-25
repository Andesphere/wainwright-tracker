import * as Sentry from "@sentry/nextjs";

import {
  isSentryEnabled,
  sentryDsn,
  sentryEnvironment,
} from "./lib/sentry-env";

if (isSentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    sendDefaultPii: false,
  });
}
