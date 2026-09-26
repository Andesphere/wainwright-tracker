// The written part of a fell page: one Markdown file per fell in
// content/fells (front matter, then plain paragraphs), and the release list
// that decides which fell pages are indexable. A released fell must have both
// its text and a desk-checked route, or the build fails.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

import { RELEASED_FELLS } from "@/content/fells/release";
import { type FellRoute, getFellRoute } from "@/lib/fellRoutes";
import { getFell } from "@/lib/fells";

const FELLS_DIR = path.join(process.cwd(), "content", "fells");

const fellFrontMatter = z
  .object({
    /** The meta description: unique across fells. */
    description: z.string().min(80).max(160),
    /** How the route section names its start, e.g. "Seathwaite, Borrowdale". */
    start: z.string().min(3).max(60),
    /** The date the text last changed; the sitemap reads it. */
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD"),
  })
  .strict();

export type FellText = z.infer<typeof fellFrontMatter> & {
  /** The ascent description, one string per paragraph. */
  paragraphs: string[];
};

const FRONT_MATTER = /^---\n([\s\S]*?)\n---\n/;

export function parseFellText(id: string, source: string): FellText {
  const match = source.match(FRONT_MATTER);
  if (!match) throw new Error(`Fell text "${id}" has no front matter`);
  const result = fellFrontMatter.safeParse(parseYaml(match[1]));
  if (!result.success) {
    throw new Error(
      `Fell text "${id}" has invalid front matter:\n${z.prettifyError(result.error)}`,
    );
  }
  const paragraphs = source
    .slice(match[0].length)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const words = paragraphs.join(" ").split(" ").length;
  if (words < 150 || words > 300) {
    throw new Error(`Fell text "${id}" has ${words} words; write 150 to 300`);
  }
  return { ...result.data, paragraphs };
}

export function getFellText(id: string): FellText | undefined {
  const file = path.join(FELLS_DIR, `${id}.md`);
  if (!existsSync(file)) return undefined;
  return parseFellText(id, readFileSync(file, "utf8"));
}

for (const id of RELEASED_FELLS) {
  if (!getFell(id))
    throw new Error(`Released fell "${id}" is not in the catalogue`);
  if (!getFellText(id)) throw new Error(`Released fell "${id}" has no text`);
  if (!getFellRoute(id)) throw new Error(`Released fell "${id}" has no route`);
}

/** On the release list: indexable, in the sitemap, with its route and text. */
export function isReleased(id: string): boolean {
  return (RELEASED_FELLS as readonly string[]).includes(id);
}

export type Ascent = { route: FellRoute; text: FellText };

/** A released fell's route and text; the checks above guarantee both. */
export function getAscent(id: string): Ascent | undefined {
  if (!isReleased(id)) return undefined;
  return { route: getFellRoute(id)!, text: getFellText(id)! };
}
