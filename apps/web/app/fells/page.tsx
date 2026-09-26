import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { FellsPage } from "@/marketing-pages/FellsPage";

const seo = getRouteSeo(["fells"]);

export const metadata = buildMetadata(seo);

export default function FellsIndexPage() {
  return (
    <>
      <JsonLd seo={seo} />
      <FellsPage seo={seo} />
    </>
  );
}
