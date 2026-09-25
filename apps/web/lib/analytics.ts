import posthog from "posthog-js";

/**
 * The site section a path belongs to: "home" for /, else its first segment
 * (blog, contact, app...). Events and App Store campaign links carry it.
 */
export function pageGroup(pathname: string): string {
  return pathname.split("/").find(Boolean) ?? "home";
}

/**
 * Anonymous PostHog events. Nobody is identified, so properties must never carry
 * names, emails, notes or anything else a walker typed. Every event carries the
 * page group it fired on.
 */
function capture(event: string, properties: Record<string, string> = {}) {
  posthog.capture(event, {
    ...properties,
    page_group: pageGroup(window.location.pathname),
  });
}

export const trackCtaClick = (location: string, label: string) => {
  capture("cta_clicked", { location, label });
};

export const trackSignupClick = (location: string, label: string) => {
  capture("signup_clicked", { location, label });
};

/** An App Store link was followed; `location` is where on the page. */
export const trackAppStoreClick = (location: string) => {
  capture("appstore_clicked", { location });
};

export const trackBlogCtaClick = (
  slug: string,
  label: string,
  href: string,
) => {
  capture("blog_cta_clicked", { slug, label, href });
};

/** The tracker at /app opened for a signed-in walker. */
export const trackAppOpened = () => {
  capture("app_opened");
};

export const trackFellBagged = () => {
  capture("fell_bagged");
};

/** The Pro upsell opened; `feature` is the locked feature that was tapped. */
export const trackPaywallShown = (feature: string) => {
  capture("paywall_shown", { feature });
};
