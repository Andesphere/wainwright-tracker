"use client";

// Every App Store link on the site: carries the page group as a campaign
// token so App Store Connect counts installs per page group, and counts the
// click. Render it only when APP_STORE_LIVE is true.

import { usePathname } from "next/navigation";

import { pageGroup, trackAppStoreClick } from "@/lib/analytics";
import { appStoreLink } from "@/lib/appStore";

type AppStoreLinkProps = Omit<React.ComponentProps<"a">, "href" | "onClick"> & {
  /** Analytics location, e.g. "home_hero". */
  location: string;
};

export function AppStoreLink({ location, ...anchor }: AppStoreLinkProps) {
  const href = appStoreLink(pageGroup(usePathname()));
  return (
    <a {...anchor} href={href} onClick={() => trackAppStoreClick(location)} />
  );
}
