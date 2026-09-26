import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { GuidesPage } from "@/marketing-pages/GuidesPage";

const seo = getRouteSeo(["guides"]);

export const metadata = buildMetadata(seo);

export default function GuidesIndexPage() {
  return (
    <>
      <JsonLd seo={seo} />
      <GuidesPage seo={seo} />
    </>
  );
}
