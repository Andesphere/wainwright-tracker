/** The iPhone app's App Store listing. Change it here and nowhere else. */
export const APP_STORE_URL =
  "https://apps.apple.com/gb/app/wainwrights-baggers/id6771147426";

/**
 * False until Apple approves the app: the listing does not exist yet, so App
 * Store links show as "coming soon". Set to true on launch day; it also turns
 * on the MobileApplication structured data and the Organization's sameAs.
 */
export const APP_STORE_LIVE = false;

/**
 * ANDESPHERE LTD's App Store Connect provider token (the `pt` in a campaign
 * link, from App Store Connect > App Analytics > Campaign Generator). Must be
 * set before APP_STORE_LIVE goes true; appStore.test.ts enforces it.
 */
export const APP_STORE_PROVIDER_TOKEN: string | null = null;

/**
 * An App Store link that App Store Connect attributes to a site page group:
 * `ct=web-<group>` (for example web-home, web-blog) plus the provider token.
 */
export function appStoreLink(pageGroup: string): string {
  const url = new URL(APP_STORE_URL);
  if (APP_STORE_PROVIDER_TOKEN)
    url.searchParams.set("pt", APP_STORE_PROVIDER_TOKEN);
  url.searchParams.set("ct", `web-${pageGroup}`);
  url.searchParams.set("mt", "8");
  return url.toString();
}
