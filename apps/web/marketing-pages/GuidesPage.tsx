// GuidesPage — the /guides hub, rendered on the server from the MDX index.

import { Breadcrumbs } from "@/components/guides/Breadcrumbs";
import { GuideCard } from "@/components/guides/GuideCard";
import { TrackerCta } from "@/components/guides/GuideComponents";
import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { getGuides } from "@/lib/guides";
import type { RouteSeo } from "@/lib/seo";

export function GuidesPage({ seo }: { seo: RouteSeo }) {
  const [lead, ...rest] = getGuides();

  return (
    <SlopeShell>
      <div className="gd-band">
        <div className="ld-contours" aria-hidden />
        <SlopeNav variant="plain" />
        <header className="gd-head gd-head--hub">
          <Breadcrumbs crumbs={seo.breadcrumbs ?? []} />
          <h1 className="gd-h1">
            Guides for the <em>long</em> round.
          </h1>
          <p className="gd-dek">
            Plain advice for planning, walking and remembering the 214
            Wainwrights: where to start, what to check before you go, and how to
            keep a record worth reading back.
          </p>
        </header>
      </div>

      <div className="ld-wrap gd-hub">
        <ul className="gd-grid gd-grid--hub">
          <GuideCard guide={lead} featured priority />
          {rest.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </ul>
        <div className="gd-hub-cta">
          <TrackerCta />
        </div>
      </div>
    </SlopeShell>
  );
}
