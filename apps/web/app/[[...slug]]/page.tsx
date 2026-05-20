import App from "@/App";
import { ClientProviders } from "@/components/providers/client-providers";
import {
  buildMetadata,
  getRouteSeo,
  JsonLd,
  SeoFallbackContent,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type AppRouterPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export async function generateMetadata({ params }: AppRouterPageProps) {
  const { slug } = await params;
  return buildMetadata(getRouteSeo(slug));
}

export default async function AppRouterPage({ params }: AppRouterPageProps) {
  const { slug } = await params;
  const seo = getRouteSeo(slug);

  return (
    <>
      <JsonLd seo={seo} />
      <SeoFallbackContent seo={seo} />
      <ClientProviders>
        <App />
      </ClientProviders>
    </>
  );
}
