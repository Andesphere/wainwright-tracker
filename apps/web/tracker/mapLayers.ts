import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
  LayerSpecification,
  Map as MapboxMap,
} from "mapbox-gl";
import { type Book, heightLabel, WAINWRIGHTS } from "./fells";
import type { LightPreset } from "./lightClock";

/** Standard, and the two Pro layers. */
export type MapLayer = "standard" | "satellite" | "contours";

export const MAP_LAYERS: { id: MapLayer; title: string }[] = [
  { id: "standard", title: "Standard" },
  { id: "satellite", title: "Satellite" },
  { id: "contours", title: "Contours" },
];

export const IDS = {
  fells: "wb-fells",
  markers: "wb-fell-markers",
  labels: "wb-fell-labels",
  terrain: "wb-terrain-dem",
  hillshadeDem: "wb-hillshade-dem",
  hillshade: "wb-hillshade",
  contours: "wb-contours",
  contourLines: "wb-contour-lines",
  contourLabels: "wb-contour-labels",
} as const;

export const COLORS = {
  pine: "#1F4232",
  ink: "#112318",
  cream: "#FAFAE8",
  bracken: "#E3A23B",
  contour: "#8A6E4B",
  contourDark: "#C9B48F",
};

const FONT = ["DIN Pro Medium", "Arial Unicode MS Regular"];
const FONT_REGULAR = ["DIN Pro Regular", "Arial Unicode MS Regular"];

export const styleUrl = (layer: MapLayer) =>
  layer === "satellite"
    ? "mapbox://styles/mapbox/standard-satellite"
    : "mapbox://styles/mapbox/standard";

/** The basemap configuration: faded Standard, lit by the sun, without POI, transit and road clutter. */
export const basemapConfig = (layer: MapLayer, lightPreset: LightPreset) => ({
  ...(layer === "satellite" ? {} : { theme: "faded" }),
  lightPreset,
  showPointOfInterestLabels: false,
  showTransitLabels: false,
  showRoadLabels: false,
  showAdminBoundaries: false,
});

/** The 214 fells. Lower sort keys are placed first: bagged fells, then higher fells, win label space. */
export function fellCollection(
  bagged: Set<string>,
): GeoJSONSourceSpecification["data"] {
  return {
    type: "FeatureCollection",
    features: WAINWRIGHTS.map((fell) => ({
      type: "Feature",
      id: fell.id,
      geometry: { type: "Point", coordinates: [fell.longitude, fell.latitude] },
      properties: {
        id: fell.id,
        name: fell.name,
        height: heightLabel(fell),
        heightMetres: fell.heightMetres,
        book: fell.area,
        bagged: bagged.has(fell.id),
        sortKey: -fell.heightMetres - (bagged.has(fell.id) ? 2000 : 0),
      },
    })),
  };
}

/** "Helvellyn" over "950 m", or no label for fells below `minHeight`. */
const label = (minHeight: number): ExpressionSpecification => [
  "case",
  [">=", ["get", "heightMetres"], minHeight],
  [
    "format",
    ["get", "name"],
    {},
    "\n",
    {},
    ["get", "height"],
    { "font-scale": 0.82, "text-font": ["literal", FONT_REGULAR] },
  ],
  "",
];

const inBook = (book: Book | null): ExpressionSpecification =>
  book ? ["==", ["get", "book"], book.name] : ["literal", true];

export const markerOpacity = (
  selectedId: string | null,
  book: Book | null,
): ExpressionSpecification => [
  "case",
  // The selected fell is drawn by its pin; its invisible marker still keeps basemap labels away.
  ["==", ["get", "id"], selectedId ?? ""],
  0,
  inBook(book),
  1,
  0.3,
];

export const labelFilter = (book: Book | null) =>
  inBook(book) as FilterSpecification;

export const labelColors = (isDark: boolean) => ({
  "text-color": isDark ? "#F3F1E4" : COLORS.ink,
  "text-halo-color": isDark ? "rgba(11,26,18,0.85)" : "rgba(250,250,232,0.92)",
});

/** Markers that never hide, then name labels that give way to each other. */
export function fellLayers({
  book,
  isDark,
  selectedId,
}: {
  book: Book | null;
  isDark: boolean;
  selectedId: string | null;
}): LayerSpecification[] {
  return [
    {
      id: IDS.markers,
      type: "symbol",
      source: IDS.fells,
      layout: {
        "icon-image": [
          "case",
          ["boolean", ["get", "bagged"], false],
          "fell-bagged",
          "fell-to-go",
        ],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          0.45,
          10,
          0.62,
          12,
          0.85,
          14,
          1.05,
        ],
        // Markers always show, and labels (ours and the basemap's) keep clear of them.
        "icon-allow-overlap": true,
        "icon-ignore-placement": false,
        "symbol-sort-key": ["get", "sortKey"],
      },
      paint: {
        "icon-emissive-strength": 1,
        "icon-occlusion-opacity": 0.35,
        "icon-opacity": markerOpacity(selectedId, book),
      },
    },
    {
      id: IDS.labels,
      type: "symbol",
      source: IDS.fells,
      minzoom: 8.4,
      filter: labelFilter(book),
      layout: {
        // Zoomed out, only the big summits are named; more appear as you zoom in.
        "text-field": [
          "step",
          ["zoom"],
          label(870),
          10,
          label(700),
          11,
          label(450),
          12,
          label(0),
        ],
        "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10.5, 14, 13.5],
        "text-variable-anchor": ["top", "bottom", "left", "right"],
        "text-radial-offset": 1.05,
        "text-justify": "auto",
        "text-line-height": 1.1,
        "text-max-width": 8,
        "text-padding": 4,
        "symbol-sort-key": ["get", "sortKey"],
      },
      paint: {
        ...labelColors(isDark),
        "text-halo-width": 1.4,
        "text-halo-blur": 0.4,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 8.4, 0, 9, 1],
        "text-emissive-strength": 1,
        "text-occlusion-opacity": 0.3,
      },
    },
  ];
}

/**
 * Relief on top of Mapbox Standard: a soft hillshade and contour lines in the `bottom` slot,
 * above land and water but under roads and labels. Satellite keeps only the terrain (the imagery
 * has its own shadows); the Pro contours layer starts further out, draws heavier lines and labels
 * every fifth line instead of every tenth.
 */
export function reliefLayers(isDark: boolean, layer: MapLayer) {
  if (layer === "satellite") return [];
  const detailed = layer === "contours";
  const contourColor = isDark ? COLORS.contourDark : COLORS.contour;
  const layers: LayerSpecification[] = [
    {
      id: IDS.hillshade,
      type: "hillshade",
      source: IDS.hillshadeDem,
      slot: "bottom",
      paint: {
        "hillshade-exaggeration": isDark
          ? detailed
            ? 0.4
            : 0.3
          : detailed
            ? 0.7
            : 0.55,
        "hillshade-illumination-direction": 315,
        "hillshade-shadow-color": "rgba(31,58,43,0.5)",
        "hillshade-highlight-color": `rgba(255,255,255,${isDark ? 0.04 : 0.18})`,
        "hillshade-accent-color": "rgba(43,69,53,0.18)",
      },
    },
    {
      id: IDS.contourLines,
      type: "line",
      source: IDS.contours,
      "source-layer": "contour",
      slot: "bottom",
      minzoom: detailed ? 9.5 : 11,
      paint: {
        "line-color": contourColor,
        "line-width": [
          "case",
          ["==", ["get", "index"], 10],
          detailed ? 1.6 : 1.1,
          ["==", ["get", "index"], 5],
          detailed ? 1.1 : 0.75,
          detailed ? 0.6 : 0.45,
        ],
        "line-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          detailed ? 9.5 : 11,
          0,
          detailed ? 10.5 : 12,
          isDark ? (detailed ? 0.38 : 0.22) : detailed ? 0.5 : 0.3,
          15,
          isDark ? (detailed ? 0.55 : 0.32) : detailed ? 0.72 : 0.45,
        ],
      },
    },
    {
      id: IDS.contourLabels,
      type: "symbol",
      source: IDS.contours,
      "source-layer": "contour",
      slot: "bottom",
      minzoom: detailed ? 12 : 13.5,
      filter: detailed
        ? [">=", ["get", "index"], 5]
        : ["==", ["get", "index"], 10],
      layout: {
        "symbol-placement": "line",
        "text-field": ["concat", ["to-string", ["get", "ele"]], " m"],
        "text-font": FONT,
        "text-size": detailed ? 11 : 10,
      },
      paint: {
        "text-color": contourColor,
        "text-halo-color": isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)",
        "text-halo-width": 1,
      },
    },
  ];
  return layers;
}

/** Adds everything we draw to a freshly loaded style: terrain, relief and the fells. */
export function installLayers(
  map: MapboxMap,
  options: {
    bagged: Set<string>;
    book: Book | null;
    isDark: boolean;
    layer: MapLayer;
    selectedId: string | null;
  },
) {
  const { bagged, book, isDark, layer, selectedId } = options;
  const labelDark = isDark || layer === "satellite";

  if (!map.hasImage("fell-to-go")) {
    map.addImage("fell-to-go", markerImage(15, COLORS.cream, false), {
      pixelRatio: 3,
    });
    map.addImage("fell-bagged", markerImage(21, COLORS.bracken, true), {
      pixelRatio: 3,
    });
  }
  if (!map.getSource(IDS.terrain)) {
    map.addSource(IDS.terrain, {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }
  map.setTerrain({ source: IDS.terrain, exaggeration: 1.3 });

  replaceRelief(map, isDark, layer);

  if (!map.getSource(IDS.fells)) {
    map.addSource(IDS.fells, { type: "geojson", data: fellCollection(bagged) });
  }
  for (const spec of fellLayers({ book, isDark: labelDark, selectedId })) {
    if (!map.getLayer(spec.id)) map.addLayer(spec);
  }
}

/** Swaps the hillshade and contours for the given lighting and layer. */
export function replaceRelief(
  map: MapboxMap,
  isDark: boolean,
  layer: MapLayer,
) {
  for (const id of [IDS.contourLabels, IDS.contourLines, IDS.hillshade]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  const relief = reliefLayers(isDark, layer);
  if (relief.length === 0) return;
  if (!map.getSource(IDS.hillshadeDem)) {
    map.addSource(IDS.hillshadeDem, {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }
  if (!map.getSource(IDS.contours)) {
    map.addSource(IDS.contours, {
      type: "vector",
      url: "mapbox://mapbox.mapbox-terrain-v2",
    });
  }
  // The bottom slot keeps relief under the fell layers without a beforeId.
  for (const spec of relief) map.addLayer(spec);
}

/** A fell marker: a disc with a pine outline (and a pine tick when bagged), drawn at 3x. */
function markerImage(diameter: number, fill: string, check: boolean) {
  const scale = 3;
  const shadow = 3;
  const side = (diameter + shadow * 2) * scale;
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext("2d")!;
  context.scale(scale, scale);
  const centre = shadow + diameter / 2;

  context.shadowColor = "rgba(0,0,0,0.35)";
  context.shadowBlur = 2.5 * scale;
  context.shadowOffsetY = 1 * scale;
  context.fillStyle = COLORS.pine;
  context.beginPath();
  context.arc(centre, centre, diameter / 2, 0, Math.PI * 2);
  context.fill();
  context.shadowColor = "transparent";

  context.fillStyle = fill;
  context.beginPath();
  context.arc(centre, centre, diameter / 2 - 1.8, 0, Math.PI * 2);
  context.fill();

  if (check) {
    const unit = diameter / 21;
    context.strokeStyle = COLORS.pine;
    context.lineWidth = 2.3 * unit;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(shadow + 6.2 * unit, shadow + 10.8 * unit);
    context.lineTo(shadow + 9.2 * unit, shadow + 13.8 * unit);
    context.lineTo(shadow + 14.8 * unit, shadow + 7.6 * unit);
    context.stroke();
  }
  return context.getImageData(0, 0, side, side);
}
