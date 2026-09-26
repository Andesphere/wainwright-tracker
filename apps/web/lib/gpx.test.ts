import { describe, expect, it } from "vitest";

import { getFellRoute } from "@/lib/fellRoutes";
import { requireFell } from "@/lib/fells";
import { fellGpx, ODBL_URL } from "@/lib/gpx";

describe("fell GPX", () => {
  const route = getFellRoute("catbells")!;
  const gpx = fellGpx(requireFell("catbells"), route, "roadside parking");
  const doc = new DOMParser().parseFromString(gpx, "application/xml");
  const ns = "http://www.topografix.com/GPX/1/1";

  it("is well-formed GPX 1.1", () => {
    expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(doc.documentElement.getAttribute("version")).toBe("1.1");
    expect(doc.documentElement.namespaceURI).toBe(ns);
  });

  it("carries the ODbL notice and the OSM credit in its metadata", () => {
    const metadata = doc.getElementsByTagNameNS(ns, "metadata")[0];
    expect(metadata.getElementsByTagNameNS(ns, "license")[0].textContent).toBe(
      ODBL_URL,
    );
    expect(
      metadata
        .getElementsByTagNameNS(ns, "copyright")[0]
        .getAttribute("author"),
    ).toBe("OpenStreetMap contributors");
    expect(
      metadata.getElementsByTagNameNS(ns, "desc")[0].textContent,
    ).toContain("© OpenStreetMap contributors");
  });

  it("holds the whole line, the start and the summit", () => {
    expect(doc.getElementsByTagNameNS(ns, "trkpt")).toHaveLength(
      route.line.length,
    );
    const names = [...doc.getElementsByTagNameNS(ns, "wpt")].map(
      (wpt) => wpt.getElementsByTagNameNS(ns, "name")[0].textContent,
    );
    expect(names).toEqual(["Start: roadside parking", "Catbells summit"]);
  });
});
