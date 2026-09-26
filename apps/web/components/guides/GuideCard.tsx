// A guide in a list: the /guides hub, related guides and an author's page.

import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/lib/dates";
import type { Guide } from "@/lib/guides";

type GuideCardProps = {
  guide: Guide;
  /** The lead card on the hub: wider, with a larger title. */
  featured?: boolean;
  /** Load the image first (the hub's lead card). */
  priority?: boolean;
};

export function GuideCard({ guide, featured, priority }: GuideCardProps) {
  return (
    <li className="gd-card" data-featured={featured || undefined}>
      <Link href={`/guides/${guide.slug}`}>
        <div className="gd-card-media">
          <Image
            src={guide.heroImage}
            alt=""
            fill
            priority={priority}
            sizes={
              featured
                ? "(min-width: 900px) 640px, 100vw"
                : "(min-width: 900px) 380px, 100vw"
            }
          />
        </div>
        <div className="gd-card-copy">
          <p className="gd-card-cat">{guide.category}</p>
          <h3 className="gd-card-title">{guide.title}</h3>
          <p className="gd-card-dek">{guide.description}</p>
          <p className="gd-card-meta">
            <time dateTime={guide.updatedAt}>
              Updated {formatDate(guide.updatedAt)}
            </time>
            <span aria-hidden>·</span>
            <span>{guide.readMinutes} min read</span>
          </p>
        </div>
      </Link>
    </li>
  );
}
