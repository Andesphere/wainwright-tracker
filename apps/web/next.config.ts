import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";

// Guides (content/guides/*.mdx). Plugins are named as strings so Turbopack can load them.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
  },
});

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  transpilePackages: ["@wainwrights/backend", "@wainwrights/catalog"],
  // The old /blog posts moved to /guides (#29); two merged into one guide.
  // `{/}?` also catches a trailing slash, which skipTrailingSlashRedirect leaves alone.
  async redirects() {
    return [
      { source: "/blog{/}?", destination: "/guides", permanent: true },
      {
        source: "/blog/best-beginner-wainwrights{/}?",
        destination: "/guides/easiest-wainwrights",
        permanent: true,
      },
      {
        source: "/blog/easy-wainwright-walks-map{/}?",
        destination: "/guides/easiest-wainwrights",
        permanent: true,
      },
      {
        source: "/blog/best-wainwright-app{/}?",
        destination: "/guides/best-wainwright-app",
        permanent: true,
      },
      {
        source: "/blog/introducing-the-tracker{/}?",
        destination: "/",
        permanent: true,
      },
    ];
  },
  // PostHog through our own domain, so ad blockers leave the anonymous analytics alone.
  async rewrites() {
    return [
      {
        source: "/pulse/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/pulse/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/pulse/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(withMDX(nextConfig), {
  org: process.env.SENTRY_ORG ?? "andy-partner",
  project: process.env.SENTRY_PROJECT ?? "wainwrights-web",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  release: {
    create: Boolean(process.env.SENTRY_AUTH_TOKEN),
  },
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
