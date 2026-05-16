import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAction, useMutation, useQuery } from "convex/react";
import maplibregl, { Map as MaplibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Backpack03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CompassIcon,
  EyeIcon,
  FilterIcon,
  Layers01Icon,
  Menu02Icon,
  MountainIcon,
  PencilEdit02Icon,
  ReloadIcon,
  Search01Icon,
  Upload04Icon,
  UserAdd01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserSearch01Icon,
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
import {
  buildBulkReviewRows,
  countImportableRows,
  parseDelimitedImportText,
  type BulkReviewRow,
} from "@/bulkImport";
import {
  MAX_PHOTOS_PER_WAINWRIGHT,
  addPhotoMetadata,
  compressImageFile,
  removePhotoMetadata,
  validatePhotoSelectionLimit,
  type WainwrightPhotoMetadata,
} from "@/photoCompression";

import {
  AREAS,
  TOTAL_WAINWRIGHTS,
  WAINWRIGHTS,
  type Wainwright,
} from "@/data/wainwrights";
import { downloadLakeDistrictMap } from "@/offlineMap";
import {
  loadTopoPreference,
  startAutoOfflineTopoDownload,
  storeTopoPreference,
} from "@/mapPreferences";
import { sortWainwrightsForJournal, type JournalSort } from "@/mapSorting";

const STORAGE_KEY = "wainwright-tracker:v1:completed";
const HEIGHT_UNIT_KEY = "wainwright-tracker:v1:height-unit";
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ALL_AREAS = "All";
const SHOW_OPTIONS = ["all", "todo", "done"] as const;
const HEIGHT_UNITS = ["m", "ft"] as const;
const VALID_WAINWRIGHT_IDS = new Set(WAINWRIGHTS.map((peak) => peak.id));

type ShowOnly = (typeof SHOW_OPTIONS)[number];
type HeightUnit = (typeof HEIGHT_UNITS)[number];
type CompletionEntry = {
  completedAt?: string;
  id: string;
  note?: string;
  photos?: WainwrightPhotoMetadata[];
};
type CompletionMetadata = Omit<CompletionEntry, "id">;
type PendingPhoto = {
  file: File;
  id: string;
  previewUrl: string;
};
type BaggerSummary = {
  completedCount: number;
  displayName: string;
  email?: string;
  followersCount: number;
  followingCount: number;
  imageUrl?: string;
  isFollowing: boolean;
  isSelf: boolean;
  photoUrls: string[];
  updatedAt?: number;
  userId: string;
};

const IMPORTABLE_FILE_TYPES = ".csv,.txt,.md,.docx,.xls,.xlsx";
const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_TEXT_CHARS = 40_000;

async function extractBulkImportText(file: File) {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error(
      "Import files must be under 2MB. Split the list or paste the fells instead.",
    );
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return workbook.SheetNames.map((sheetName) =>
      XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]),
    ).join("\n");
  }

  if (lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  }

  return file.text();
}

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

function isHeightUnit(value: string): value is HeightUnit {
  return HEIGHT_UNITS.includes(value as HeightUnit);
}

function loadHeightUnitPreference(): HeightUnit {
  try {
    const stored = localStorage.getItem(HEIGHT_UNIT_KEY);
    return stored && isHeightUnit(stored) ? stored : "m";
  } catch {
    return "m";
  }
}

function storeHeightUnitPreference(unit: HeightUnit) {
  localStorage.setItem(HEIGHT_UNIT_KEY, unit);
}

function formatPeakHeight(peak: Wainwright, heightUnit: HeightUnit) {
  return heightUnit === "ft" ? `${peak.heightFt}ft` : `${peak.heightMetres}m`;
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
    <AppErrorBoundary>
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
    </AppErrorBoundary>
  );
}

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  label: string;
};

type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error(`${this.props.label} crashed`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryBase
      label="Wainwright tracker"
      fallback={
        <main className="grid min-h-dvh place-items-center bg-parchment px-6 text-center text-ink">
          <Card className="max-w-sm rounded-3xl border-border/70 bg-card/90 p-6 shadow-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              app error
            </p>
            <h1 className="mt-2 font-display text-4xl italic text-foreground">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The tracker hit a temporary problem. Refresh the page to try again.
            </p>
            <Button
              type="button"
              className="mt-5 rounded-full"
              onClick={() => window.location.reload()}
            >
              Reload app
            </Button>
          </Card>
        </main>
      }
    >
      {children}
    </ErrorBoundaryBase>
  );
}

function FeatureErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryBase
      label="Wainwright tracker section"
      fallback={
        <div className="rounded-3xl border border-destructive/25 bg-destructive/5 p-5 text-center">
          <p className="font-semibold text-foreground">
            We could not load this section
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Close it and try again in a moment.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundaryBase>
  );
}

function TrackerApp() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const completedMarkersRef = useRef<maplibregl.Marker[]>([]);

  const progress = useQuery(api.progress.get);
  const progressEntries = useQuery(api.progress.getEntries);
  const replaceProgress = useMutation(api.progress.replace);
  const setBagged = useMutation(api.progress.setBagged);
  const generatePhotoUploadUrl = useMutation(
    api.progress.generatePhotoUploadUrl,
  );
  const followBagger = useMutation(api.social.follow);
  const unfollowBagger = useMutation(api.social.unfollow);
  const upsertCurrentProfile = useMutation(api.social.upsertCurrentProfile);
  const migratedLocalProgressRef = useRef(false);
  const [optimisticCompleted, setOptimisticCompleted] =
    useState<Set<string> | null>(null);
  const [optimisticEntries, setOptimisticEntries] = useState<
    CompletionEntry[] | null
  >(null);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(ALL_AREAS);
  const [showOnly, setShowOnly] = useState<ShowOnly>("all");
  const [sortBy, setSortBy] = useState<JournalSort>("progress");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingCompletionPeak, setPendingCompletionPeak] =
    useState<Wainwright | null>(null);
  const [selectedDetailsOpen, setSelectedDetailsOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [topoEnabled, setTopoEnabled] = useState(loadTopoPreference);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    loadHeightUnitPreference,
  );
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [selectedBaggerId, setSelectedBaggerId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

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
  const selectedEntry = selectedPeak
    ? completionEntriesById.get(selectedPeak.id)
    : undefined;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortWainwrightsForJournal(
      WAINWRIGHTS.filter((peak) => {
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
      }),
      { completed, entriesById: completionEntriesById, sortBy },
    );
  }, [area, completed, completionEntriesById, query, showOnly, sortBy]);

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

  const baggerResults =
    (useQuery(
      api.social.searchBaggers,
      peopleOpen ? { query: peopleQuery } : "skip",
    ) as BaggerSummary[] | undefined) ?? [];
  const selectedBaggerProfile = useQuery(
    api.social.getProfile,
    selectedBaggerId ? { userId: selectedBaggerId } : "skip",
  ) as BaggerSummary | null | undefined;

  const doneCount = completed.size;
  const percent = formatPercent(doneCount);

  const handleToggleFollow = async (bagger: BaggerSummary) => {
    const action = bagger.isFollowing ? unfollowBagger : followBagger;
    await action({ userId: bagger.userId });
    toast.success(
      bagger.isFollowing
        ? `Unfollowed ${bagger.displayName}`
        : `Following ${bagger.displayName}`,
    );
  };

  useEffect(() => {
    void upsertCurrentProfile();
  }, [upsertCurrentProfile]);

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

      map.on(
        "click",
        "peak-hit-area",
        (event: maplibregl.MapLayerMouseEvent) => {
          const feature = event.features?.[0];
          const id = feature?.properties?.id;
          if (typeof id === "string") setSelectedId(id);
        },
      );

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
      element.className = cn(
        "completed-peak-pin",
        selectedId === peak.id && "completed-peak-pin-selected",
      );
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
  }, [completedPeaks, mapReady, selectedId]);

  useEffect(() => {
    storeTopoPreference(topoEnabled);
  }, [topoEnabled]);

  useEffect(() => {
    storeHeightUnitPreference(heightUnit);
  }, [heightUnit]);

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
    if (!mapReady) return;

    let cancelled = false;
    const run = () => {
      if (cancelled || document.visibilityState === "hidden") return;
      void startAutoOfflineTopoDownload({
        download: downloadLakeDistrictMap,
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(run, { timeout: 4_000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(run, 1_500);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedPeak) return;

    map.easeTo({
      center: [selectedPeak.longitude, selectedPeak.latitude],
      zoom: Math.max(map.getZoom(), 12.2),
      offset: [0, window.innerWidth < 1024 ? -130 : 0],
      duration: 850,
    });
  }, [mapReady, selectedPeak]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("peaks")) return;

    const selectedFilter = selectedPeak
      ? ["==", ["get", "id"], selectedPeak.id]
      : ["==", ["get", "id"], ""];
    map.setPaintProperty("peaks", "circle-radius", [
      "case",
      selectedFilter,
      18,
      ["boolean", ["get", "done"], false],
      13,
      12,
    ]);
    map.setPaintProperty("peaks", "circle-stroke-color", [
      "case",
      selectedFilter,
      "#fbf7ec",
      ["boolean", ["get", "done"], false],
      "#0b5d3b",
      "#1f2d23",
    ]);
    map.setPaintProperty("peaks", "circle-stroke-width", [
      "case",
      selectedFilter,
      5,
      ["boolean", ["get", "done"], false],
      2.5,
      1.5,
    ]);
  }, [mapReady, selectedPeak]);

  const uploadPendingPhotos = async (files: File[]) => {
    const uploaded: WainwrightPhotoMetadata[] = [];
    for (const file of files) {
      const compressed = await compressImageFile(file);
      const uploadUrl = await generatePhotoUploadUrl({});
      const upload = await fetch(uploadUrl, {
        body: compressed,
        headers: { "Content-Type": compressed.type },
        method: "POST",
      });
      if (!upload.ok) throw new Error("Upload failed");
      const { storageId } = (await upload.json()) as { storageId: string };
      uploaded.push({
        mimeType: compressed.type,
        originalName: file.name,
        sizeBytes: compressed.size,
        storageId,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(compressed),
      });
    }
    return uploaded;
  };

  const savePeakCompletion = async (
    peak: Wainwright,
    metadata: CompletionMetadata = {},
    photoFiles: File[] = [],
  ) => {
    const existingEntry = completionEntriesById.get(peak.id);
    const previousCompleted = new Set(completed);
    const previousEntries = completionEntries;

    try {
      const uploadedPhotos = await uploadPendingPhotos(photoFiles);
      const photos = uploadedPhotos.reduce(
        (nextPhotos, photo) => addPhotoMetadata(nextPhotos, photo),
        metadata.photos ?? existingEntry?.photos ?? [],
      );
      const nextEntry: CompletionEntry = {
        ...existingEntry,
        id: peak.id,
        ...metadata,
        photos,
      };

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
          nextEntry,
        ].sort((a, b) => a.id.localeCompare(b.id));
      });

      await setBagged({
        id: peak.id,
        bagged: true,
        completedAt: metadata.completedAt,
        note: metadata.note,
        photos: photos.map(
          ({ mimeType, originalName, sizeBytes, storageId, uploadedAt }) => ({
            mimeType,
            originalName,
            sizeBytes,
            storageId: storageId as Id<"_storage">,
            uploadedAt,
          }),
        ),
      });
      toast.success(`${peak.name} bagged — ${peak.heightMetres}m`);
    } catch (error) {
      setOptimisticCompleted(previousCompleted);
      setOptimisticEntries(previousEntries);
      const message =
        error instanceof Error
          ? error.message
          : "Could not save progress. Please try again.";
      toast.error(message);
      throw error;
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
    setSelectedDetailsOpen(false);
    fitLakeDistrict();
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

  const bulkAddFells = async (ids: string[]) => {
    const nextCompleted = Array.from(new Set([...completed, ...ids])).sort();
    const nextEntries = nextCompleted.map(
      (id) => completionEntriesById.get(id) ?? { id },
    );

    setOptimisticCompleted(new Set(nextCompleted));
    setOptimisticEntries(nextEntries);

    try {
      await replaceProgress({ completed: nextCompleted });
      toast.success(`Added ${ids.length} bagged fells`);
    } catch {
      setOptimisticCompleted(completed);
      setOptimisticEntries(completionEntries);
      toast.error("Could not save imported fells. Please try again.");
      throw new Error("Bulk import failed");
    }
  };

  const journal = (
    <Journal
      area={area}
      completed={completed}
      completionEntriesById={completionEntriesById}
      doneCount={doneCount}
      filtered={filtered}
      heightUnit={heightUnit}
      onArea={setArea}
      onClearQuery={() => setQuery("")}
      onQuery={setQuery}
      onReset={resetProgress}
      onSort={setSortBy}
      onSelect={(id) => {
        setSelectedId(id);
        setMobileSearchOpen(false);
      }}
      onShowOnly={setShowOnly}
      onEdit={(peak) => {
        setPendingCompletionPeak(peak);
        setMobileSearchOpen(false);
      }}
      onToggle={togglePeak}
      onBulkAdd={bulkAddFells}
      query={query}
      selectedId={selectedId}
      showOnly={showOnly}
      sortBy={sortBy}
    />
  );

  const heightPreferenceControl = (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          height unit
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the single height measurement shown in fell lists.
        </p>
      </div>
      <ToggleGroup
        type="single"
        value={heightUnit}
        onValueChange={(value) => {
          if (isHeightUnit(value)) setHeightUnit(value);
        }}
        className="grid grid-cols-2 rounded-xl bg-muted/60 p-1"
      >
        <ToggleGroupItem
          value="m"
          className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          metres
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ft"
          className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          feet
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
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
        onSave={(metadata, photoFiles) => {
          if (!pendingCompletionPeak) return Promise.resolve();
          return savePeakCompletion(
            pendingCompletionPeak,
            metadata,
            photoFiles,
          ).then(() => {
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
        className={cn(
          "relative h-dvh p-2.5 sm:p-4 lg:p-5",
          selectedPeak && "has-selected-fell",
        )}
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
        <div
          className="mobile-map-brand absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex items-center justify-between gap-3 rounded-2xl border border-white/50 bg-parchment/90 px-3 py-2.5 shadow-lg backdrop-blur-xl sm:left-8 sm:right-auto sm:top-8 sm:min-w-[13rem] sm:max-w-[88vw] sm:gap-4 sm:px-4 sm:py-3"
          aria-label={`${doneCount} of ${TOTAL_WAINWRIGHTS} Wainwrights bagged, ${percent}% complete`}
        >
          <div className="mobile-brand-progress flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-inner sm:size-10">
              <HugeiconsIcon
                icon={MountainIcon}
                className="size-5"
                strokeWidth={1.6}
              />
            </span>
            <span className="font-mono text-[15px] font-semibold leading-none tracking-tight text-ink sm:text-base">
              {doneCount}/{TOTAL_WAINWRIGHTS}
            </span>
          </div>
          <span className="mobile-brand-percent ml-auto shrink-0 font-display text-[22px] italic leading-none text-ink sm:text-2xl">
            {percent}%
          </span>
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

          {/* Mobile: drawer trigger */}
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full border-white/50 bg-parchment/85 backdrop-blur-xl lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="open menu"
          >
            <HugeiconsIcon icon={Menu02Icon} strokeWidth={1.6} />
            <span className="sr-only">open menu</span>
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

        <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-10 lg:bottom-8 lg:left-8 lg:right-auto lg:w-[26rem]">
          {selectedPeak ? (
            <SelectedFellCard
              completed={completed.has(selectedPeak.id)}
              entry={selectedEntry}
              heightUnit={heightUnit}
              onBag={() => setPendingCompletionPeak(selectedPeak)}
              onClose={() => {
                setSelectedId(null);
                setSelectedDetailsOpen(false);
              }}
              onDetails={() => setSelectedDetailsOpen(true)}
              onEdit={() => setPendingCompletionPeak(selectedPeak)}
              onSearch={() => {
                setSelectedId(null);
                setSelectedDetailsOpen(false);
                setMobileSearchOpen(true);
              }}
              onUnbag={() => void unbagPeak(selectedPeak)}
              open={selectedDetailsOpen}
              onOpenChange={setSelectedDetailsOpen}
              peak={selectedPeak}
            />
          ) : (
            <div className="mobile-action-bar flex gap-2 lg:hidden">
              <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="mobile-search-trigger h-14 basis-[82%] justify-center gap-3 rounded-full border-white/60 bg-parchment/95 px-5 text-xl font-bold text-ink shadow-lg backdrop-blur-xl"
                    onClick={() => setMobileSearchOpen(true)}
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
                    {mobileSearchOpen && journal}
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="icon-lg"
                className="mobile-baggers-trigger h-14 min-w-14 flex-1 rounded-full border-white/60 bg-ink/90 text-white shadow-lg backdrop-blur-xl hover:bg-ink hover:text-white"
                onClick={() => setPeopleOpen(true)}
                aria-label="find other baggers"
              >
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  className="size-7"
                  strokeWidth={1.8}
                />
              </Button>
            </div>
          )}
        </div>

        <FeatureErrorBoundary>
          <PeopleDiscoverySheet
            open={peopleOpen}
            onOpenChange={(open) => {
              setPeopleOpen(open);
              if (!open) setSelectedBaggerId(null);
            }}
            query={peopleQuery}
            onQuery={setPeopleQuery}
            results={baggerResults}
            selectedProfile={selectedBaggerProfile ?? null}
            selectedUserId={selectedBaggerId}
            onSelectProfile={setSelectedBaggerId}
            onToggleFollow={(bagger) => void handleToggleFollow(bagger)}
          />
        </FeatureErrorBoundary>

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent
            side="right"
            className="mobile-sidebar-open flex h-dvh w-[min(88vw,22rem)] flex-col overflow-hidden border-border/70 bg-sidebar/95 p-0 backdrop-blur-2xl lg:hidden"
          >
            <SheetTitle className="sr-only">menu</SheetTitle>
            <SheetDescription className="sr-only">
              Open the configuration settings drawer.
            </SheetDescription>
            <div className="flex h-full flex-col gap-4 overflow-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] journal-scroll">
              <div className="rounded-2xl border border-border/70 bg-card/85 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  menu
                </p>
                <h2 className="mt-1 font-display text-3xl italic text-foreground">
                  Fells Journal
                </h2>
              </div>

              <button
                type="button"
                aria-label="open configuration"
                className="mobile-configuration-trigger flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background/80 p-4 text-left shadow-xs transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setMobileSettingsOpen(true);
                }}
              >
                <span>
                  <span className="block text-lg font-semibold text-foreground">
                    Configuration
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Display units and map preferences
                  </span>
                </span>
                <span className="text-2xl leading-none text-muted-foreground">
                  ›
                </span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <SheetContent
            side="bottom"
            className="mobile-settings-drawer h-auto max-h-[70dvh] overflow-hidden rounded-t-3xl border-border/70 bg-sidebar/95 p-0 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden"
          >
            <SheetTitle className="sr-only">All settings</SheetTitle>
            <SheetDescription className="sr-only">
              Configure display units and map preferences.
            </SheetDescription>
            <div className="grid gap-4 overflow-auto px-4 pb-5 pt-5 journal-scroll">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Configuration
                </p>
                <h2 className="mt-1 font-display text-3xl italic text-foreground">
                  All settings
                </h2>
              </div>

              {heightPreferenceControl}

              <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    map
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Toggle the topo contour overlay on the map.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={topoEnabled ? "default" : "outline"}
                  className="justify-start rounded-full"
                  onClick={() => setTopoEnabled((value) => !value)}
                >
                  <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.7} />
                  {topoEnabled ? "Topo overlay on" : "Topo overlay off"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

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

function PeopleDiscoverySheet({
  onOpenChange,
  onQuery,
  onSelectProfile,
  onToggleFollow,
  open,
  query,
  results,
  selectedProfile,
  selectedUserId,
}: {
  onOpenChange: (open: boolean) => void;
  onQuery: (query: string) => void;
  onSelectProfile: (userId: string) => void;
  onToggleFollow: (bagger: BaggerSummary) => void;
  open: boolean;
  query: string;
  results: BaggerSummary[];
  selectedProfile: BaggerSummary | null;
  selectedUserId: string | null;
}) {
  const activeProfile =
    selectedProfile ??
    results.find((bagger) => bagger.userId === selectedUserId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-h-[780px] overflow-hidden rounded-t-3xl border-border/70 bg-sidebar/95 p-0 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl"
      >
        <SheetTitle className="sr-only">Find other baggers</SheetTitle>
        <SheetDescription className="sr-only">
          Search app users by name or email, follow them, and view their public
          Wainwright progress and photos.
        </SheetDescription>
        <div className="grid h-full grid-rows-[auto_1fr] overflow-hidden">
          <div className="space-y-4 border-b border-border/70 bg-card/60 px-4 pb-4 pt-5 shadow-sm sm:px-6">
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <HugeiconsIcon icon={UserSearch01Icon} strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  community
                </p>
                <h2 className="mt-1 font-display text-3xl italic leading-none text-foreground">
                  Find other baggers
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Follow walkers to compare Wainwright progress, see recent
                  summit photos, and keep their profiles one tap away.
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl border border-border bg-background/80 p-2">
              <label className="sr-only" htmlFor="bagger-search">
                Search by name or email
              </label>
              <div className="flex items-center gap-2 px-2">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.7}
                />
                <Input
                  id="bagger-search"
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                  className="h-10 border-0 bg-transparent p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                  placeholder="Search by name or email"
                />
              </div>
              <div className="rounded-xl bg-primary/8 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                Contact import can layer on later with explicit permission; this
                starts safely with in-app users only.
              </div>
            </div>
          </div>

          <div className="journal-scroll grid min-h-0 gap-4 overflow-y-auto px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] sm:px-6">
            <div className="grid content-start gap-2.5">
              {results.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background/70 p-6 text-center">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    className="mx-auto size-10 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <p className="mt-3 font-semibold text-foreground">
                    No baggers found yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a name or email once more friends have signed in.
                  </p>
                </div>
              ) : (
                results.map((bagger) => (
                  <button
                    key={bagger.userId}
                    type="button"
                    onClick={() => onSelectProfile(bagger.userId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-3xl border bg-background/75 p-3 text-left shadow-xs transition hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedUserId === bagger.userId
                        ? "border-primary/70 ring-2 ring-primary/20"
                        : "border-border/70",
                    )}
                  >
                    <BaggerAvatar bagger={bagger} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">
                        {bagger.displayName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {bagger.completedCount} Wainwrights bagged ·{" "}
                        {bagger.followersCount} followers
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        bagger.isFollowing
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {bagger.isFollowing ? "Following" : "View"}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="min-h-[22rem] rounded-3xl border border-border/70 bg-card/85 p-4 shadow-sm">
              {activeProfile ? (
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <BaggerAvatar bagger={activeProfile} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-3xl italic leading-none text-foreground">
                        {activeProfile.displayName}
                      </h3>
                      {activeProfile.email && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {activeProfile.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <StatPill
                      label="Wainwrights bagged"
                      value={activeProfile.completedCount}
                    />
                    <StatPill
                      label="followers"
                      value={activeProfile.followersCount}
                    />
                    <StatPill
                      label="following"
                      value={activeProfile.followingCount}
                    />
                  </div>

                  {!activeProfile.isSelf && (
                    <Button
                      type="button"
                      className="rounded-full"
                      variant={
                        activeProfile.isFollowing ? "secondary" : "default"
                      }
                      onClick={() => onToggleFollow(activeProfile)}
                    >
                      <HugeiconsIcon
                        icon={
                          activeProfile.isFollowing
                            ? UserCheck01Icon
                            : UserAdd01Icon
                        }
                        strokeWidth={1.7}
                      />
                      {activeProfile.isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        summit photos
                      </p>
                      <Badge variant="secondary" className="rounded-full">
                        {activeProfile.photoUrls.length} previews
                      </Badge>
                    </div>
                    {activeProfile.photoUrls.length > 0 ? (
                      <div className="photo-preview-grid grid grid-cols-3 gap-2">
                        {activeProfile.photoUrls.map((url, index) => (
                          <img
                            key={`${url}-${index}`}
                            src={url}
                            alt={`${activeProfile.displayName} Wainwright photo ${index + 1}`}
                            className="aspect-square rounded-2xl object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="photo-preview-grid grid min-h-28 place-items-center rounded-2xl border border-dashed border-border bg-background/65 p-4 text-center text-sm text-muted-foreground">
                        No public summit photos yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  <div>
                    <HugeiconsIcon
                      icon={UserSearch01Icon}
                      className="mx-auto size-10"
                      strokeWidth={1.5}
                    />
                    <p className="mt-3">
                      Select a bagger to view their profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BaggerAvatar({
  bagger,
  size = "md",
}: {
  bagger: BaggerSummary;
  size?: "md" | "lg";
}) {
  const className = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/15 font-semibold text-primary",
    size === "lg" ? "size-16 text-xl" : "size-12 text-base",
  );

  if (bagger.imageUrl) {
    return (
      <img
        src={bagger.imageUrl}
        alt={`${bagger.displayName} profile photo`}
        className={cn(className, "object-cover")}
      />
    );
  }

  return (
    <span className={className}>
      {bagger.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-2">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function SelectedPhotoStrip({ photos }: { photos: WainwrightPhotoMetadata[] }) {
  if (photos.length === 0) {
    return (
      <div className="grid h-24 place-items-center rounded-2xl border border-white/15 bg-white/10 text-center text-xs text-white/70">
        no photos yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.slice(0, 2).map((photo, index) =>
        photo.url ? (
          <img
            key={`${photo.storageId}-${index}`}
            src={photo.url}
            alt={photo.originalName ?? "Wainwright photo"}
            className="h-24 w-full rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div
            key={`${photo.storageId}-${index}`}
            className="grid h-24 place-items-center rounded-2xl bg-white/10 text-xs text-white/70"
          >
            photo saved
          </div>
        ),
      )}
    </div>
  );
}

type SelectedFellCardProps = {
  completed: boolean;
  entry?: CompletionEntry;
  heightUnit: HeightUnit;
  onBag: () => void;
  onClose: () => void;
  onDetails: () => void;
  onEdit: () => void;
  onOpenChange: (open: boolean) => void;
  onSearch: () => void;
  onUnbag: () => void;
  open: boolean;
  peak: Wainwright;
};

function SelectedFellCard({
  completed,
  entry,
  heightUnit,
  onBag,
  onClose,
  onDetails,
  onEdit,
  onOpenChange,
  onSearch,
  onUnbag,
  open,
  peak,
}: SelectedFellCardProps) {
  const photos = entry?.photos ?? [];
  const heroPhoto = photos.find((photo) => photo.url)?.url;
  const primaryAction = completed ? onEdit : onBag;

  return (
    <>
      <Card className="overflow-hidden rounded-[1.75rem] border-white/20 bg-ink/88 p-0 text-white shadow-[0_24px_70px_-24px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
        {heroPhoto ? (
          <div
            className="h-24 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroPhoto})` }}
          />
        ) : (
          <div className="h-3 bg-gradient-to-r from-primary via-emerald-300 to-sky-300" />
        )}
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className={cn(
                "mt-1 grid size-11 shrink-0 place-items-center rounded-2xl border shadow-inner",
                completed
                  ? "border-emerald-300/50 bg-emerald-400 text-emerald-950"
                  : "border-white/20 bg-white/10 text-white",
              )}
              onClick={primaryAction}
              aria-label={completed ? `edit ${peak.name}` : `bag ${peak.name}`}
            >
              <HugeiconsIcon
                icon={completed ? CheckmarkCircle02Icon : Backpack03Icon}
                className="size-5"
                strokeWidth={1.8}
              />
            </button>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge
                  variant={completed ? "default" : "secondary"}
                  className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                >
                  {completed ? "Bagged" : "Not bagged"}
                </Badge>
                {completed && photos.length > 0 && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[10px] text-white/75">
                    {photos.length} photo{photos.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <h2 className="truncate font-display text-2xl italic leading-none tracking-tight">
                {peak.name}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-white/70">
                #{peak.bookNumber} · {peak.area} ·{" "}
                {formatPeakHeight(peak, heightUnit)}
              </p>
              {completed && (
                <p className="mt-2 line-clamp-2 text-sm leading-snug text-white/80">
                  {entry?.note ||
                    `Bagged ${formatCompletionDate(entry?.completedAt)}`}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-full text-white/75 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="close selected fell"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.8} />
            </Button>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <Button
              className="rounded-full"
              variant={completed ? "secondary" : "default"}
              onClick={primaryAction}
            >
              <HugeiconsIcon
                icon={completed ? PencilEdit02Icon : Backpack03Icon}
                strokeWidth={1.7}
              />
              {completed ? "Edit" : "Bag this"}
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              onClick={onDetails}
              aria-label="open fell details"
            >
              <HugeiconsIcon icon={EyeIcon} strokeWidth={1.7} />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white lg:hidden"
              onClick={onSearch}
              aria-label="open search"
            >
              <HugeiconsIcon icon={Search01Icon} strokeWidth={1.7} />
            </Button>
          </div>
        </div>
      </Card>

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[88dvh] overflow-hidden rounded-t-[2rem] border-white/10 bg-ink p-0 text-white">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{peak.name} details</DrawerTitle>
            <DrawerDescription>
              Fell details, bagged status, notes, and photos.
            </DrawerDescription>
          </DrawerHeader>
          <div className="journal-scroll overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            {heroPhoto ? (
              <img
                src={heroPhoto}
                alt={`${peak.name} bagged photo`}
                className="h-56 w-full object-cover sm:h-72"
              />
            ) : (
              <div className="grid h-40 place-items-center bg-gradient-to-br from-moss via-primary to-sky-300/70">
                <HugeiconsIcon
                  icon={MountainIcon}
                  className="size-14 text-white/90"
                  strokeWidth={1.2}
                />
              </div>
            )}
            <div className="space-y-5 p-5">
              <div>
                <Badge
                  variant={completed ? "default" : "secondary"}
                  className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
                >
                  {completed ? "Bagged" : "Not bagged"}
                </Badge>
                <h2 className="mt-3 font-display text-4xl italic leading-none tracking-tight">
                  {peak.name}
                </h2>
                <p className="mt-2 font-mono text-xs text-white/70">
                  #{peak.bookNumber} · {peak.area} ·{" "}
                  {formatPeakHeight(peak, heightUnit)}
                </p>
              </div>

              {completed && (
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                    logged
                  </p>
                  <p className="mt-1 text-sm text-white/85">
                    {formatCompletionDate(entry?.completedAt)}
                  </p>
                  {entry?.note && (
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      {entry.note}
                    </p>
                  )}
                </div>
              )}

              <SelectedPhotoStrip photos={photos} />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="rounded-full"
                  variant={completed ? "secondary" : "default"}
                  onClick={primaryAction}
                >
                  <HugeiconsIcon
                    icon={completed ? PencilEdit02Icon : Backpack03Icon}
                    strokeWidth={1.7}
                  />
                  {completed ? "Edit log" : "Bag this"}
                </Button>
                {completed ? (
                  <Button
                    variant="outline"
                    className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                    onClick={onUnbag}
                  >
                    Unbag
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                    onClick={onSearch}
                  >
                    Search
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DrawerFooter className="sr-only" />
        </DrawerContent>
      </Drawer>
    </>
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
  heightUnit: HeightUnit;
  onArea: (area: string) => void;
  onClearQuery: () => void;
  onQuery: (query: string) => void;
  onReset: () => void;
  onSelect: (id: string) => void;
  onEdit: (peak: Wainwright) => void;
  onShowOnly: (value: ShowOnly) => void;
  onSort: (value: JournalSort) => void;
  onToggle: (peak: Wainwright) => void;
  onBulkAdd: (ids: string[]) => Promise<void>;
  query: string;
  selectedId: string | null;
  showOnly: ShowOnly;
  sortBy: JournalSort;
};

function Journal(props: JournalProps) {
  const {
    area,
    completed,
    completionEntriesById,
    doneCount,
    filtered,
    heightUnit,
    onArea,
    onClearQuery,
    onQuery,
    onReset,
    onSelect,
    onEdit,
    onShowOnly,
    onSort,
    onToggle,
    onBulkAdd,
    query,
    selectedId,
    showOnly,
    sortBy,
  } = props;
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkReviewRow[]>([]);
  const [bulkWorking, setBulkWorking] = useState(false);
  const matchImport = useAction(api.importer.matchImport);

  const runBulkMatch = async (text: string) => {
    const lines = parseDelimitedImportText(
      text.slice(0, MAX_IMPORT_TEXT_CHARS),
    );
    if (lines.length === 0) {
      toast.error("Paste a list or upload a file first");
      return;
    }

    setBulkWorking(true);
    try {
      const matches = await matchImport({ lines });
      const rows = buildBulkReviewRows(matches, completed);
      setBulkRows(rows);
      const importable = countImportableRows(rows, completed);
      toast.success(
        importable > 0
          ? `Found ${importable} fells ready to add`
          : "No new fells ready yet — review the matches",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not match imported fells";
      toast.error(message);
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkFile = async (file: File | undefined) => {
    if (!file) return;
    setBulkWorking(true);
    try {
      const text = (await extractBulkImportText(file)).slice(
        0,
        MAX_IMPORT_TEXT_CHARS,
      );
      setBulkText(text);
      await runBulkMatch(text);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not read that file. Try CSV or pasted text.";
      toast.error(message);
    } finally {
      setBulkWorking(false);
    }
  };

  const selectBulkCandidate = (rowIndex: number, id: string) => {
    setBulkRows((rows) =>
      rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              selectedId: id,
              status: completed.has(id) ? "already-bagged" : "ready",
            }
          : row,
      ),
    );
  };

  const addSelectedBulkRows = async () => {
    const ids = Array.from(
      new Set(
        bulkRows
          .map((row) => row.selectedId)
          .filter(
            (id): id is string => typeof id === "string" && !completed.has(id),
          ),
      ),
    );
    if (ids.length === 0) {
      toast.error("Select at least one new fell to add");
      return;
    }
    setBulkWorking(true);
    try {
      await onBulkAdd(ids);
      setBulkRows([]);
      setBulkText("");
    } finally {
      setBulkWorking(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-5 px-4 pb-10 pt-6 sm:gap-6 sm:px-7 sm:pt-7">
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

        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted/45 p-1.5">
            <ToggleGroup
              type="single"
              value={showOnly}
              onValueChange={(value) => {
                if (isShowOnly(value)) onShowOnly(value);
              }}
              className="grid flex-1 grid-cols-3 rounded-xl bg-background/75 p-1 shadow-xs"
            >
              <ToggleGroupItem
                value="all"
                className="rounded-lg text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                all
              </ToggleGroupItem>
              <ToggleGroupItem
                value="todo"
                className="rounded-lg text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                to go
              </ToggleGroupItem>
              <ToggleGroupItem
                value="done"
                className="rounded-lg text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                bagged
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-1.5">
            <label className="px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Sort by
            </label>
            <Select
              value={sortBy}
              onValueChange={(value) => onSort(value as JournalSort)}
            >
              <SelectTrigger className="h-11 rounded-2xl border-border bg-background/80 px-3 shadow-xs">
                <SelectValue placeholder="sort results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">To go first</SelectItem>
                <SelectItem value="date-desc">Recently bagged</SelectItem>
                <SelectItem value="date-asc">Oldest bagged</SelectItem>
                <SelectItem value="guide">Wainwright order</SelectItem>
                <SelectItem value="height-desc">Highest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <details className="advanced-options group rounded-2xl border border-border/70 bg-background/45 px-3 py-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block">Advanced filters & tools</span>
              <span className="mobile-filter-summary mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                {area === ALL_AREAS ? "all areas" : area.toLowerCase()} · bulk
                add · reset
              </span>
            </span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs transition-transform group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-1.5 rounded-xl border border-border/70 bg-background/70 p-3">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Area filter
              </label>
              <Select value={area} onValueChange={onArea}>
                <SelectTrigger className="h-10 rounded-xl">
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
            </div>

            <Separator />

            <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Bulk add fells
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Paste text or load CSV, Excel, Word .docx, or plain text. AI
                    finds Wainwright matches; you confirm anything ambiguous
                    before it changes your journal.
                  </p>
                </div>
                {bulkRows.length > 0 && (
                  <Badge variant="secondary" className="shrink-0 rounded-full">
                    {countImportableRows(bulkRows, completed)} ready
                  </Badge>
                )}
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="bulk-import-text"
                  className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground"
                >
                  paste list
                </label>
                <Textarea
                  id="bulk-import-text"
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  placeholder={
                    "Scafell Pike\nHelvellyn, 2024-05-02\nHigh Raise"
                  }
                  className="min-h-24 bg-background/80"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="inline-flex">
                  <input
                    className="sr-only"
                    type="file"
                    accept={IMPORTABLE_FILE_TYPES}
                    onChange={(event) => {
                      void handleBulkFile(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <span className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground">
                    <HugeiconsIcon icon={Upload04Icon} strokeWidth={1.6} /> Load
                    file
                  </span>
                </label>
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={bulkWorking}
                  onClick={() => void runBulkMatch(bulkText)}
                >
                  {bulkWorking ? "Finding matches…" : "Find matches"}
                </Button>
              </div>

              {bulkRows.length > 0 && (
                <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-2">
                  <div className="max-h-80 overflow-auto pr-1">
                    <div className="grid gap-2">
                      {bulkRows.map((row, index) => (
                        <div
                          key={`${row.sourceText}-${index}`}
                          className="rounded-xl border border-border/70 bg-card/80 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {row.sourceText}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {row.status === "needs-choice"
                                  ? "Choose the right fell"
                                  : row.status === "already-bagged"
                                    ? "Already in your journal"
                                    : row.status === "no-match"
                                      ? "No confident match"
                                      : "Ready to add"}
                              </p>
                            </div>
                            <Badge
                              variant={
                                row.status === "ready" ? "default" : "secondary"
                              }
                              className="shrink-0 rounded-full"
                            >
                              {row.status === "needs-choice"
                                ? "confirm"
                                : row.status === "no-match"
                                  ? "skip"
                                  : row.status === "already-bagged"
                                    ? "done"
                                    : "add"}
                            </Badge>
                          </div>

                          {row.candidates.length > 0 && (
                            <div className="mt-2 grid gap-1.5">
                              {row.candidates.map((candidate) => (
                                <label
                                  key={candidate.id}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-2 rounded-lg border px-2 py-1.5 text-sm transition",
                                    row.selectedId === candidate.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border bg-background/60 hover:bg-accent/50",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={`bulk-match-${index}`}
                                    className="mt-1"
                                    checked={row.selectedId === candidate.id}
                                    onChange={() =>
                                      selectBulkCandidate(index, candidate.id)
                                    }
                                  />
                                  <span className="min-w-0">
                                    <span className="block font-medium">
                                      {candidate.name}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      {Math.round(candidate.confidence * 100)}%
                                      {candidate.reason
                                        ? ` · ${candidate.reason}`
                                        : ""}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={
                      bulkWorking ||
                      countImportableRows(bulkRows, completed) === 0
                    }
                    onClick={() => void addSelectedBulkRows()}
                  >
                    Add selected fells
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-semibold text-destructive">
                Reset all progress
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                This will reset all of your bagged fells, dates, notes, and
                saved photos from your journal.
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
                heightUnit={heightUnit}
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

function formatCompletionDate(value?: string) {
  if (!value) return "date not set";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function CompletionDialog({
  initialMetadata,
  onOpenChange,
  onSave,
  open,
  peak,
  photos,
}: {
  initialMetadata?: CompletionEntry;
  onOpenChange: (open: boolean) => void;
  onSave: (metadata: CompletionMetadata, photoFiles: File[]) => Promise<void>;
  open: boolean;
  peak: Wainwright | null;
  photos: WainwrightPhotoMetadata[];
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [completedAt, setCompletedAt] = useState(
    () => initialMetadata?.completedAt ?? "",
  );
  const [note, setNote] = useState(() => initialMetadata?.note ?? "");
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef<PendingPhoto[]>([]);
  const [removedPhotoStorageIds, setRemovedPhotoStorageIds] = useState<
    Set<string>
  >(() => new Set());
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{
    alt: string;
    url: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(initialMetadata);
  const visibleSavedPhotos = Array.from(removedPhotoStorageIds).reduce(
    (nextPhotos, storageId) => removePhotoMetadata(nextPhotos, storageId),
    photos,
  );
  const pendingPhotoPreviews = pendingPhotos.map((photo) => ({
    id: photo.id,
    originalName: photo.file.name,
    url: photo.previewUrl,
  }));
  const photoCount = visibleSavedPhotos.length + pendingPhotos.length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(
        {
          completedAt: completedAt || undefined,
          note: note.trim() || undefined,
          photos: visibleSavedPhotos,
        },
        pendingPhotos.map((photo) => photo.file),
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    try {
      validatePhotoSelectionLimit(
        visibleSavedPhotos.length,
        pendingPhotos.length,
        selected.length,
      );
      setPendingPhotos((current) => [
        ...current,
        ...selected.map((file) => ({
          file,
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not add those photos";
      toast.error(message);
    }
  };

  const removePendingPhoto = (id: string) => {
    setPendingPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const removeSavedPhoto = (storageId: string) => {
    setRemovedPhotoStorageIds((current) => new Set(current).add(storageId));
  };

  useEffect(() => {
    pendingPhotosRef.current = pendingPhotos;
  }, [pendingPhotos]);

  useEffect(() => {
    return () => {
      pendingPhotosRef.current.forEach((photo) =>
        URL.revokeObjectURL(photo.previewUrl),
      );
    };
  }, []);

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
              Max {MAX_PHOTOS_PER_WAINWRIGHT}; images upload only when you save.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {photoCount}/{MAX_PHOTOS_PER_WAINWRIGHT}
          </Badge>
        </div>

        {photoCount > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {visibleSavedPhotos.map((photo) => (
              <div
                key={photo.storageId}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
              >
                <button
                  type="button"
                  aria-label={`remove ${photo.originalName ?? "saved photo"}`}
                  onClick={() => removeSavedPhoto(photo.storageId)}
                  className="absolute right-1.5 top-1.5 z-10 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    className="size-3.5"
                    strokeWidth={2}
                  />
                </button>
                {photo.url ? (
                  <button
                    type="button"
                    aria-label={`Open full screen photo ${photo.originalName ?? peak.name}`}
                    onClick={() =>
                      setFullscreenPhoto({
                        url: photo.url!,
                        alt: photo.originalName ?? `${peak.name} photo`,
                      })
                    }
                    className="block h-full w-full cursor-zoom-in"
                  >
                    <img
                      src={photo.url}
                      alt={photo.originalName ?? `${peak.name} photo`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="grid h-full place-items-center px-2 text-center text-xs text-muted-foreground">
                    photo saved
                  </div>
                )}
              </div>
            ))}
            {pendingPhotoPreviews.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-primary/50 bg-muted"
              >
                <button
                  type="button"
                  aria-label={`remove ${photo.originalName}`}
                  onClick={() => removePendingPhoto(photo.id)}
                  className="absolute right-1.5 top-1.5 z-10 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    className="size-3.5"
                    strokeWidth={2}
                  />
                </button>
                <button
                  type="button"
                  aria-label={`Open full screen photo ${photo.originalName}`}
                  onClick={() =>
                    setFullscreenPhoto({
                      url: photo.url,
                      alt: photo.originalName,
                    })
                  }
                  className="block h-full w-full cursor-zoom-in"
                >
                  <img
                    src={photo.url}
                    alt={photo.originalName}
                    className="h-full w-full object-cover"
                  />
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                  pending
                </span>
              </div>
            ))}
          </div>
        )}

        <label className="inline-flex">
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            disabled={saving || photoCount >= MAX_PHOTOS_PER_WAINWRIGHT}
            onChange={(event) => {
              handlePhotoChange(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <span
            className={cn(
              "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent",
              (saving || photoCount >= MAX_PHOTOS_PER_WAINWRIGHT) &&
                "pointer-events-none cursor-not-allowed opacity-50",
            )}
          >
            <HugeiconsIcon
              icon={Upload04Icon}
              className="size-4"
              strokeWidth={1.6}
            />
            {saving ? "compressing photos…" : "add photo"}
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
          <Button type="submit" disabled={saving}>
            {saving ? "saving…" : isEditing ? "save changes" : "save as bagged"}
          </Button>
        </DialogFooter>
      ) : (
        <DrawerFooter>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "saving…" : isEditing ? "save changes" : "save as bagged"}
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

  const fullscreenPhotoDialog = (
    <Dialog
      open={Boolean(fullscreenPhoto)}
      onOpenChange={(isOpen) => {
        if (!isOpen) setFullscreenPhoto(null);
      }}
    >
      <DialogContent className="fullscreen-photo-dialog" showCloseButton>
        <DialogTitle className="sr-only">
          {fullscreenPhoto?.alt ?? "full screen photo"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Full screen photo preview. Rotate your phone to landscape for a wider
          horizontal view.
        </DialogDescription>
        {fullscreenPhoto && (
          <img
            src={fullscreenPhoto.url}
            alt={fullscreenPhoto.alt}
            className="fullscreen-photo-image"
          />
        )}
      </DialogContent>
    </Dialog>
  );

  if (isDesktop) {
    return (
      <>
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
        {fullscreenPhotoDialog}
      </>
    );
  }

  return (
    <>
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
      {fullscreenPhotoDialog}
    </>
  );
}

/* -------------------------------------------------------------------------
 * Single peak row — like a journal entry. Click select, check bag.
 * -----------------------------------------------------------------------*/

function PeakRow({
  peak,
  completionEntry,
  done,
  heightUnit,
  selected,
  onSelect,
  onEdit,
  onToggle,
}: {
  peak: Wainwright;
  completionEntry?: CompletionEntry;
  done: boolean;
  heightUnit: HeightUnit;
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
          {formatPeakHeight(peak, heightUnit)} · {peak.area.toLowerCase()}
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
