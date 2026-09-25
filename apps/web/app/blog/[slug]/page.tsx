import { notFound } from "next/navigation";

import { BLOG_POSTS } from "@/content/blog/posts";
import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { BlogPostPage } from "@/marketing-pages/BlogPostPage";

// Only the known posts exist; any other slug is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

type BlogPostRouteProps = {
  params: Promise<{ slug: string }>;
};

async function postSeo({ params }: BlogPostRouteProps) {
  const { slug } = await params;
  return getRouteSeo(["blog", slug]);
}

export async function generateMetadata(props: BlogPostRouteProps) {
  return buildMetadata(await postSeo(props));
}

export default async function BlogPostRoute(props: BlogPostRouteProps) {
  const seo = await postSeo(props);
  if (!seo.post) notFound();
  return (
    <>
      <JsonLd seo={seo} />
      <BlogPostPage post={seo.post} />
    </>
  );
}
