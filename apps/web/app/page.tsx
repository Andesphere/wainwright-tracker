import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";
import { LandingPage } from "@/marketing-pages/LandingPage";

const seo = getRouteSeo([]);

export const metadata = buildMetadata(seo);

export default function HomePage() {
  return (
    <>
      <JsonLd seo={seo} />
      <LandingPage />
    </>
  );
}
