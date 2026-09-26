// AuthorPage — /guides/authors/<slug>: who a person author is, their photos
// from the fells and the guides they wrote. Persons only; the brand has none.

import Image from "next/image";

import { AuthorAvatar } from "@/components/guides/AuthorAvatar";
import { GuideBand } from "@/components/guides/GuideBand";
import { GuideCard } from "@/components/guides/GuideCard";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { getGuides } from "@/lib/guides";
import type { RouteSeo } from "@/lib/seo";

type AuthorPageProps = {
  seo: RouteSeo & { author: NonNullable<RouteSeo["author"]> };
};

export function AuthorPage({ seo }: AuthorPageProps) {
  const { author } = seo;
  const guides = getGuides().filter((guide) => guide.author === author.slug);

  return (
    <SlopeShell>
      <GuideBand crumbs={seo.breadcrumbs ?? []} variant="author">
        <AuthorAvatar author={author} size={132} priority />
        <p className="ld-kicker">Guides author</p>
        <h1 className="gd-h1">{author.name}</h1>
        <p className="gd-dek">{author.role}</p>
      </GuideBand>

      <div className="gd-body gd-body--single">
        <div className="gd-prose">
          {author.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      {author.photos?.length ? (
        <section className="ld-wrap gd-photos" aria-label="From the fells">
          {author.photos.map((photo) => (
            <figure key={photo.src} className="gd-figure">
              <Image
                src={photo.src}
                width={photo.width}
                height={photo.height}
                alt={photo.alt}
                sizes="(min-width: 900px) 560px, 100vw"
              />
              {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
            </figure>
          ))}
        </section>
      ) : null}

      {guides.length > 0 ? (
        <section className="gd-related" aria-labelledby="gd-by-h">
          <div className="ld-wrap">
            <h2 className="ld-h2 ld-h2--small" id="gd-by-h">
              Guides by {author.name}
            </h2>
            <ul className="gd-grid">
              {guides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </SlopeShell>
  );
}
