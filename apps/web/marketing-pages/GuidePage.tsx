// GuidePage — /guides/<slug>, rendered on the server from the guide's MDX.
// A long read in the landing's language: the serif, cream paper, contour
// lines. Styles live in styles/guides.css under the gd- prefix.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AuthorAvatar } from "@/components/guides/AuthorAvatar";
import { Breadcrumbs } from "@/components/guides/Breadcrumbs";
import { GuideCard } from "@/components/guides/GuideCard";
import { TrackerCta } from "@/components/guides/GuideComponents";
import { SlopeNav } from "@/components/marketing/SlopeNav";
import { SlopeShell } from "@/components/marketing/SlopeShell";
import { authorPath } from "@/content/authors";
import { formatDate } from "@/lib/dates";
import { bookOf, formatHeight, requireFell } from "@/lib/fells";
import { relatedGuides } from "@/lib/guides";
import { guideAuthor, type RouteSeo } from "@/lib/seo";

type GuidePageProps = {
  seo: RouteSeo & { guide: NonNullable<RouteSeo["guide"]> };
  /** The rendered MDX body. */
  children: ReactNode;
};

export function GuidePage({ seo, children }: GuidePageProps) {
  const { guide } = seo;
  const author = guideAuthor(guide);
  const profile = authorPath(author);
  const related = relatedGuides(guide);
  const fells = guide.relatedFells.map(requireFell);

  return (
    <SlopeShell>
      <div className="gd-band">
        <div className="ld-contours" aria-hidden />
        <SlopeNav variant="plain" />
        <header className="gd-head">
          <Breadcrumbs crumbs={seo.breadcrumbs ?? []} />
          <p className="ld-kicker">{guide.category}</p>
          <h1 className="gd-h1">{guide.title}</h1>
          <p className="gd-dek">{guide.description}</p>
          <div className="gd-byline">
            <AuthorAvatar author={author} size={44} />
            <div>
              <p className="gd-byline-name">
                By{" "}
                {profile ? (
                  <Link href={profile} rel="author">
                    {author.name}
                  </Link>
                ) : (
                  author.name
                )}
              </p>
              <p className="gd-byline-meta">
                <time dateTime={guide.updatedAt}>
                  Updated {formatDate(guide.updatedAt)}
                </time>
                <span aria-hidden>·</span>
                <span>{guide.readMinutes} min read</span>
              </p>
            </div>
          </div>
        </header>
      </div>

      <figure className="gd-hero">
        <Image
          src={guide.heroImage}
          alt={guide.heroImageAlt}
          width={1200}
          height={655}
          priority
          sizes="(min-width: 1240px) 1180px, 100vw"
        />
      </figure>

      <div className="gd-body">
        {guide.headings.length > 1 ? (
          <nav className="gd-toc" aria-label="In this guide">
            <p className="gd-toc-title">In this guide</p>
            <ol>
              {guide.headings.map((heading) => (
                <li key={heading.id}>
                  <a href={`#${heading.id}`}>{heading.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <article className="gd-prose">
          {children}

          {fells.length > 0 ? (
            <section className="gd-fells" aria-labelledby="gd-fells-h">
              <h2 id="gd-fells-h">Fells in this guide</h2>
              <ul>
                {fells.map((fell) => (
                  <li key={fell.id}>
                    <strong>{fell.name}</strong>
                    <span>
                      {formatHeight(fell)} · Book {bookOf(fell).number}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <TrackerCta />

          <footer className="gd-about">
            <AuthorAvatar author={author} size={64} />
            <div>
              <p className="gd-about-tag">Written by</p>
              <p className="gd-about-name">
                {profile ? (
                  <Link href={profile} rel="author">
                    {author.name}
                  </Link>
                ) : (
                  author.name
                )}
              </p>
              <p className="gd-about-role">{author.role}</p>
              <p className="gd-about-bio">{author.bio[0]}</p>
              <p className="gd-about-dates">
                First published{" "}
                <time dateTime={guide.publishedAt}>
                  {formatDate(guide.publishedAt)}
                </time>
                . Last updated{" "}
                <time dateTime={guide.updatedAt}>
                  {formatDate(guide.updatedAt)}
                </time>
                . <Link href="/contact">Suggest a correction</Link>
              </p>
            </div>
          </footer>
        </article>
      </div>

      {related.length > 0 ? (
        <section className="gd-related" aria-labelledby="gd-related-h">
          <div className="ld-wrap">
            <div className="ld-notes-head">
              <h2 className="ld-h2 ld-h2--small" id="gd-related-h">
                Keep reading
              </h2>
              <Link href="/guides" className="ld-notes-all">
                All guides
              </Link>
            </div>
            <ul className="gd-grid">
              {related.map((other) => (
                <GuideCard key={other.slug} guide={other} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </SlopeShell>
  );
}
