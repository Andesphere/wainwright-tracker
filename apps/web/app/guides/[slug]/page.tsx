import { notFound } from "next/navigation";

import { getGuides } from "@/lib/guides";
import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { GuidePage } from "@/marketing-pages/GuidePage";

// Only the guides in content/guides exist; any other slug is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

type GuideRouteProps = {
  params: Promise<{ slug: string }>;
};

async function guideSeo({ params }: GuideRouteProps) {
  const { slug } = await params;
  return getRouteSeo(["guides", slug]);
}

export async function generateMetadata(props: GuideRouteProps) {
  return buildMetadata(await guideSeo(props));
}

export default async function GuideRoute(props: GuideRouteProps) {
  const seo = await guideSeo(props);
  const { guide } = seo;
  if (!guide) notFound();
  const { default: Content } = await import(
    `@/content/guides/${guide.slug}.mdx`
  );
  return (
    <>
      <JsonLd seo={seo} />
      <GuidePage seo={{ ...seo, guide }}>
        <Content />
      </GuidePage>
    </>
  );
}
