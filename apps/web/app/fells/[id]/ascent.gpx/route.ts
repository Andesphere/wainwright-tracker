import { RELEASED_FELLS } from "@/content/fells/release";
import { getFellText } from "@/lib/fellPages";
import { getFellRoute } from "@/lib/fellRoutes";
import { requireFell } from "@/lib/fells";
import { fellGpx } from "@/lib/gpx";

// Released fells only; any other id is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return RELEASED_FELLS.map((id) => ({ id }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gpx = fellGpx(
    requireFell(id),
    getFellRoute(id)!,
    getFellText(id)!.start,
  );
  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}.gpx"`,
    },
  });
}
