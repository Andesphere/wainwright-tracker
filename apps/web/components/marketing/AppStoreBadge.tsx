// AppStoreBadge — Apple's official "Download on the App Store" badge
// (black, en-GB, from App Store Marketing Tools) linking to the listing.
// Apple asks for the badge to be shown unaltered at 40px tall or more.
// Before launch there is no listing, so it shows a plain "coming soon" pill.

import Image from "next/image";

import { APP_STORE_LIVE } from "@/lib/appStore";
import { AppStoreLink } from "./AppStoreLink";

type AppStoreBadgeProps = {
  /** Analytics location, e.g. "home_hero". */
  location: string;
};

export function AppStoreBadge({ location }: AppStoreBadgeProps) {
  if (!APP_STORE_LIVE) {
    return <span className="ld-badge-soon">Coming soon to iPhone</span>;
  }
  return (
    <AppStoreLink location={location} className="ld-badge">
      <Image
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        width={156}
        height={52}
        unoptimized
      />
    </AppStoreLink>
  );
}
