// Required by @next/mdx: the components every guide can use without importing.

import type { MDXComponents } from "mdx/types";

import {
  Callout,
  Fell,
  FellFacts,
  Figure,
  GuideH2,
  PullQuote,
  Table,
  TrackerCta,
} from "@/components/guides/GuideComponents";

const components: MDXComponents = {
  h2: GuideH2,
  Callout,
  Fell,
  FellFacts,
  Figure,
  PullQuote,
  Table,
  TrackerCta,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
