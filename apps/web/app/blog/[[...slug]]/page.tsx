import App from "@/App";
import { ClientProviders } from "@/components/providers/client-providers";
import { BLOG_POSTS } from "@/content/blog/posts";
import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";

// The blog still renders in the client app until the guides replace it.
// Only the index and known posts exist; anything else is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: [] }, ...BLOG_POSTS.map((post) => ({ slug: [post.slug] }))];
}

type BlogRouteProps = {
  params: Promise<{ slug?: string[] }>;
};

async function blogSeo({ params }: BlogRouteProps) {
  const { slug = [] } = await params;
  return getRouteSeo(["blog", ...slug]);
}

export async function generateMetadata(props: BlogRouteProps) {
  return buildMetadata(await blogSeo(props));
}

export default async function BlogRoute(props: BlogRouteProps) {
  const seo = await blogSeo(props);
  return (
    <>
      <JsonLd seo={seo} />
      <ClientProviders>
        <App />
      </ClientProviders>
    </>
  );
}
