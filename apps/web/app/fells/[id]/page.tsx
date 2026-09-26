import { WAINWRIGHTS } from "@wainwrights/catalog/wainwrights";
import { notFound } from "next/navigation";

import { getAscent } from "@/lib/fellPages";
import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { FellPage } from "@/marketing-pages/FellPage";

// All 214 fells build; any other id is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return WAINWRIGHTS.map((fell) => ({ id: fell.id }));
}

type FellRouteProps = {
  params: Promise<{ id: string }>;
};

async function fellSeo({ params }: FellRouteProps) {
  const { id } = await params;
  return getRouteSeo(["fells", id]);
}

export async function generateMetadata(props: FellRouteProps) {
  return buildMetadata(await fellSeo(props));
}

export default async function FellRoute(props: FellRouteProps) {
  const seo = await fellSeo(props);
  const { fell, book } = seo;
  if (!fell || !book) notFound();
  return (
    <>
      <JsonLd seo={seo} />
      <FellPage seo={{ ...seo, fell, book }} ascent={getAscent(fell.id)} />
    </>
  );
}
