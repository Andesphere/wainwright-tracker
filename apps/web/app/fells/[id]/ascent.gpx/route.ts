// The free GPX of a released fell's ascent, ODbL (lib/gpx.ts).

import { RELEASED_FELLS } from "@/content/fells/release";
import { getAscent } from "@/lib/fellPages";
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
  const { route, text } = getAscent(id)!;
  const gpx = fellGpx(requireFell(id), route, text.start);
  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}.gpx"`,
    },
  });
}
