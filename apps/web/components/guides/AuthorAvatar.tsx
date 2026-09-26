// A round avatar (the person's portrait, or the app icon for the brand) and
// the author's name.

import Image from "next/image";
import Link from "next/link";

import { type Author, authorPath } from "@/content/authors";

export function AuthorAvatar({
  author,
  size,
  priority,
}: {
  author: Author;
  size: number;
  priority?: boolean;
}) {
  if (author.portrait) {
    return (
      <Image
        className="gd-avatar"
        src={author.portrait.src}
        alt={author.portrait.alt}
        width={size}
        height={size}
        priority={priority}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed
    <img
      className="gd-avatar gd-avatar--brand"
      src="/favicon.svg"
      alt=""
      width={size}
      height={size}
    />
  );
}

/** The author's name, linked to their profile page when they have one. */
export function AuthorName({ author }: { author: Author }) {
  const profile = authorPath(author);
  if (!profile) return author.name;
  return (
    <Link href={profile} rel="author">
      {author.name}
    </Link>
  );
}
