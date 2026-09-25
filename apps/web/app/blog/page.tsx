import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { BlogPage } from "@/marketing-pages/BlogPage";

const seo = getRouteSeo(["blog"]);

export const metadata = buildMetadata(seo);

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd seo={seo} />
      <BlogPage />
    </>
  );
}
