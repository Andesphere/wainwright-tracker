import { describe, expect, it } from "vitest";

import { pageGroup } from "@/lib/analytics";
import {
  APP_STORE_LIVE,
  APP_STORE_PROVIDER_TOKEN,
  APP_STORE_URL,
  appStoreLink,
} from "@/lib/appStore";

describe("App Store links", () => {
  it("tag the listing with the page group as campaign", () => {
    const url = new URL(appStoreLink("blog"));
    expect(`${url.origin}${url.pathname}`).toBe(APP_STORE_URL);
    expect(url.searchParams.get("ct")).toBe("web-blog");
    expect(url.searchParams.get("mt")).toBe("8");
  });

  it.runIf(APP_STORE_LIVE)("carry the provider token once live", () => {
    expect(APP_STORE_PROVIDER_TOKEN).toMatch(/^\d+$/);
    expect(new URL(appStoreLink("home")).searchParams.get("pt")).toBe(
      APP_STORE_PROVIDER_TOKEN,
    );
  });
});

describe("page groups", () => {
  it.each([
    ["/", "home"],
    ["/blog", "blog"],
    ["/blog/best-wainwright-app", "blog"],
    ["/contact", "contact"],
    ["/app", "app"],
  ])("%s is %s", (pathname, group) => {
    expect(pageGroup(pathname)).toBe(group);
  });
});
