import type { Metadata } from "next";
import Link from "next/link";

import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Page not found · ${SITE_NAME}`,
};

// Every unknown URL lands here with a real 404 status.
export default function NotFound() {
  return (
    <SlopeShell>
      <SlopeNav variant="solid" />
      <section className="slope-banner slope-notfound">
        <p className="slope-banner-tag">— 404, off the map</p>
        <h1 className="slope-banner-h">
          No path <em>this way</em>.
        </h1>
        <p className="slope-banner-lede">
          The page you asked for is not here. The link may be old or mistyped.
          Head back to the start, or read the field notes.
        </p>
        <div className="ld-cta-row">
          <Link href="/" className="btn-pill btn-pill-light">
            Back to the home page
            <i className="btn-arr" />
          </Link>
          <Link href="/blog" prefetch={false} className="btn-pill">
            Read the field notes
            <i className="btn-arr" />
          </Link>
        </div>
      </section>
    </SlopeShell>
  );
}
