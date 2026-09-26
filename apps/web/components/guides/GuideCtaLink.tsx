"use client";

// A call-to-action pill inside a guide: a client island so the click can be
// counted against the guide it came from.

import { usePathname } from "next/navigation";

import { trackGuideCtaClick } from "@/lib/analytics";

type GuideCtaLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function GuideCtaLink({ href, label, className }: GuideCtaLinkProps) {
  const slug = usePathname().split("/").at(-1) ?? "";
  return (
    <a
      href={href}
      className={className ?? "btn-pill"}
      onClick={() => trackGuideCtaClick(slug, label, href)}
    >
      {label}
      <i className="btn-arr" />
    </a>
  );
}
