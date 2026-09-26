import { notFound } from "next/navigation";

import { AUTHORS, authorPath } from "@/content/authors";
import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { AuthorPage } from "@/marketing-pages/AuthorPage";

// A page for each person in content/authors.ts; anything else is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return AUTHORS.filter((author) => authorPath(author)).map((author) => ({
    slug: author.slug,
  }));
}

type AuthorRouteProps = {
  params: Promise<{ slug: string }>;
};

async function authorSeo({ params }: AuthorRouteProps) {
  const { slug } = await params;
  return getRouteSeo(["guides", "authors", slug]);
}

export async function generateMetadata(props: AuthorRouteProps) {
  return buildMetadata(await authorSeo(props));
}

export default async function AuthorRoute(props: AuthorRouteProps) {
  const seo = await authorSeo(props);
  const { author } = seo;
  if (!author) notFound();
  return (
    <>
      <JsonLd seo={seo} />
      <AuthorPage seo={{ ...seo, author }} />
    </>
  );
}
