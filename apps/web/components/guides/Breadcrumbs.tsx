// The visible trail; the same crumbs feed the BreadcrumbList structured data.

import Link from "next/link";

import type { Breadcrumb } from "@/lib/seo";

export function Breadcrumbs({ crumbs }: { crumbs: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="gd-crumbs">
      <ol>
        {crumbs.map((crumb, index) =>
          index === crumbs.length - 1 ? (
            <li key={crumb.path} aria-current="page">
              {crumb.name}
            </li>
          ) : (
            <li key={crumb.path}>
              <Link href={crumb.path}>{crumb.name}</Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
