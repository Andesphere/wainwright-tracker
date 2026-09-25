export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const isSentryEnabled =
  process.env.NODE_ENV === "production" && Boolean(sentryDsn);

/** Vercel's `production` or `preview`; `development` everywhere else. */
export const sentryEnvironment =
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development";
