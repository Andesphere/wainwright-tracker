import { track } from "@vercel/analytics";

const pagePath = () =>
  typeof window === "undefined" ? undefined : window.location.pathname;

export const trackCtaClick = (location: string, label: string) => {
  track("cta_click", { location, label, path: pagePath() });
};

export const trackSignupClick = (location: string, label: string) => {
  track("signup_click", { location, label, path: pagePath() });
};

export const trackBlogCtaClick = (
  slug: string,
  label: string,
  href: string,
) => {
  track("blog_cta_click", { slug, label, href, path: pagePath() });
};
