// The components a guide can use in its MDX (wired up in mdx-components.tsx).
// All render on the server; only the CTA links are client islands.
//
//   <Fell id="catbells" />             name and height, from the catalogue
//   <FellFacts id="catbells" />        height, book, area, rank and grid reference
//   <Callout title="...">...</Callout> a boxed aside
//   <Table caption="...">| md table |</Table>
//   <PullQuote cite="...">...</PullQuote>
//   <Figure src width height alt caption credit />
//   <TrackerCta />                     "Bag it in the app" (also closes every guide)

import type { Wainwright } from "@wainwrights/catalog/wainwrights";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { FellBagLink } from "@/components/fells/FellBagLink";
import { AppStoreBadge } from "@/components/marketing/AppStoreBadge";
import { APP_STORE_LIVE } from "@/lib/appStore";
import {
  bookOf,
  fellPath,
  formatFeet,
  formatGridReference,
  formatHeight,
  heightRank,
  ordinal,
  requireFell,
} from "@/lib/fells";
import { headingId } from "@/lib/guides";
import { GuideCtaLink } from "./GuideCtaLink";

/** Plain text of a heading's children, for its anchor id. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

export function GuideH2({ children }: ComponentProps<"h2">) {
  return <h2 id={headingId(textOf(children))}>{children}</h2>;
}

/** A fell named in the text, linking to its page. */
export function Fell({ id }: { id: string }) {
  const fell = requireFell(id);
  return (
    <Link href={fellPath(fell)} className="gd-fell">
      {fell.name}
      <span className="gd-fell-h"> {formatHeight(fell)}</span>
    </Link>
  );
}

export function FellFacts({ id }: { id: string }) {
  const fell = requireFell(id);
  const book = bookOf(fell);
  return (
    <aside className="gd-facts" aria-label={`${fell.name} fell facts`}>
      <div className="gd-facts-head">
        <p className="gd-facts-tag">Fell facts</p>
        <p className="gd-facts-name">{fell.name}</p>
      </div>
      <dl className="gd-facts-grid">
        <div>
          <dt>Height</dt>
          <dd>
            {formatHeight(fell)}
            <small>{formatFeet(fell)}</small>
          </dd>
        </div>
        <div>
          <dt>Book</dt>
          <dd>
            Book {book.number}
            <small>{book.title}</small>
          </dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>
            {fell.area} Fells
            <small>Lake District</small>
          </dd>
        </div>
        <div>
          <dt>Rank</dt>
          <dd>
            {ordinal(heightRank(fell))}
            <small>of 214 by height</small>
          </dd>
        </div>
      </dl>
      <p className="gd-facts-grid-ref">
        Summit grid reference <span>{formatGridReference(fell)}</span>
      </p>
    </aside>
  );
}

export function Callout({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="gd-callout">
      {title ? <p className="gd-callout-title">{title}</p> : null}
      <div className="gd-callout-body">{children}</div>
    </aside>
  );
}

export function Table({
  caption,
  children,
}: {
  caption?: string;
  children: ReactNode;
}) {
  return (
    <figure className="gd-table">
      {caption ? <figcaption>{caption}</figcaption> : null}
      <div className="gd-table-scroll">{children}</div>
    </figure>
  );
}

export function PullQuote({
  cite,
  children,
}: {
  cite?: string;
  children: ReactNode;
}) {
  return (
    <figure className="gd-pullquote">
      <blockquote>{children}</blockquote>
      {cite ? <figcaption>{cite}</figcaption> : null}
    </figure>
  );
}

export function Figure({
  src,
  width,
  height,
  alt,
  caption,
  credit,
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  credit?: string;
}) {
  return (
    <figure className="gd-figure">
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        sizes="(min-width: 960px) 880px, 100vw"
      />
      {caption || credit ? (
        <figcaption>
          {caption}
          {credit ? <span className="gd-credit">{credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * "Bag it in the app": the App Store badge once the app is live, the web
 * tracker until then (and alongside it after). On a fell page the tracker
 * opens on that fell.
 */
export function TrackerCta({ fell }: { fell?: Wainwright }) {
  return (
    <aside className="gd-cta">
      <div className="ld-contours" aria-hidden />
      <div className="gd-cta-inner">
        <p className="gd-cta-tag">Wainwrights Baggers</p>
        <p className="gd-cta-title">
          {fell ? `Bag ${fell.name} in the app` : "Bag it in the app"}
        </p>
        <p className="gd-cta-text">
          Mark the fells you have climbed on a 3D map of the Lake District, add
          the date, and watch the seven books fill in. Free, on iPhone and the
          web.
        </p>
        <div className="ld-cta-row">
          {APP_STORE_LIVE ? (
            <AppStoreBadge location={fell ? "fell_cta" : "guide_cta"} />
          ) : null}
          {fell ? (
            <FellBagLink id={fell.id} label={`Bag ${fell.name}`} />
          ) : (
            <GuideCtaLink href="/app" label="Open the tracker" />
          )}
          {APP_STORE_LIVE ? null : (
            <span className="gd-cta-soon">iPhone app coming soon</span>
          )}
        </div>
      </div>
    </aside>
  );
}
