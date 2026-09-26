// A fell's ascent as a GPX 1.1 file. The line is OpenStreetMap data, so the
// file is released under the ODbL with the notice in its metadata, as the
// licence asks of a Derivative Database (research: fell-route-data.md).

import type { Wainwright } from "@wainwrights/catalog/wainwrights";

import { type FellRoute, OSM_BASE } from "@/lib/fellRoutes";
import { fellPath } from "@/lib/fells";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export const ODBL_URL = "https://opendatacommons.org/licenses/odbl/1-0/";
export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const point = ([lon, lat]: [number, number]) =>
  `lat="${lat.toFixed(5)}" lon="${lon.toFixed(5)}"`;

export function fellGpx(
  fell: Wainwright,
  route: FellRoute,
  start: string,
): string {
  const name = `${fell.name} from ${start}`;
  const lats = route.line.map(([, lat]) => lat);
  const lons = route.line.map(([lon]) => lon);
  const bounds = `minlat="${Math.min(...lats).toFixed(5)}" minlon="${Math.min(...lons).toFixed(5)}" maxlat="${Math.max(...lats).toFixed(5)}" maxlon="${Math.max(...lons).toFixed(5)}"`;
  const summit = route.line[route.line.length - 1];

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${SITE_NAME}" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escape(name)}</name>
    <desc>${escape(`Desk-checked ascent of ${fell.name}, one way from the car park to the summit. Route data © OpenStreetMap contributors, made available under the Open Database Licence (ODbL) 1.0: ${ODBL_URL}. You may copy, share and adapt this file under that licence.`)}</desc>
    <author>
      <name>${SITE_NAME}</name>
    </author>
    <copyright author="OpenStreetMap contributors">
      <year>${OSM_BASE.slice(0, 4)}</year>
      <license>${ODBL_URL}</license>
    </copyright>
    <link href="${OSM_COPYRIGHT_URL}">
      <text>© OpenStreetMap contributors</text>
    </link>
    <link href="${absoluteUrl(fellPath(fell))}">
      <text>${escape(fell.name)} on ${SITE_NAME}</text>
    </link>
    <time>${OSM_BASE}</time>
    <bounds ${bounds}/>
  </metadata>
  <wpt ${point(route.line[0])}>
    <name>${escape(`Start: ${start}`)}</name>
    <sym>Parking Area</sym>
  </wpt>
  <wpt ${point(summit)}>
    <name>${escape(`${fell.name} summit`)}</name>
    <sym>Summit</sym>
  </wpt>
  <trk>
    <name>${escape(name)}</name>
    <trkseg>
${route.line.map((coord) => `      <trkpt ${point(coord)}/>`).join("\n")}
    </trkseg>
  </trk>
</gpx>
`;
}
