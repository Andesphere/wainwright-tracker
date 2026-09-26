// The top of every guides page: contour lines, the nav and a centred header
// that opens with the breadcrumb trail.

import type { ReactNode } from "react";

import { SlopeNav } from "@/components/marketing/SlopeNav";
import type { Breadcrumb } from "@/lib/seo";
import { Breadcrumbs } from "./Breadcrumbs";

export function GuideBand({
  crumbs,
  variant,
  children,
}: {
  crumbs: Breadcrumb[];
  variant?: "hub" | "author";
  children: ReactNode;
}) {
  return (
    <div className="gd-band">
      <div className="ld-contours" aria-hidden />
      <SlopeNav variant="plain" />
      <header className={variant ? `gd-head gd-head--${variant}` : "gd-head"}>
        <Breadcrumbs crumbs={crumbs} />
        {children}
      </header>
    </div>
  );
}
