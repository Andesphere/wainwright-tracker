"use client";

// A call-to-action pill inside a guide: a client island so the click can be
// counted against the guide it came from.

import { usePathname } from "next/navigation";

import { trackGuideCtaClick } from "@/lib/analytics";

type GuideCtaLinkProps = {
  href: string;
  label: string;
};

export function GuideCtaLink({ href, label }: GuideCtaLinkProps) {
  // The guide's slug, or "hub" on /guides itself.
  const slug = usePathname().match(/^\/guides\/([^/]+)$/)?.[1] ?? "hub";
  return (
    <a
      href={href}
      className="btn-pill"
      onClick={() => trackGuideCtaClick(slug, label, href)}
    >
      {label}
      <i className="btn-arr" />
    </a>
  );
}
