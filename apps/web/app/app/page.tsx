import App from "@/App";
import { ClientProviders } from "@/components/providers/client-providers";
import { buildMetadata, getRouteSeo, JsonLd } from "@/lib/seo";

const seo = getRouteSeo(["app"]);

export const metadata = buildMetadata(seo);

export default function TrackerPage() {
  return (
    <>
      <JsonLd seo={seo} />
      <ClientProviders>
        <App />
      </ClientProviders>
    </>
  );
}
