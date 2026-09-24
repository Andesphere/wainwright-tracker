// AppStoreBadge — Apple's official black "Download on the App Store" badge,
// used as supplied (developer.apple.com/app-store/marketing/guidelines).
// The listing URL lives here so every link to the app points at one place.

import Image from "next/image";

import { trackCtaClick } from "@/lib/analytics";

export const APP_STORE_URL =
  "https://apps.apple.com/gb/app/wainwrights-baggers/id6771147426";

type AppStoreBadgeProps = {
  /** Analytics location, e.g. "home_hero". */
  location: string;
};

export function AppStoreBadge({ location }: AppStoreBadgeProps) {
  return (
    <a
      href={APP_STORE_URL}
      className="appstore-badge"
      onClick={() => trackCtaClick(location, "App Store")}
    >
      <Image
        src="/landing/app-store-badge.svg"
        alt="Download on the App Store"
        width={120}
        height={40}
      />
    </a>
  );
}
