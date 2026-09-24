// AppStoreBadge — Apple's official "Download on the App Store" badge
// (black, en-GB, from App Store Marketing Tools) linking to the listing.
// Apple asks for the badge to be shown unaltered at 40px tall or more.

import Image from "next/image";

import { trackCtaClick } from "@/lib/analytics";
import { APP_STORE_URL } from "@/lib/appStore";

type AppStoreBadgeProps = {
  /** Analytics location, e.g. "home_hero". */
  location: string;
};

export function AppStoreBadge({ location }: AppStoreBadgeProps) {
  return (
    <a
      href={APP_STORE_URL}
      className="ld-badge"
      onClick={() => trackCtaClick(location, "App Store")}
    >
      <Image
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        width={156}
        height={52}
        unoptimized
      />
    </a>
  );
}
