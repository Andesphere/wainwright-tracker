import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Backpack03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CompassIcon,
  Download04Icon,
  EyeIcon,
  FilterIcon,
  GpsSignal01Icon,
  Layers01Icon,
  Menu02Icon,
  MountainIcon,
  ReloadIcon,
  Search01Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  AREAS,
  TOTAL_WAINWRIGHTS,
  WAINWRIGHTS,
  type Wainwright,
} from "@/data/wainwrights";
import {
  downloadLakeDistrictMap,
  estimateLakeDistrictDownload,
  type DownloadProgress,
} from "@/offlineMap";

const STORAGE_KEY = "wainwright-tracker:v1:completed";
const OFFLINE_MAP_META_KEY = "wainwright-tracker:v1:offline-map";
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const OFFLINE_MAP_ESTIMATE = estimateLakeDistrictDownload();
const ALL_AREAS = "All";
const SHOW_OPTIONS = ["all", "todo", "done"] as const;
const VALID_WAINWRIGHT_IDS = new Set(WAINWRIGHTS.map((peak) => peak.id));

type ShowOnly = (typeof SHOW_OPTIONS)[number];

function loadCompleted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveCompleted(completed: Set<string>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(Array.from(completed).sort()),
  );
}

function peakFeature(peak: Wainwright, done: boolean) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [peak.longitude, peak.latitude],
    },
    properties: {
      id: peak.id,
      name: peak.name,
      heightMetres: peak.heightMetres,
      heightFt: peak.heightFt,
      gridReference: peak.gridReference,
      area: peak.area,
      done,
    },
  };
}

function formatPercent(count: number) {
  const percent = progressPercent(count);
  if (count > 0 && percent < 10) return percent.toFixed(1);
  return Math.round(percent).toString();
}

function progressPercent(count: number) {
  return (count / TOTAL_WAINWRIGHTS) * 100;
}

function isShowOnly(value: string): value is ShowOnly {
  return SHOW_OPTIONS.includes(value as ShowOnly);
}

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [completed, setCompleted] = useState<Set<string>>(() =>
    loadCompleted(),
  );
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(ALL_AREAS);
  const [showOnly, setShowOnly] = useState<ShowOnly>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [topoEnabled, setTopoEnabled] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState<DownloadProgress | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<
    "idle" | "downloading" | "ready" | "error"
  >(() => (localStorage.getItem(OFFLINE_MAP_META_KEY) ? "ready" : "idle"));
  const [offlineMessage, setOfflineMessage] = useState(() =>
    localStorage.getItem(OFFLINE_MAP_META_KEY)
      ? "Lake District topo map saved on this device."
      : "",
  );

  const selectedPeak = useMemo(
    () => WAINWRIGHTS.find((peak) => peak.id === selectedId) ?? null,
    [selectedId],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return WAINWRIGHTS.filter((peak) => {
      const done = completed.has(peak.id);
      const matchesSearch =
        !needle ||
        peak.name.toLowerCase().includes(needle) ||
        peak.gridReference.toLowerCase().includes(needle) ||
        peak.area.toLowerCase().includes(needle);
      const matchesArea = area === ALL_AREAS || peak.area === area;
      const matchesDone =
        showOnly === "all" || (showOnly === "done" ? done : !done);
      return matchesSearch && matchesArea && matchesDone;
    }).sort(
      (a, b) =>
        Number(completed.has(a.id)) - Number(completed.has(b.id)) ||
        b.heightMetres - a.heightMetres,
    );
  }, [area, completed, query, showOnly]);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: filtered.map((peak) =>
        peakFeature(peak, completed.has(peak.id)),
      ),
    }),
    [completed, filtered],
  );

  const doneCount = completed.size;
  const percent = formatPercent(doneCount);
  const numericPercent = progressPercent(doneCount);
  const highestDone = useMemo(
    () =>
      WAINWRIGHTS.reduce<Wainwright | undefined>((highest, peak) => {
        if (!completed.has(peak.id)) return highest;
        if (!highest || peak.heightMetres > highest.heightMetres) return peak;
        return highest;
      }, undefined),
    [completed],
  );

  useEffect(() => saveCompleted(completed), [completed]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: Map;
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [-3.12, 54.52],
        zoom: 8.8,
        maxZoom: 16,
        minZoom: 7,
        attributionControl: false,
      });
    } catch (error) {
      console.warn("Map failed to initialise", error);
      queueMicrotask(() => setMapError(true));
      return;
    }

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.GeolocateControl({
        trackUserLocation: true,
        positionOptions: { enableHighAccuracy: true },
      }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    map.on("load", () => {
      map.addSource("topo", {
        type: "raster",
        tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          "Map data: © OpenStreetMap contributors, SRTM | Style: © OpenTopoMap (CC-BY-SA)",
      });
      map.addLayer({
        id: "topo-layer",
        type: "raster",
        source: "topo",
        paint: { "raster-opacity": 0.42, "raster-saturation": -0.1 },
      });

      map.addSource("peaks", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 11,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "peaks",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#74a98a",
            12,
            "#d9b06a",
            30,
            "#a04444",
          ],
          "circle-radius": ["step", ["get", "point_count"], 18, 12, 24, 30, 31],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#fbf7ec",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "peaks",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
        },
        paint: { "text-color": "#1f2d23" },
      });
      map.addLayer({
        id: "peaks-shadow",
        type: "circle",
        source: "peaks",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 10,
          "circle-color": "#000",
          "circle-opacity": 0.16,
          "circle-translate": [0, 2],
        },
      });
      map.addLayer({
        id: "peaks",
        type: "circle",
        source: "peaks",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": ["case", ["boolean", ["get", "done"], false], 8, 7],
          "circle-color": [
            "case",
            ["boolean", ["get", "done"], false],
            "#2fbf71",
            "#fffaf0",
          ],
          "circle-stroke-color": [
            "case",
            ["boolean", ["get", "done"], false],
            "#0b5d3b",
            "#1f2d23",
          ],
          "circle-stroke-width": [
            "case",
            ["boolean", ["get", "done"], false],
            2.5,
            1.5,
          ],
        },
      });

      map.on("click", "clusters", (event) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("peaks") as maplibregl.GeoJSONSource;
        if (clusterId === undefined) return;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [
              number,
              number,
            ],
            zoom,
          });
        });
      });

      map.on("click", "peaks", (event) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id;
        if (typeof id === "string") setSelectedId(id);
      });

      map.on("mouseenter", "peaks", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "peaks", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "zoom-in";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current = null;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = mapReady
      ? (mapRef.current?.getSource("peaks") as
          | maplibregl.GeoJSONSource
          | undefined)
      : undefined;
    source?.setData(geojson);
  }, [geojson, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer("topo-layer"))
      map.setLayoutProperty(
        "topo-layer",
        "visibility",
        topoEnabled ? "visible" : "none",
      );
  }, [topoEnabled, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPeak) return;
    map.easeTo({
      center: [selectedPeak.longitude, selectedPeak.latitude],
      zoom: Math.max(map.getZoom(), 12.2),
      duration: 850,
    });
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      offset: 18,
      className: "peak-popup",
    })
      .setLngLat([selectedPeak.longitude, selectedPeak.latitude])
      .setHTML(
        `<strong>${selectedPeak.name}</strong><span>${selectedPeak.heightMetres}m · ${selectedPeak.gridReference}</span>`,
      )
      .addTo(map);
  }, [selectedPeak]);

  const togglePeak = (peak: Wainwright) => {
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(peak.id)) {
        next.delete(peak.id);
        toast(`${peak.name} marked as unbagged`);
      } else {
        next.add(peak.id);
        toast.success(`${peak.name} bagged — ${peak.heightMetres}m`);
      }
      return next;
    });
  };

  const fitLakeDistrict = () => {
    mapRef.current?.fitBounds(
      [
        [-3.42, 54.31],
        [-2.74, 54.75],
      ],
      { padding: 48, duration: 900 },
    );
  };

  const downloadOfflineMap = async () => {
    setOfflineStatus("downloading");
    setOfflineMessage("Downloading every topo tile for the Wainwright area…");
    setTopoEnabled(true);

    try {
      const result = await downloadLakeDistrictMap(setOfflineProgress);
      const savedAt = new Date().toISOString();
      localStorage.setItem(
        OFFLINE_MAP_META_KEY,
        JSON.stringify({
          savedAt,
          ...result,
          minZoom: OFFLINE_MAP_ESTIMATE.minZoom,
          maxZoom: OFFLINE_MAP_ESTIMATE.maxZoom,
        }),
      );
      setOfflineStatus("ready");
      setOfflineMessage(
        `Lake District map saved: ${result.total.toLocaleString()} tiles, zoom ${OFFLINE_MAP_ESTIMATE.minZoom}-${OFFLINE_MAP_ESTIMATE.maxZoom}.`,
      );
      toast.success("Lake District map saved for offline use");
    } catch (error) {
      setOfflineStatus("error");
      const message =
        error instanceof Error
          ? error.message
          : "Could not download the map. Please try again.";
      setOfflineMessage(message);
      toast.error(message);
    }
  };

  const exportProgress = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      completed: Array.from(completed).sort(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wainwright-progress.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Progress exported");
  };

  const importProgress = async (file: File) => {
    try {
      const json = JSON.parse(await file.text());
      const ids = Array.isArray(json) ? json : json.completed;
      if (!Array.isArray(ids)) throw new Error("Invalid file");
      const next = new Set(
        ids.filter(
          (id: unknown) =>
            typeof id === "string" && VALID_WAINWRIGHT_IDS.has(id),
        ),
      );
      setCompleted(next);
      toast.success(`Imported ${next.size} bagged fells`);
    } catch {
      toast.error("Could not read that file");
    }
  };

  const resetProgress = () => {
    setCompleted((previous) => {
      if (previous.size === 0) return previous;
      toast("Journal reset");
      return new Set();
    });
  };

  const offlineDownloaded =
    offlineProgress?.downloaded ??
    (offlineStatus === "ready" ? OFFLINE_MAP_ESTIMATE.tileCount : 0);
  const offlineTotal = offlineProgress?.total ?? OFFLINE_MAP_ESTIMATE.tileCount;
  const offlinePercent = Math.round((offlineDownloaded / offlineTotal) * 100);

  const journal = (
    <Journal
      area={area}
      completed={completed}
      doneCount={doneCount}
      filtered={filtered}
      highestDone={highestDone}
      numericPercent={numericPercent}
      onArea={setArea}
      onClearQuery={() => setQuery("")}
      onDownloadOfflineMap={downloadOfflineMap}
      onExport={exportProgress}
      onImportClick={() => fileInputRef.current?.click()}
      onQuery={setQuery}
      onReset={resetProgress}
      onSelect={(id) => {
        setSelectedId(id);
        setMobileOpen(false);
      }}
      onShowOnly={setShowOnly}
      onToggle={togglePeak}
      offlineMessage={offlineMessage}
      offlinePercent={offlinePercent}
      offlineStatus={offlineStatus}
      percent={percent}
      query={query}
      selectedId={selectedId}
      showOnly={showOnly}
    />
  );

  return (
    <main className="relative grid min-h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_min(440px,38vw)]">
      {/* Map stage --------------------------------------------------------- */}
      <section
        className="relative h-dvh p-2.5 sm:p-4 lg:p-5"
        aria-label="Wainwright map"
      >
        <div
          ref={mapContainer}
          className="h-full w-full overflow-hidden rounded-[1.35rem] bg-[#d8dcc8] shadow-[0_30px_90px_-30px_rgba(20,28,18,0.55)] ring-1 ring-black/5 sm:rounded-3xl"
        />
        {mapError && (
          <div className="absolute inset-2.5 grid place-items-center rounded-[1.35rem] bg-parchment/95 p-6 text-center shadow-inner sm:inset-4 sm:rounded-3xl lg:inset-5">
            <div className="max-w-sm">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <HugeiconsIcon icon={MountainIcon} strokeWidth={1.6} />
              </span>
              <h2 className="mt-4 font-display text-3xl italic text-ink">
                map unavailable
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This browser could not start the interactive map, but your
                journal, search, filters, import, export, and progress tracking
                still work.
              </p>
            </div>
          </div>
        )}
        {/* Decorative inner frame */}
        <div className="pointer-events-none absolute inset-2.5 rounded-[1.35rem] ring-1 ring-white/30 sm:inset-4 sm:rounded-3xl lg:inset-5" />

        {/* Floating top-left brand card */}
        <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex max-w-[calc(100vw-8.75rem)] items-center gap-2.5 rounded-2xl border border-white/50 bg-parchment/90 px-3 py-2.5 shadow-lg backdrop-blur-xl sm:left-8 sm:top-8 sm:max-w-[88vw] sm:gap-3 sm:px-4 sm:py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-inner sm:size-10">
            <HugeiconsIcon
              icon={MountainIcon}
              className="size-5"
              strokeWidth={1.6}
            />
          </span>
          <div className="leading-tight">
            <p className="truncate font-mono text-[9px] tracking-[0.14em] text-muted-foreground sm:text-[10px] sm:tracking-[0.18em]">
              the lake district · 214 fells
            </p>
            <h1 className="truncate font-display text-[20px] italic leading-none text-ink sm:text-[22px]">
              fells journal
            </h1>
          </div>
        </div>

        {/* Floating top-right map controls */}
        <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex items-center gap-2 sm:right-8 sm:top-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                className="rounded-full border-white/50 bg-parchment/85 backdrop-blur-xl"
                onClick={fitLakeDistrict}
              >
                <HugeiconsIcon icon={CompassIcon} strokeWidth={1.6} />
                <span className="sr-only">re-centre map</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>re-centre on the lakes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={topoEnabled ? "default" : "outline"}
                size="lg"
                className={cn(
                  "rounded-full px-2 backdrop-blur-xl max-[389px]:size-9 max-[389px]:px-0 sm:px-2.5",
                  topoEnabled ? "" : "border-white/50 bg-parchment/85",
                )}
                onClick={() => setTopoEnabled((value) => !value)}
              >
                <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.6} />
                <span className="max-[389px]:sr-only">topo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {topoEnabled ? "hide" : "show"} contour overlay
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={offlineStatus === "ready" ? "default" : "outline"}
                size="lg"
                className={cn(
                  "rounded-full px-2 backdrop-blur-xl max-[520px]:hidden sm:px-2.5",
                  offlineStatus === "ready"
                    ? ""
                    : "border-white/50 bg-parchment/85",
                )}
                disabled={offlineStatus === "downloading"}
                onClick={downloadOfflineMap}
              >
                <HugeiconsIcon icon={Download04Icon} strokeWidth={1.6} />
                <span>
                  {offlineStatus === "downloading"
                    ? `${offlinePercent}%`
                    : "download lakes"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>download the full Wainwright map area</TooltipContent>
          </Tooltip>

          {/* Mobile: drawer trigger */}
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full border-white/50 bg-parchment/85 backdrop-blur-xl lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <HugeiconsIcon icon={Menu02Icon} strokeWidth={1.6} />
            <span className="sr-only">open journal</span>
          </Button>
        </div>

        <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-10 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full justify-between rounded-full border-white/60 bg-parchment/90 px-4 shadow-lg backdrop-blur-xl"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <HugeiconsIcon icon={Backpack03Icon} strokeWidth={1.6} />
                  <span className="truncate font-mono text-xs">
                    {doneCount}/{TOTAL_WAINWRIGHTS} bagged
                  </span>
                </span>
                <span className="font-display text-lg italic">{percent}%</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[92dvh] max-h-[760px] overflow-hidden rounded-t-3xl border-border/70 bg-sidebar/95 p-0 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl"
            >
              <SheetTitle className="sr-only">fells journal</SheetTitle>
              <SheetDescription className="sr-only">
                Search, filter, import, export, and mark Wainwright fells as
                bagged.
              </SheetDescription>
              <div className="h-full overflow-auto journal-scroll">
                {mobileOpen && journal}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Bottom-left ambient stats — desktop only */}
        <div className="pointer-events-none absolute bottom-8 left-8 z-10 hidden items-center gap-3 rounded-full border border-white/50 bg-parchment/85 px-4 py-2 font-mono text-xs text-ink/80 shadow-md backdrop-blur-xl lg:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> {doneCount}{" "}
            bagged
          </span>
          <span className="text-ink/30">·</span>
          <span>{TOTAL_WAINWRIGHTS - doneCount} to go</span>
        </div>
      </section>

      {/* Journal column --------------------------------------------------- */}
      <aside className="hidden h-dvh overflow-hidden border-l border-border/70 bg-sidebar/70 backdrop-blur-2xl lg:block">
        <div className="h-full overflow-auto journal-scroll">{journal}</div>
      </aside>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="application/json"
        onChange={(event) =>
          event.target.files?.[0] && importProgress(event.target.files[0])
        }
      />

      <Toaster richColors position="top-center" />
    </main>
  );
}

export default App;

/* -------------------------------------------------------------------------
 * Journal — the editorial right-hand column.
 * -----------------------------------------------------------------------*/

type JournalProps = {
  area: string;
  completed: Set<string>;
  doneCount: number;
  filtered: Wainwright[];
  highestDone?: Wainwright;
  numericPercent: number;
  onArea: (area: string) => void;
  onClearQuery: () => void;
  onDownloadOfflineMap: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onQuery: (query: string) => void;
  onReset: () => void;
  onSelect: (id: string) => void;
  onShowOnly: (value: ShowOnly) => void;
  onToggle: (peak: Wainwright) => void;
  offlineMessage: string;
  offlinePercent: number;
  offlineStatus: "idle" | "downloading" | "ready" | "error";
  percent: string;
  query: string;
  selectedId: string | null;
  showOnly: ShowOnly;
};

function Journal(props: JournalProps) {
  const {
    area,
    completed,
    doneCount,
    filtered,
    highestDone,
    numericPercent,
    onArea,
    onClearQuery,
    onDownloadOfflineMap,
    onExport,
    onImportClick,
    onQuery,
    onReset,
    onSelect,
    onShowOnly,
    onToggle,
    offlineMessage,
    offlinePercent,
    offlineStatus,
    percent,
    query,
    selectedId,
    showOnly,
  } = props;

  return (
    <div className="flex min-h-full flex-col gap-5 px-4 pb-10 pt-6 sm:gap-6 sm:px-7 sm:pt-7">
      {/* Hero — sentence-case, serif-italic */}
      <HeroProgress
        doneCount={doneCount}
        percent={percent}
        numericPercent={numericPercent}
        highestDone={highestDone}
      />

      {/* Search + filters */}
      <Card className="gap-3 border-border/70 bg-card/85 p-3.5 shadow-sm sm:p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2">
          <HugeiconsIcon
            icon={Search01Icon}
            className="size-4 text-muted-foreground"
            strokeWidth={1.6}
          />
          <Input
            className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:border-transparent"
            placeholder="search a fell, grid ref or area…"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClearQuery}
              aria-label="clear search"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                className="size-3"
                strokeWidth={2}
              />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <Select value={area} onValueChange={onArea}>
            <SelectTrigger className="h-9 rounded-xl">
              <HugeiconsIcon
                icon={FilterIcon}
                className="size-3.5"
                strokeWidth={1.6}
              />
              <SelectValue placeholder="area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_AREAS}>all areas</SelectItem>
              {AREAS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            value={showOnly}
            onValueChange={(value) => {
              if (isShowOnly(value)) onShowOnly(value);
            }}
            className="rounded-xl bg-muted/70 p-1"
          >
            <ToggleGroupItem
              value="all"
              className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              all
            </ToggleGroupItem>
            <ToggleGroupItem
              value="todo"
              className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              to go
            </ToggleGroupItem>
            <ToggleGroupItem
              value="done"
              className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              bagged
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Separator className="my-1" />

        <div className="grid grid-cols-2 gap-2 min-[420px]:flex min-[420px]:flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="rounded-full"
          >
            <HugeiconsIcon icon={Download04Icon} strokeWidth={1.6} /> export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onImportClick}
            className="rounded-full"
          >
            <HugeiconsIcon icon={Upload04Icon} strokeWidth={1.6} /> import
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="col-span-2 rounded-full text-muted-foreground hover:text-destructive min-[420px]:ml-auto"
          >
            <HugeiconsIcon icon={ReloadIcon} strokeWidth={1.6} /> reset
          </Button>
        </div>
      </Card>

      <Card
        className={cn(
          "gap-3 border-border/70 bg-card/85 p-4 shadow-sm",
          offlineStatus === "ready" && "border-primary/40 bg-primary/5",
          offlineStatus === "error" && "border-destructive/40 bg-destructive/5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
              offline map
            </p>
            <h3 className="mt-1 font-display text-2xl italic leading-none text-ink">
              download the lakes
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Saves {OFFLINE_MAP_ESTIMATE.tileCount.toLocaleString()} topo
              tiles covering the full Wainwright area, zoom {OFFLINE_MAP_ESTIMATE.minZoom}-
              {OFFLINE_MAP_ESTIMATE.maxZoom}.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 rounded-full"
            disabled={offlineStatus === "downloading"}
            onClick={onDownloadOfflineMap}
          >
            <HugeiconsIcon icon={Download04Icon} strokeWidth={1.6} />
            {offlineStatus === "ready"
              ? "refresh"
              : offlineStatus === "downloading"
                ? "saving"
                : "download"}
          </Button>
        </div>
        {(offlineStatus === "downloading" || offlineStatus === "ready") && (
          <Progress value={offlinePercent} className="h-2 rounded-full bg-muted" />
        )}
        {offlineMessage && (
          <p
            className={cn(
              "font-mono text-[10px] leading-relaxed text-muted-foreground",
              offlineStatus === "error" && "text-destructive",
            )}
          >
            {offlineMessage}
          </p>
        )}
      </Card>

      {/* Result meta */}
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] tracking-wider text-muted-foreground">
        <span>
          {filtered.length} shown ·{" "}
          {area === ALL_AREAS ? "all areas" : area.toLowerCase()}
        </span>
        <span className="shrink-0">
          {TOTAL_WAINWRIGHTS - doneCount} remaining
        </span>
      </div>

      {/* Peak list */}
      <ol className="grid gap-2.5 pb-4">
        {filtered.map((peak) => {
          const done = completed.has(peak.id);
          const selected = selectedId === peak.id;
          return (
            <li key={peak.id}>
              <PeakRow
                peak={peak}
                done={done}
                selected={selected}
                onSelect={() => onSelect(peak.id)}
                onToggle={() => onToggle(peak)}
              />
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center text-sm text-muted-foreground">
            no fells match those filters yet — try widening your search.
          </li>
        )}
      </ol>

      <footer className="border-t border-border/70 pt-4 font-mono text-[10px] leading-relaxed text-muted-foreground/80">
        data: thomaswilsonxyz/wainwright-peaks + database of british and irish
        hills, cc by 4.0. progress is stored privately in this browser.
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Hero progress card — big serif-italic number, ring + bar, calm copy.
 * -----------------------------------------------------------------------*/

function HeroProgress({
  doneCount,
  percent,
  numericPercent,
  highestDone,
}: {
  doneCount: number;
  percent: string;
  numericPercent: number;
  highestDone?: Wainwright;
}) {
  const status = highestDone
    ? `highest bagged · ${highestDone.name} (${highestDone.heightMetres}m)`
    : "no fells bagged yet — pick one and start walking.";

  return (
    <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-parchment/60 p-0 shadow-sm">
      <div className="relative grid grid-cols-[1fr_auto] items-end gap-3 p-5 sm:gap-4 sm:p-6">
        {/* subtle contour map texture */}
        <div
          aria-hidden
          className="contour-texture pointer-events-none absolute inset-0 opacity-[0.18]"
        />
        <div className="relative">
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
            your tally
          </p>
          <h2 className="mt-1 flex items-baseline gap-2 font-display text-[52px] italic leading-[0.9] tracking-tight text-ink sm:text-[64px]">
            {doneCount}
            <span className="font-mono text-sm not-italic text-muted-foreground sm:text-base">
              / {TOTAL_WAINWRIGHTS}
            </span>
          </h2>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground sm:text-sm">
            <span className="font-display italic text-foreground">
              {percent}%
            </span>{" "}
            of the wainwrights bagged.
            <br className="hidden sm:block" />
            {status}
          </p>
        </div>

        <ProgressRing percent={numericPercent} />
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <Progress
          value={numericPercent}
          className="h-2.5 rounded-full bg-muted"
        />
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon
              icon={Backpack03Icon}
              className="size-3"
              strokeWidth={1.6}
            />{" "}
            on the trail
          </span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon
              icon={GpsSignal01Icon}
              className="size-3"
              strokeWidth={1.6}
            />{" "}
            {TOTAL_WAINWRIGHTS - doneCount} ahead
          </span>
        </div>
      </div>
    </Card>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const safe = Math.min(100, Math.max(0, percent));
  const label = safe < 10 ? safe.toFixed(1) : Math.round(safe).toString();
  return (
    <div
      role="img"
      aria-label={`${Math.round(safe)} percent complete`}
      className="relative grid size-20 place-items-center rounded-full shadow-inner sm:size-24"
      style={{
        background: `conic-gradient(var(--color-primary) ${safe}%, color-mix(in oklab, var(--moss) 12%, var(--parchment)) 0)`,
      }}
    >
      <div className="grid size-[78%] place-items-center rounded-full bg-parchment shadow">
        <span className="font-display text-[19px] italic leading-none text-ink sm:text-[22px]">
          {label}
          <span className="font-mono text-[10px] not-italic text-muted-foreground">
            %
          </span>
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Single peak row — like a journal entry. Click select, check bag.
 * -----------------------------------------------------------------------*/

function PeakRow({
  peak,
  done,
  selected,
  onSelect,
  onToggle,
}: {
  peak: Wainwright;
  done: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "group/peak relative grid grid-cols-[1fr_auto] items-stretch overflow-hidden rounded-2xl border bg-card/85 transition-all",
        "border-border/80 hover:border-primary/40 hover:bg-card",
        selected && "border-primary/70 ring-2 ring-primary/30",
        done && "bg-primary/[0.06]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 px-3.5 py-3 text-left outline-none focus-visible:bg-accent/40 sm:px-4"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-display text-lg italic leading-tight tracking-tight text-foreground",
              done && "text-primary",
            )}
          >
            {peak.name}
          </span>
          {done && (
            <Badge
              variant="default"
              className="h-5 rounded-full bg-primary/15 px-2 text-[10px] font-medium text-primary"
            >
              bagged
            </Badge>
          )}
        </div>
        <div className="mt-1 truncate font-mono text-[11px] tracking-wide text-muted-foreground">
          {peak.heightMetres}m · {peak.heightFt}ft · {peak.gridReference} ·{" "}
          {peak.area.toLowerCase()}
        </div>
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              done ? `mark ${peak.name} unbagged` : `mark ${peak.name} bagged`
            }
            className={cn(
              "flex w-12 items-center justify-center border-l border-border/60 transition-colors",
              done
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-primary",
            )}
          >
            {done ? (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-5"
                strokeWidth={1.6}
              />
            ) : (
              <HugeiconsIcon
                icon={EyeIcon}
                className="size-4"
                strokeWidth={1.6}
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {done ? "mark unbagged" : "mark as bagged"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
