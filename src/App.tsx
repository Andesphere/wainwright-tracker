import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import maplibregl, { Map as MaplibreMap, Popup } from "maplibre-gl";
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
  PencilEdit02Icon,
  ReloadIcon,
  Search01Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { buildPeakPopupHtml } from "@/peakPopup";
import {
  MAX_PHOTOS_PER_WAINWRIGHT,
  addPhotoMetadata,
  compressImageFile,
  type WainwrightPhotoMetadata,
} from "@/photoCompression";

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
export const DEFAULT_TOPO_ENABLED = false;
const OFFLINE_MAP_ESTIMATE = estimateLakeDistrictDownload();
const ALL_AREAS = "All";
const SHOW_OPTIONS = ["all", "todo", "done"] as const;
const VALID_WAINWRIGHT_IDS = new Set(WAINWRIGHTS.map((peak) => peak.id));

type ShowOnly = (typeof SHOW_OPTIONS)[number];
type CompletionEntry = {
  completedAt?: string;
  id: string;
  note?: string;
  photos?: WainwrightPhotoMetadata[];
};
type CompletionMetadata = Omit<CompletionEntry, "id">;

function loadCompleted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveCompletedMigration(completed: Set<string>) {
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
      bookNumber: peak.bookNumber,
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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

function App() {
  return (
    <>
      <Authenticated>
        <TrackerApp />
      </Authenticated>
      <Unauthenticated>
        <SignedOut>
          <AuthGate />
        </SignedOut>
      </Unauthenticated>
      <AuthLoading>
        <LoadingGate />
      </AuthLoading>
    </>
  );
}

function TrackerApp() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const completedMarkersRef = useRef<maplibregl.Marker[]>([]);

  const progress = useQuery(api.progress.get);
  const progressEntries = useQuery(api.progress.getEntries);
  const replaceProgress = useMutation(api.progress.replace);
  const setBagged = useMutation(api.progress.setBagged);
  const generatePhotoUploadUrl = useMutation(
    api.progress.generatePhotoUploadUrl,
  );
  const attachPhoto = useMutation(api.progress.attachPhoto);
  const migratedLocalProgressRef = useRef(false);
  const [optimisticCompleted, setOptimisticCompleted] =
    useState<Set<string> | null>(null);
  const [optimisticEntries, setOptimisticEntries] = useState<
    CompletionEntry[] | null
  >(null);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(ALL_AREAS);
  const [showOnly, setShowOnly] = useState<ShowOnly>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingCompletionPeak, setPendingCompletionPeak] =
    useState<Wainwright | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [topoEnabled, setTopoEnabled] = useState(DEFAULT_TOPO_ENABLED);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offlineProgress, setOfflineProgress] =
    useState<DownloadProgress | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<
    "idle" | "downloading" | "ready" | "error"
  >(() => (localStorage.getItem(OFFLINE_MAP_META_KEY) ? "ready" : "idle"));

  const serverCompleted = useMemo(
    () =>
      new Set((progress ?? []).filter((id) => VALID_WAINWRIGHT_IDS.has(id))),
    [progress],
  );
  const completed = optimisticCompleted ?? serverCompleted;
  const completionEntries =
    optimisticEntries ??
    (progressEntries ?? []).filter((entry) =>
      VALID_WAINWRIGHT_IDS.has(entry.id),
    );
  const completionEntriesById = useMemo(
    () => new Map(completionEntries.map((entry) => [entry.id, entry])),
    [completionEntries],
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
        peak.bookNumber.toString() === needle ||
        peak.gridReference.toLowerCase().includes(needle) ||
        peak.area.toLowerCase().includes(needle);
      const matchesArea = area === ALL_AREAS || peak.area === area;
      const matchesDone =
        showOnly === "all" || (showOnly === "done" ? done : !done);
      return matchesSearch && matchesArea && matchesDone;
    }).sort(
      (a, b) =>
        Number(completed.has(a.id)) - Number(completed.has(b.id)) ||
        a.bookNumber - b.bookNumber,
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

  const completedPeaks = useMemo(
    () => WAINWRIGHTS.filter((peak) => completed.has(peak.id)),
    [completed],
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

  useEffect(() => {
    if (!progress || migratedLocalProgressRef.current || progress.length > 0)
      return;
    const local = loadCompleted();
    const completed = Array.from(local).filter((id) =>
      VALID_WAINWRIGHT_IDS.has(id),
    );
    migratedLocalProgressRef.current = true;
    if (completed.length === 0) return;
    void replaceProgress({ completed }).then(() => {
      saveCompletedMigration(new Set(completed));
      toast.success(`Imported ${completed.length} saved fells`);
    });
  }, [progress, replaceProgress]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: MaplibreMap;
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
        cluster: false,
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
          "circle-radius": 15,
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
          "circle-radius": [
            "case",
            ["boolean", ["get", "done"], false],
            13,
            12,
          ],
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
      map.addLayer({
        id: "peak-hit-area",
        type: "circle",
        source: "peaks",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 22, 12, 30],
          "circle-color": "#ffffff",
          "circle-opacity": 0,
        },
      });
      map.addLayer({
        id: "peak-numbers",
        type: "symbol",
        source: "peaks",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["to-string", ["get", "bookNumber"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": 10.5,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: { "text-color": "#1f2d23" },
      });

      map.on("click", "clusters", (event: maplibregl.MapLayerMouseEvent) => {
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

      map.on("click", "peak-hit-area", (event: maplibregl.MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id;
        if (typeof id === "string") setSelectedId(id);
      });

      map.on("click", (event: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ["peak-hit-area", "clusters"],
        });
        if (features.length === 0) setSelectedId(null);
      });

      map.on("mouseenter", "peak-hit-area", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "peak-hit-area", () => {
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

    const resizeMap = () => {
      map.resize();
    };
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(mapContainer.current);
    window.addEventListener("resize", resizeMap);
    window.visualViewport?.addEventListener("resize", resizeMap);
    requestAnimationFrame(resizeMap);
    map.once("idle", resizeMap);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeMap);
      window.visualViewport?.removeEventListener("resize", resizeMap);
      popupRef.current?.remove();
      popupRef.current = null;
      completedMarkersRef.current.forEach((marker) => marker.remove());
      completedMarkersRef.current = [];
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

    completedMarkersRef.current.forEach((marker) => marker.remove());
    completedMarkersRef.current = completedPeaks.map((peak) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "completed-peak-pin";
      element.textContent = "📌";
      element.title = `${peak.name} bagged`;
      element.setAttribute("aria-label", `${peak.name} bagged`);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        setSelectedId(peak.id);
      });

      return new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([peak.longitude, peak.latitude])
        .addTo(map);
    });

    return () => {
      completedMarkersRef.current.forEach((marker) => marker.remove());
      completedMarkersRef.current = [];
    };
  }, [completedPeaks, mapReady]);

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
    if (!map) return;
    if (!selectedPeak) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }
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
      .setHTML(buildPeakPopupHtml(selectedPeak, completed.has(selectedPeak.id)))
      .addTo(map);

    const popupElement = popupRef.current.getElement();
    const actionButton = popupElement.querySelector<HTMLButtonElement>(
      `[data-peak-id="${selectedPeak.id}"]`,
    );
    actionButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (completed.has(selectedPeak.id)) {
        void unbagPeak(selectedPeak);
        return;
      }
      setPendingCompletionPeak(selectedPeak);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, selectedPeak]);

  const savePeakCompletion = async (
    peak: Wainwright,
    metadata: CompletionMetadata = {},
  ) => {
    const existingEntry = completionEntriesById.get(peak.id);
    setOptimisticCompleted((previous) => {
      const baseline = previous ?? completed;
      const next = new Set(baseline);
      next.add(peak.id);
      return next;
    });
    setOptimisticEntries((previous) => {
      const baseline = previous ?? completionEntries;
      return [
        ...baseline.filter((entry) => entry.id !== peak.id),
        {
          ...existingEntry,
          id: peak.id,
          ...metadata,
          photos: existingEntry?.photos,
        },
      ].sort((a, b) => a.id.localeCompare(b.id));
    });

    try {
      await setBagged({ id: peak.id, bagged: true, ...metadata });
      toast.success(`${peak.name} bagged — ${peak.heightMetres}m`);
    } catch {
      setOptimisticCompleted((previous) => {
        const baseline = previous ?? completed;
        const next = new Set(baseline);
        next.delete(peak.id);
        return next;
      });
      setOptimisticEntries((previous) => {
        const baseline = previous ?? completionEntries;
        return baseline.filter((entry) => entry.id !== peak.id);
      });
      toast.error("Could not save progress. Please try again.");
    }
  };

  const uploadPeakPhoto = async (peak: Wainwright, file: File) => {
    const existingEntry = completionEntriesById.get(peak.id);
    const currentPhotos = existingEntry?.photos ?? [];
    if (currentPhotos.length >= MAX_PHOTOS_PER_WAINWRIGHT) {
      toast.error(`Only ${MAX_PHOTOS_PER_WAINWRIGHT} photos per fell`);
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      const uploadUrl = await generatePhotoUploadUrl({});
      const upload = await fetch(uploadUrl, {
        body: compressed,
        headers: { "Content-Type": compressed.type },
        method: "POST",
      });
      if (!upload.ok) throw new Error("Upload failed");
      const { storageId } = (await upload.json()) as { storageId: string };
      await attachPhoto({
        id: peak.id,
        mimeType: compressed.type,
        originalName: file.name,
        sizeBytes: compressed.size,
        storageId: storageId as Id<"_storage">,
      });

      const optimisticPhoto: WainwrightPhotoMetadata = {
        mimeType: compressed.type,
        originalName: file.name,
        sizeBytes: compressed.size,
        storageId,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(compressed),
      };
      setOptimisticCompleted((previous) => {
        const baseline = previous ?? completed;
        const next = new Set(baseline);
        next.add(peak.id);
        return next;
      });
      setOptimisticEntries((previous) => {
        const baseline = previous ?? completionEntries;
        const entry = baseline.find((item) => item.id === peak.id) ?? {
          id: peak.id,
        };
        return [
          ...baseline.filter((item) => item.id !== peak.id),
          {
            ...entry,
            photos: addPhotoMetadata(entry.photos ?? [], optimisticPhoto),
          },
        ].sort((a, b) => a.id.localeCompare(b.id));
      });
      toast.success("Photo saved to this fell");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save photo";
      toast.error(message);
    }
  };

  async function unbagPeak(peak: Wainwright) {
    setOptimisticCompleted((previous) => {
      const baseline = previous ?? completed;
      const next = new Set(baseline);
      next.delete(peak.id);
      return next;
    });
    setOptimisticEntries((previous) => {
      const baseline = previous ?? completionEntries;
      return baseline.filter((entry) => entry.id !== peak.id);
    });

    try {
      await setBagged({ id: peak.id, bagged: false });
      toast(`${peak.name} marked as unbagged`);
    } catch {
      setOptimisticCompleted((previous) => {
        const baseline = previous ?? completed;
        const next = new Set(baseline);
        next.add(peak.id);
        return next;
      });
      setOptimisticEntries((previous) => {
        const baseline = previous ?? completionEntries;
        const restored = completionEntriesById.get(peak.id) ?? { id: peak.id };
        return [
          ...baseline.filter((entry) => entry.id !== peak.id),
          restored,
        ].sort((a, b) => a.id.localeCompare(b.id));
      });
      toast.error("Could not save progress. Please try again.");
    }
  }

  const togglePeak = (peak: Wainwright) => {
    if (completed.has(peak.id)) {
      void unbagPeak(peak);
      return;
    }
    setPendingCompletionPeak(peak);
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

  const showAllFells = () => {
    setSelectedId(null);
    popupRef.current?.remove();
    popupRef.current = null;
    fitLakeDistrict();
  };

  const downloadOfflineMap = async () => {
    setOfflineStatus("downloading");
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
      toast.success("Lake District map saved for offline use");
    } catch (error) {
      setOfflineStatus("error");
      const message =
        error instanceof Error
          ? error.message
          : "Could not download the map. Please try again.";
      toast.error(message);
    }
  };

  const resetProgress = () => {
    if (completed.size === 0) return;
    setOptimisticCompleted(new Set());
    setOptimisticEntries([]);
    void replaceProgress({ completed: [] })
      .then(() => toast("Journal reset"))
      .catch(() => {
        setOptimisticCompleted(completed);
        setOptimisticEntries(completionEntries);
        toast.error("Could not reset progress. Please try again.");
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
      completionEntriesById={completionEntriesById}
      doneCount={doneCount}
      filtered={filtered}
      highestDone={highestDone}
      numericPercent={numericPercent}
      onArea={setArea}
      onClearQuery={() => setQuery("")}
      onQuery={setQuery}
      onReset={resetProgress}
      onSelect={(id) => {
        setSelectedId(id);
        setMobileOpen(false);
      }}
      onShowOnly={setShowOnly}
      onEdit={(peak) => {
        setPendingCompletionPeak(peak);
        setMobileOpen(false);
      }}
      onToggle={togglePeak}
      percent={percent}
      query={query}
      selectedId={selectedId}
      showOnly={showOnly}
    />
  );

  return (
    <main className="relative grid min-h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_min(440px,38vw)]">
      <CompletionDialog
        key={pendingCompletionPeak?.id ?? "closed"}
        initialMetadata={
          pendingCompletionPeak
            ? completionEntriesById.get(pendingCompletionPeak.id)
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) setPendingCompletionPeak(null);
        }}
        onPhotoUpload={(file) => {
          if (!pendingCompletionPeak) return Promise.resolve();
          return uploadPeakPhoto(pendingCompletionPeak, file);
        }}
        onSave={(metadata) => {
          if (!pendingCompletionPeak) return;
          void savePeakCompletion(pendingCompletionPeak, metadata).then(() => {
            setPendingCompletionPeak(null);
          });
        }}
        open={Boolean(pendingCompletionPeak)}
        peak={pendingCompletionPeak}
        photos={
          pendingCompletionPeak
            ? (completionEntriesById.get(pendingCompletionPeak.id)?.photos ??
              [])
            : []
        }
      />

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

        {/* Floating top-left progress card */}
        <div className="mobile-map-brand absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex items-center gap-3 rounded-2xl border border-white/50 bg-parchment/90 px-3 py-2.5 shadow-lg backdrop-blur-xl sm:left-8 sm:right-auto sm:top-8 sm:min-w-[13rem] sm:max-w-[88vw] sm:gap-4 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-inner sm:size-10">
              <HugeiconsIcon
                icon={MountainIcon}
                className="size-5"
                strokeWidth={1.6}
              />
            </span>
            <div
              className="mobile-brand-progress flex shrink-0 items-end gap-2 pl-1 text-left sm:gap-3"
              aria-label={`${doneCount} of ${TOTAL_WAINWRIGHTS} Wainwrights bagged, ${percent}% complete`}
            >
              <span className="font-mono text-[15px] font-semibold leading-none tracking-tight text-ink sm:text-base">
                {doneCount}/{TOTAL_WAINWRIGHTS}
              </span>
              <span className="font-display text-[22px] italic leading-none text-ink sm:text-2xl">
                {percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Floating top-right map controls */}
        <div className="mobile-map-controls absolute right-4 top-[calc(env(safe-area-inset-top)+4.75rem)] z-10 flex items-center gap-2 sm:right-8 sm:top-8">
          <SignedIn>
            <div className="grid size-10 place-items-center rounded-full border border-white/50 bg-parchment/85 shadow-sm backdrop-blur-xl sm:size-11">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                className="rounded-full border-white/50 bg-parchment/85 backdrop-blur-xl"
                onClick={showAllFells}
                aria-label={selectedPeak ? "show all fells" : "re-centre map"}
              >
                <HugeiconsIcon icon={CompassIcon} strokeWidth={1.6} />
                <span className="sr-only">
                  {selectedPeak ? "show all fells" : "re-centre map"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {selectedPeak ? "show all fells" : "re-centre on the lakes"}
            </TooltipContent>
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
                size="icon-lg"
                className={cn(
                  "rounded-full backdrop-blur-xl max-[520px]:hidden",
                  offlineStatus === "ready"
                    ? ""
                    : "border-white/50 bg-parchment/85",
                )}
                disabled={offlineStatus === "downloading"}
                onClick={downloadOfflineMap}
                aria-label={
                  offlineStatus === "downloading"
                    ? `downloading lakes ${offlinePercent}%`
                    : "download lakes"
                }
              >
                <HugeiconsIcon icon={Download04Icon} strokeWidth={1.6} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              download the full Wainwright map area
            </TooltipContent>
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

        {selectedPeak && (
          <Button
            variant="outline"
            size="sm"
            className="absolute right-4 top-[calc(env(safe-area-inset-top)+7.75rem)] z-10 rounded-full border-white/60 bg-parchment/90 shadow-lg backdrop-blur-xl sm:right-8 sm:top-[calc(env(safe-area-inset-top)+5.4rem)]"
            onClick={showAllFells}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
            show all fells
          </Button>
        )}

        <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-10 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="mobile-search-trigger h-14 w-full justify-center gap-3 rounded-full border-white/60 bg-parchment/95 px-5 text-xl font-bold text-ink shadow-lg backdrop-blur-xl"
                onClick={() => setMobileOpen(true)}
                aria-label="open search"
              >
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="size-7"
                  strokeWidth={2}
                />
                <span>Search</span>
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

      <Toaster richColors position="top-center" />
    </main>
  );
}

function AuthGate() {
  return (
    <main className="grid min-h-dvh place-items-center bg-parchment p-5 text-ink">
      <Card className="w-full max-w-md border-border/70 bg-card/90 p-6 shadow-sm">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon
            icon={MountainIcon}
            className="size-5"
            strokeWidth={1.6}
          />
        </span>
        <p className="mt-5 font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
          the lake district · 214 fells
        </p>
        <h1 className="mt-1 font-display text-4xl italic leading-none">
          fells journal
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sign in to keep your Wainwright progress private and synced through
          Convex.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <SignInButton mode="modal">
            <Button className="rounded-full">sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline" className="rounded-full">
              create account
            </Button>
          </SignUpButton>
        </div>
      </Card>
      <Toaster richColors position="top-center" />
    </main>
  );
}

function LoadingGate() {
  return (
    <main className="grid min-h-dvh place-items-center bg-parchment p-5 text-ink">
      <div className="font-mono text-xs tracking-[0.22em] text-muted-foreground">
        loading journal
      </div>
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
  completionEntriesById: Map<string, CompletionEntry>;
  doneCount: number;
  filtered: Wainwright[];
  highestDone?: Wainwright;
  numericPercent: number;
  onArea: (area: string) => void;
  onClearQuery: () => void;
  onQuery: (query: string) => void;
  onReset: () => void;
  onSelect: (id: string) => void;
  onEdit: (peak: Wainwright) => void;
  onShowOnly: (value: ShowOnly) => void;
  onToggle: (peak: Wainwright) => void;
  percent: string;
  query: string;
  selectedId: string | null;
  showOnly: ShowOnly;
};

function Journal(props: JournalProps) {
  const {
    area,
    completed,
    completionEntriesById,
    doneCount,
    filtered,
    highestDone,
    numericPercent,
    onArea,
    onClearQuery,
    onQuery,
    onReset,
    onSelect,
    onEdit,
    onShowOnly,
    onToggle,
    percent,
    query,
    selectedId,
    showOnly,
  } = props;
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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

        <details className="advanced-options group rounded-2xl border border-border/70 bg-background/45 px-3 py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl text-sm font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span>Advanced</span>
            <span className="text-xs transition-transform group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-semibold text-destructive">
              Reset all progress
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This will reset all of your bagged fells, dates, notes, and saved
              photos from your journal.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              className="mt-3 rounded-full"
            >
              <HugeiconsIcon icon={ReloadIcon} strokeWidth={1.6} /> Reset all
            </Button>
          </div>
        </details>

        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="reset-confirmation-dialog">
            <DialogHeader>
              <DialogTitle>Reset all progress?</DialogTitle>
              <DialogDescription>
                This will reset all of your bagged fells, dates, notes, and
                saved photos. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setResetDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onReset();
                  setResetDialogOpen(false);
                }}
              >
                Reset all progress
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                completionEntry={completionEntriesById.get(peak.id)}
                done={done}
                selected={selected}
                onSelect={() => onSelect(peak.id)}
                onEdit={() => onEdit(peak)}
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
        hills, cc by 4.0. progress is stored privately to your account.
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

function formatCompletionDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function CompletionDialog({
  initialMetadata,
  onOpenChange,
  onPhotoUpload,
  onSave,
  open,
  peak,
  photos,
}: {
  initialMetadata?: CompletionEntry;
  onOpenChange: (open: boolean) => void;
  onPhotoUpload: (file: File) => Promise<void>;
  onSave: (metadata: CompletionMetadata) => void;
  open: boolean;
  peak: Wainwright | null;
  photos: WainwrightPhotoMetadata[];
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [completedAt, setCompletedAt] = useState(
    () => initialMetadata?.completedAt ?? "",
  );
  const [note, setNote] = useState(() => initialMetadata?.note ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isEditing = Boolean(initialMetadata);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      completedAt: completedAt || undefined,
      note: note.trim() || undefined,
    });
  };

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      await onPhotoUpload(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!peak) return null;

  const form = (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label
          htmlFor="completion-date"
          className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground"
        >
          date bagged
        </label>
        <Input
          id="completion-date"
          type="date"
          value={completedAt}
          onChange={(event) => setCompletedAt(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="completion-note"
          className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground"
        >
          note
        </label>
        <Textarea
          id="completion-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Weather, route, company, summit snack..."
        />
      </div>

      <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/55 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
              photos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Max {MAX_PHOTOS_PER_WAINWRIGHT}; images are resized before Convex
              upload.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {photos.length}/{MAX_PHOTOS_PER_WAINWRIGHT}
          </Badge>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.storageId}
                className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
              >
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.originalName ?? `${peak.name} photo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center px-2 text-center text-xs text-muted-foreground">
                    photo saved
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <label className="inline-flex">
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            disabled={
              uploadingPhoto || photos.length >= MAX_PHOTOS_PER_WAINWRIGHT
            }
            onChange={(event) => {
              void handlePhotoChange(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          <span
            className={cn(
              "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent",
              (uploadingPhoto || photos.length >= MAX_PHOTOS_PER_WAINWRIGHT) &&
                "pointer-events-none cursor-not-allowed opacity-50",
            )}
          >
            <HugeiconsIcon
              icon={Upload04Icon}
              className="size-4"
              strokeWidth={1.6}
            />
            {uploadingPhoto ? "compressing + saving…" : "add photo"}
          </span>
        </label>
      </div>

      {isDesktop ? (
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            cancel
          </Button>
          <Button type="submit">
            {isEditing ? "save changes" : "save as bagged"}
          </Button>
        </DialogFooter>
      ) : (
        <DrawerFooter>
          <Button type="submit" size="lg">
            {isEditing ? "save changes" : "save as bagged"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            cancel
          </Button>
        </DrawerFooter>
      )}
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{peak.name}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edit the date, note, and photos saved for this bag."
                : "Add a date and note for this bag. Both are optional."}
            </DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="completion-drawer-content overflow-hidden">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>{peak.name}</DrawerTitle>
          <DrawerDescription>
            {isEditing
              ? "Edit the date, note, and photos saved for this bag."
              : "Add a date and note for this bag. Both are optional."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="completion-drawer-body min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {form}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* -------------------------------------------------------------------------
 * Single peak row — like a journal entry. Click select, check bag.
 * -----------------------------------------------------------------------*/

function PeakRow({
  peak,
  completionEntry,
  done,
  selected,
  onSelect,
  onEdit,
  onToggle,
}: {
  peak: Wainwright;
  completionEntry?: CompletionEntry;
  done: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const completionMeta = [
    completionEntry?.completedAt &&
      `bagged ${formatCompletionDate(completionEntry.completedAt)}`,
    completionEntry?.note,
  ].filter(Boolean);

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
          <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-parchment font-mono text-[11px] font-semibold text-ink">
            {peak.bookNumber}
          </span>
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
        {done && completionMeta.length > 0 && (
          <div className="mt-2 line-clamp-2 text-xs leading-snug text-muted-foreground">
            {completionMeta.join(" · ")}
          </div>
        )}
      </button>

      <div className="flex items-stretch">
        {done && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onEdit}
                aria-label={`edit ${peak.name}`}
                className="flex w-11 items-center justify-center border-l border-border/60 text-primary transition-colors hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none"
              >
                <HugeiconsIcon
                  icon={PencilEdit02Icon}
                  className="size-4"
                  strokeWidth={1.7}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>edit bag details</TooltipContent>
          </Tooltip>
        )}

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
    </div>
  );
}
