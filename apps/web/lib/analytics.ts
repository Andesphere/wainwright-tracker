import posthog from "posthog-js";

/**
 * Anonymous PostHog events. Nobody is identified, so properties must never carry
 * names, emails, notes or anything else a walker typed.
 */
export const trackCtaClick = (location: string, label: string) => {
  posthog.capture("cta_clicked", { location, label });
};

export const trackSignupClick = (location: string, label: string) => {
  posthog.capture("signup_clicked", { location, label });
};

export const trackBlogCtaClick = (
  slug: string,
  label: string,
  href: string,
) => {
  posthog.capture("blog_cta_clicked", { slug, label, href });
};

/** The tracker at /app opened for a signed-in walker. */
export const trackAppOpened = () => {
  posthog.capture("app_opened");
};

export const trackFellBagged = () => {
  posthog.capture("fell_bagged");
};

/** The Pro upsell opened; `feature` is the locked feature that was tapped. */
export const trackPaywallShown = (feature: string) => {
  posthog.capture("paywall_shown", { feature });
};
