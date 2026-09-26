import type { PostHog } from "posthog-js";

let resolvePosthog: (posthog: PostHog) => void;
const posthogReady = new Promise<PostHog>((resolve) => {
  resolvePosthog = resolve;
});

/** Called by instrumentation-client once PostHog has started. */
export const setPosthog = (posthog: PostHog) => resolvePosthog(posthog);

/**
 * The site section a path belongs to: "home" for /, else its first segment
 * (guides, contact, app...). Events and App Store campaign links carry it.
 */
export function pageGroup(pathname: string): string {
  return pathname.split("/").find(Boolean) ?? "home";
}

/**
 * Anonymous PostHog events. Nobody is identified, so properties must never carry
 * names, emails, notes or anything else a walker typed. Every event carries the
 * page group it fired on. On marketing pages PostHog starts once the page is
 * idle; earlier events wait for it.
 */
function capture(event: string, properties: Record<string, string> = {}) {
  const withGroup = {
    ...properties,
    page_group: pageGroup(window.location.pathname),
  };
  void posthogReady.then((posthog) => posthog.capture(event, withGroup));
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

/** A call to action inside a guide was followed; `slug` is the guide. */
export const trackGuideCtaClick = (
  slug: string,
  label: string,
  href: string,
) => {
  capture("guide_cta_clicked", { slug, label, href });
};

/** "Bag it" on a fell page was followed into the tracker; `fell` is the fell id. */
export const trackFellBagClick = (fell: string) => {
  capture("fell_bag_clicked", { fell });
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
