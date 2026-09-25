"use client";

// The call-to-action pill inside a blog post: the only client island there,
// so the click can be counted.

import { trackBlogCtaClick } from "@/lib/analytics";

type BlogCtaLinkProps = {
  slug: string;
  label: string;
  href: string;
};

export function BlogCtaLink({ slug, label, href }: BlogCtaLinkProps) {
  return (
    <a
      href={href}
      className="btn-pill btn-pill-light"
      onClick={() => trackBlogCtaClick(slug, label, href)}
    >
      {label}
      <i className="btn-arr" />
    </a>
  );
}
