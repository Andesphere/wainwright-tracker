// Who writes the guides. A guide's front matter names its author by slug.
//
// A person gets a profile page at /guides/authors/<slug> with Person structured
// data; the brand has no page and links to the home page. Add a person only
// with facts and photos they have approved.

export type AuthorPhoto = {
  /** A file under public/, e.g. /images/authors/<slug>/<file>.jpg */
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

export type Author = {
  slug: string;
  name: string;
  kind: "organization" | "person";
  /** One line under the name: who they are to the round. */
  role: string;
  /** Short paragraphs: the author page, and the note at the foot of each guide. */
  bio: string[];
  /** A square portrait (persons). */
  portrait?: AuthorPhoto;
  /** Photos from the fells, shown on the author page. */
  photos?: AuthorPhoto[];
};

export const BRAND_AUTHOR: Author = {
  slug: "wainwrights-baggers",
  name: "Wainwrights Baggers",
  kind: "organization",
  role: "The people who make the Wainwrights Baggers tracker",
  bio: [
    "We build the map, checklist and journal for the 214 Wainwrights, on iPhone and the web. If a guide gets a fell, a height or a path wrong, tell us and we will fix it.",
  ],
};

export const AUTHORS: Author[] = [BRAND_AUTHOR];

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.find((author) => author.slug === slug);
}

/** The profile page, for persons only. */
export function authorPath(author: Author): string | undefined {
  return author.kind === "person"
    ? `/guides/authors/${author.slug}`
    : undefined;
}
