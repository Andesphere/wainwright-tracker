// The guides: one MDX file per guide in content/guides, front matter first.
// Front matter is validated when the index is read, and every page, the
// sitemap and the home page read the index, so a bad guide fails the build.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

import { type Author, getAuthor } from "@/content/authors";
import { getFell } from "@/lib/fells";

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const publicFile = z
  .string()
  .startsWith("/", "must be a path under public/")
  .refine(
    (file) => existsSync(path.join(PUBLIC_DIR, file)),
    "file not found in public/",
  );

export const guideFrontMatter = z
  .object({
    title: z.string().min(10).max(80),
    /** The meta description and the dek under the title. */
    description: z.string().min(50).max(170),
    publishedAt: isoDate,
    /** The date the text last changed: the sitemap, dateModified and the byline read it. */
    updatedAt: isoDate,
    /** An author slug from content/authors.ts. */
    author: z.string().refine((slug) => getAuthor(slug), "unknown author"),
    /** The kicker above the title, e.g. "Beginner guide". */
    category: z.string().min(3).max(30),
    /** The search the guide is written for. */
    primaryKeyword: z.string().min(3),
    heroImage: publicFile,
    heroImageAlt: z.string().min(10),
    /** A 1200x630 JPEG share card (seo.test.ts checks the size). */
    ogImage: publicFile,
    /** Catalogue ids of the fells the guide is about. */
    relatedFells: z
      .array(z.string().refine((id) => getFell(id), "unknown fell id"))
      .default([]),
  })
  .strict()
  .refine((data) => data.updatedAt >= data.publishedAt, {
    message: "updatedAt is before publishedAt",
    path: ["updatedAt"],
  });

export type GuideFrontMatter = z.infer<typeof guideFrontMatter>;

export type GuideHeading = { id: string; text: string };

export type Guide = GuideFrontMatter & {
  slug: string;
  readMinutes: number;
  /** The guide's H2s, for the "In this guide" list. */
  headings: GuideHeading[];
};

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n/;

/** Anchor id for a heading; the MDX h2 component uses the same function. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Words a reader reads: tags, markdown marks and table rules left out. */
function readMinutesOf(body: string): number {
  const text = body
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>|`]+/g, " ")
    .replace(/\]\([^)]*\)/g, " ");
  const words = text.split(/\s+/).filter((word) => /\w/.test(word)).length;
  return Math.max(1, Math.round(words / 230));
}

function headingsOf(body: string): GuideHeading[] {
  return [...body.matchAll(/^## (.+)$/gm)].map((match) => {
    const text = match[1].trim();
    // The contents list reads the source; keep headings plain so its anchors match.
    if (/[<{[*_`]/.test(text)) {
      throw new Error(`Heading "${text}" must be plain text`);
    }
    return { id: headingId(text), text };
  });
}

export function parseGuide(slug: string, source: string): Guide {
  const match = source.match(FRONT_MATTER);
  if (!match) throw new Error(`Guide "${slug}" has no front matter`);
  const result = guideFrontMatter.safeParse(parseYaml(match[1]));
  if (!result.success) {
    throw new Error(
      `Guide "${slug}" has invalid front matter:\n${z.prettifyError(result.error)}`,
    );
  }
  const body = source.slice(match[0].length);
  return {
    ...result.data,
    slug,
    readMinutes: readMinutesOf(body),
    headings: headingsOf(body),
  };
}

let cache: Guide[] | undefined;

/** Every guide, most recently updated first. */
export function getGuides(): Guide[] {
  cache ??= readdirSync(GUIDES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) =>
      parseGuide(
        file.replace(/\.mdx$/, ""),
        readFileSync(path.join(GUIDES_DIR, file), "utf8"),
      ),
    )
    .sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.title.localeCompare(b.title),
    );
  return cache;
}

export function getGuide(slug: string): Guide | undefined {
  return getGuides().find((guide) => guide.slug === slug);
}

/** Up to three other guides, sharing fells first, then the most recent. */
export function relatedGuides(guide: Guide): Guide[] {
  const shared = (other: Guide) =>
    other.relatedFells.filter((id) => guide.relatedFells.includes(id)).length;
  return getGuides()
    .filter((other) => other.slug !== guide.slug)
    .map((other, index) => ({ other, index, score: shared(other) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(({ other }) => other);
}

/** The guide's author; front matter validation guarantees it exists. */
export function guideAuthor(guide: Guide): Author {
  return getAuthor(guide.author)!;
}

/** The latest updatedAt among these guides, for a list page's lastmod. */
export function latestUpdate(guides: Guide[]): string | undefined {
  return guides
    .map((guide) => guide.updatedAt)
    .sort()
    .at(-1);
}
