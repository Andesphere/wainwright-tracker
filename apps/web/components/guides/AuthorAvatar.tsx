// A round avatar: the person's portrait, or the app icon for the brand.

import Image from "next/image";

import type { Author } from "@/content/authors";

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
