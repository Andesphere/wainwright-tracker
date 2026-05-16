import { describe, expect, it } from "vitest";

import {
  ALBUM_PRINT_WINDOW_FEATURES,
  buildAlbumExportDocument,
  openAlbumPrintWindow,
} from "./albumExport";
import type { WainwrightAlbumItem } from "./albums";
import type { Wainwright } from "./data/wainwrights";

function fell(id: string, name: string, bookNumber: number, latitude: number, longitude: number): Wainwright {
  return {
    id,
    name,
    bookNumber,
    heightMetres: 500 + bookNumber,
    heightFt: Math.round((500 + bookNumber) * 3.28084),
    gridReference: "NY000000",
    gridZone: "NY",
    gridEast: 0,
    gridNorth: 0,
    area: "Eastern Fells",
    latitude,
    longitude,
  };
}

function item(peak: Wainwright, completedAt = "2024-05-02"): WainwrightAlbumItem {
  return {
    completedAt,
    completedDateKey: completedAt.slice(0, 10),
    peak,
    entry: {
      id: peak.id,
      completedAt,
      note: `${peak.name} summit note`,
      photos: [
        {
          storageId: `${peak.id}-photo`,
          url: `https://example.com/${peak.id}.jpg`,
          originalName: `${peak.name} ridge photo`,
          uploadedAt: `${completedAt}T12:00:00Z`,
        },
      ],
    },
  };
}

describe("album PDF export document", () => {
  it("creates a print-ready A4 document with a top map thumbnail and all album fells", () => {
    const html = buildAlbumExportDocument({
      title: "2 May 2024",
      subtitle: "A day album from the Lake District",
      items: [
        item(fell("skiddaw", "Skiddaw", 1, 54.65, -3.15)),
        item(fell("helvellyn", "Helvellyn", 2, 54.52, -3.02)),
      ],
      heightUnit: "m",
    });

    expect(html).toContain("@page");
    expect(html).toContain("2 May 2024");
    expect(html).toContain("map-thumb");
    expect(html).toContain("All Wainwrights in this export");
    expect(html).toContain("Skiddaw");
    expect(html).toContain("Helvellyn");
    expect(html.match(/class="map-pin"/g)).toHaveLength(2);
  });

  it("uses a scalable photo layout and renders saved photos, notes, and placeholders", () => {
    const barePeak = fell("catbells", "Catbells", 3, 54.56, -3.17);
    const bareItem: WainwrightAlbumItem = {
      completedAt: "2024-05-03",
      completedDateKey: "2024-05-03",
      peak: barePeak,
      entry: { id: barePeak.id, completedAt: "2024-05-03" },
    };

    const html = buildAlbumExportDocument({
      title: "Whole history",
      subtitle: "Three Wainwrights across two albums",
      items: [item(fell("arnison", "Arnison Crag", 4, 54.53, -2.93)), bareItem],
      heightUnit: "ft",
    });

    expect(html).toContain("photo-mosaic");
    expect(html).toContain("https://example.com/arnison.jpg");
    expect(html).toContain("Arnison Crag summit note");
    expect(html).toContain("No photo saved yet");
    expect(html).toContain("ft");
  });

  it("escapes export text and keeps the printable popup writable", () => {
    const peak = fell("sharp", `<Sharp & "Crag">`, 5, 54.5, -3.1);
    const html = buildAlbumExportDocument({
      title: `<Whole & "history">`,
      subtitle: "Print <safe> & beautiful",
      items: [
        {
          completedAt: "2024-05-04",
          completedDateKey: "2024-05-04",
          peak,
          entry: {
            id: peak.id,
            completedAt: "2024-05-04",
            note: `Loved the <ridge> & "view"`,
            photos: Array.from({ length: 5 }, (_, index) => ({
              storageId: `photo-${index}`,
              url: `https://example.com/photo-${index}.jpg`,
              originalName: `<photo ${index}>`,
              uploadedAt: "2024-05-04T12:00:00Z",
            })),
          },
        },
      ],
      heightUnit: "m",
    });

    expect(html).toContain("&lt;Whole &amp; &quot;history&quot;&gt;");
    expect(html).toContain("Print &lt;safe&gt; &amp; beautiful");
    expect(html).toContain("Loved the &lt;ridge&gt; &amp; &quot;view&quot;");
    expect(html).toContain("&lt;Sharp &amp; &quot;Crag&quot;&gt;");
    expect(html).not.toContain("photo-4.jpg");
    expect(ALBUM_PRINT_WINDOW_FEATURES).not.toMatch(/noopener|noreferrer/);
  });

  it("writes printable html to a same-origin popup and nulls opener", () => {
    const writes: string[] = [];
    const popup = {
      opener: {} as unknown,
      document: {
        close: () => writes.push("close"),
        open: () => writes.push("open"),
        write: (html: string) => writes.push(html),
      },
    };
    const priorWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        open: (_url: string, _target: string, features: string) => {
          expect(features).toBe(ALBUM_PRINT_WINDOW_FEATURES);
          return popup;
        },
      },
    });

    try {
      openAlbumPrintWindow("<html>album</html>");
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: priorWindow,
      });
    }

    expect(popup.opener).toBeNull();
    expect(writes).toEqual(["open", "<html>album</html>", "close"]);
  });
});
