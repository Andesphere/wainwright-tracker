import { useEffect, useRef, useState } from "react";
import type {
  GeoJSONSource,
  GeolocateControl,
  Map as MapboxMap,
  Marker,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { cn } from "@/lib/utils";
import { type Book, FELLS_BY_BOOK, FELLS_BY_ID } from "./fells";
import { LayersIcon, LocationIcon, LockIcon, MountainsIcon } from "./icons";
import { isDarkPreset, type LightPreset } from "./lightClock";
import {
  basemapConfig,
  fellCollection,
  IDS,
  installLayers,
  labelColors,
  labelFilter,
  selectedLabelFilter,
  MAP_LAYERS,
  markerOpacity,
  replaceRelief,
  styleUrl,
  type MapLayer,
} from "./mapLayers";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const LAUNCH = {
  center: [-3.06, 54.46] as [number, number],
  zoom: 7.4,
  pitch: 10,
  bearing: 0,
};
const HOME = {
  center: [-3.08, 54.49] as [number, number],
  zoom: 9.55,
  pitch: 55,
  bearing: -14,
};

export type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type CameraRequest = {
  id: number;
  padding: Padding;
  target: { fell: string } | { book: Book };
};

type FellMapProps = {
  bagged: Set<string>;
  book: Book | null;
  cameraRequest: CameraRequest | null;
  /** Where the panel or sheet covers the map, so the home view lands in the open part. */
  homePadding: Padding;
  isPro: boolean;
  layer: MapLayer;
  lightPreset: LightPreset;
  onBackgroundTap: () => void;
  onLayer: (layer: MapLayer) => void;
  onLockedLayer: () => void;
  onNotice: (message: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The full-bleed 3D Lake District: Mapbox Standard with terrain, relief, the 214 fells,
 * the walker's location, and the floating controls. Mirrors the iPhone app's FellMapView.
 */
export function FellMap(props: FellMapProps) {
  const {
    bagged,
    book,
    cameraRequest,
    isPro,
    layer,
    lightPreset,
    onLayer,
    onLockedLayer,
    selectedId,
  } = props;
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const geolocateRef = useRef<GeolocateControl | null>(null);
  const pinRef = useRef<Marker | null>(null);
  const latest = useRef(props);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!TOKEN);
  const [camera, setCamera] = useState({ bearing: 0, pitched: false });
  const [following, setFollowing] = useState(false);
  const [showsLayers, setShowsLayers] = useState(false);

  const isDark = isDarkPreset(lightPreset);
  const effectiveLayer: MapLayer = isPro ? layer : "standard";

  useEffect(() => {
    latest.current = { ...props, layer: effectiveLayer };
  });

  // Create the map once.
  useEffect(() => {
    if (!TOKEN || !container.current) return;
    let cancelled = false;
    let map: MapboxMap | null = null;
    let observer: ResizeObserver | null = null;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !container.current) return;
      mapboxgl.accessToken = TOKEN;
      const initial = latest.current;
      try {
        map = new mapboxgl.Map({
          container: container.current,
          style: styleUrl(initial.layer),
          config: {
            basemap: basemapConfig(initial.layer, initial.lightPreset),
          },
          ...LAUNCH,
          attributionControl: false,
          logoPosition: "bottom-left",
          maxPitch: 75,
        });
      } catch (error) {
        console.warn("Map failed to start", error);
        setFailed(true);
        return;
      }
      mapRef.current = map;
      const created = map;

      created.addControl(
        new mapboxgl.AttributionControl({ compact: true }),
        "bottom-right",
      );
      const geolocate = new mapboxgl.GeolocateControl({
        // A timeout, so a fix that never comes ends in a notice, not a spinner.
        positionOptions: { enableHighAccuracy: true, timeout: 10_000 },
        trackUserLocation: true,
        showUserHeading: true,
        // Mapbox spreads these into each follow move, so the getter keeps 3D in 3D.
        fitBoundsOptions: {
          maxZoom: 13.5,
          get pitch() {
            return created.getPitch();
          },
        },
      });
      // Its own button stays hidden; the locate control below drives it.
      created.addControl(geolocate, "top-left");
      geolocateRef.current = geolocate;
      geolocate.on("trackuserlocationstart", () => setFollowing(true));
      geolocate.on("trackuserlocationend", () => setFollowing(false));
      geolocate.on("error", (error: GeolocationPositionError) => {
        // Mapbox parks a failed watch in an error state; stop it so the next tap retries.
        if (error.code !== 1) geolocate.trigger();
        setFollowing(false);
        latest.current.onNotice(
          error.code === 1
            ? "Location is off for this site. Turn it on in your browser settings to see where you are."
            : "Your location is not available right now.",
        );
      });

      created.on("style.load", () => {
        const current = latest.current;
        installLayers(created, {
          bagged: current.bagged,
          book: current.book,
          isDark: isDarkPreset(current.lightPreset),
          layer: current.layer,
          selectedId: current.selectedId,
        });
      });

      created.once("load", () => {
        setReady(true);
        const target = { ...HOME, padding: latest.current.homePadding };
        if (prefersReducedMotion()) created.jumpTo(target);
        else created.flyTo({ ...target, duration: 3200, essential: true });
      });

      let frame = 0;
      created.on("move", () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const bearing = Math.round(created.getBearing());
          const pitched = created.getPitch() > 20;
          setCamera((previous) =>
            previous.bearing === bearing && previous.pitched === pitched
              ? previous
              : { bearing, pitched },
          );
        });
      });

      const hitLayers = [IDS.markers, IDS.labels, IDS.selectedLabel];
      created.on("click", (event) => {
        const { x, y } = event.point;
        const features = created
          .queryRenderedFeatures(
            [
              [x - 14, y - 14],
              [x + 14, y + 14],
            ],
            { layers: hitLayers.filter((id) => created.getLayer(id)) },
          )
          .map(
            (feature) =>
              (feature as unknown as { properties?: { id?: unknown } })
                .properties?.id,
          )
          .filter((id) => typeof id === "string");
        const id = features[0];
        if (typeof id === "string" && FELLS_BY_ID.has(id)) {
          latest.current.onSelect(id);
        } else {
          setShowsLayers(false);
          latest.current.onBackgroundTap();
        }
      });
      for (const id of hitLayers) {
        created.on(
          "mouseenter",
          id,
          () => (created.getCanvas().style.cursor = "pointer"),
        );
        created.on(
          "mouseleave",
          id,
          () => (created.getCanvas().style.cursor = ""),
        );
      }
      created.on("error", (event) => {
        const status = (event.error as { status?: number } | undefined)?.status;
        if (status === 401 || status === 403) setFailed(true);
        else console.warn("Map error", event.error);
      });

      observer = new ResizeObserver(() => created.resize());
      observer.observe(container.current);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      pinRef.current?.remove();
      pinRef.current = null;
      map?.remove();
      mapRef.current = null;
      geolocateRef.current = null;
    };
  }, []);

  // Bagged fells.
  useEffect(() => {
    const source = mapRef.current?.getSource(IDS.fells) as
      | GeoJSONSource
      | undefined;
    source?.setData(fellCollection(bagged));
  }, [bagged, ready]);

  // Selection and the book filter.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getLayer(IDS.markers)) return;
    map.setPaintProperty(
      IDS.markers,
      "icon-opacity",
      markerOpacity(selectedId, book),
    );
    map.setFilter(IDS.labels, labelFilter(book, selectedId));
    map.setFilter(IDS.selectedLabel, selectedLabelFilter(selectedId));
  }, [book, ready, selectedId]);

  // Lighting and layer. Satellite is its own style; Standard and Contours differ only in relief.
  const styleRef = useRef(styleUrl(effectiveLayer));
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const url = styleUrl(effectiveLayer);
    if (url !== styleRef.current) {
      styleRef.current = url;
      map.setStyle(url, {
        config: { basemap: basemapConfig(effectiveLayer, lightPreset) },
      } as unknown as Parameters<MapboxMap["setStyle"]>[1]);
      return;
    }
    map.setConfigProperty("basemap", "lightPreset", lightPreset);
    replaceRelief(map, isDark, effectiveLayer);
    const colors = labelColors(isDark || effectiveLayer === "satellite");
    for (const id of [IDS.labels, IDS.selectedLabel]) {
      if (!map.getLayer(id)) continue;
      map.setPaintProperty(id, "text-color", colors["text-color"]);
      map.setPaintProperty(id, "text-halo-color", colors["text-halo-color"]);
    }
  }, [effectiveLayer, isDark, lightPreset, ready]);

  // The selected fell's pin springs up from the summit.
  useEffect(() => {
    const map = mapRef.current;
    pinRef.current?.remove();
    pinRef.current = null;
    const fell = selectedId ? FELLS_BY_ID.get(selectedId) : null;
    if (!map || !ready || !fell) return;
    let cancelled = false;
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled) return;
      const element = document.createElement("div");
      element.className = "wb-pin";
      element.setAttribute("aria-hidden", "true");
      element.innerHTML = PIN_HTML;
      pinRef.current = new mapboxgl.Marker({ element, anchor: "bottom" })
        .setLngLat([fell.longitude, fell.latitude])
        .addTo(map);
      pinRef.current.getElement().dataset.bagged = String(
        latest.current.bagged.has(fell.id),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [ready, selectedId]);

  // Bagging the selected fell turns its pin bracken, with a ripple.
  const selectedBagged = selectedId ? bagged.has(selectedId) : false;
  useEffect(() => {
    const element = pinRef.current?.getElement();
    if (!element) return;
    const was = element.dataset.bagged === "true";
    element.dataset.bagged = String(selectedBagged);
    if (selectedBagged && !was) {
      element.classList.remove("wb-pin-ripple");
      void element.offsetWidth;
      element.classList.add("wb-pin-ripple");
    }
  }, [selectedBagged]);

  // Camera requests: fly to a fell, or frame a book.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !cameraRequest) return;
    const { padding, target } = cameraRequest;
    const reduce = prefersReducedMotion();
    if ("fell" in target) {
      const fell = FELLS_BY_ID.get(target.fell);
      if (!fell) return;
      const options = {
        center: [fell.longitude, fell.latitude] as [number, number],
        zoom: 13.2,
        pitch: 60,
        bearing: map.getBearing(),
        padding,
      };
      if (reduce) map.jumpTo(options);
      else map.flyTo({ ...options, duration: 1600, essential: true });
      return;
    }
    const fells = FELLS_BY_BOOK.get(target.book.number) ?? [];
    const lngs = fells.map((fell) => fell.longitude);
    const lats = fells.map((fell) => fell.latitude);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        bearing: map.getBearing(),
        pitch: 45,
        padding: {
          top: padding.top + 70,
          left: padding.left + 40,
          bottom: padding.bottom + 30,
          right: padding.right + 80,
        },
        duration: reduce ? 0 : 1400,
        essential: true,
      },
    );
  }, [cameraRequest, ready]);

  const toggle3D = () => {
    mapRef.current?.easeTo({
      pitch: camera.pitched ? 0 : 60,
      duration: prefersReducedMotion() ? 0 : 800,
    });
  };

  const resetNorth = () => {
    mapRef.current?.easeTo({
      bearing: 0,
      duration: prefersReducedMotion() ? 0 : 600,
    });
  };

  const rotated = Math.abs(camera.bearing % 360) > 0.5;

  return (
    <div
      className="wb-map absolute inset-0"
      role="region"
      aria-label="Map of the 214 Wainwrights"
    >
      {/* Sized, not positioned: mapbox-gl.css forces position: relative on the
          container, and its unlayered rule beats Tailwind utilities. */}
      <div ref={container} className="size-full" />
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-[var(--wb-paper)] p-6 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--wb-brand)] text-white">
              <MountainsIcon size={24} />
            </span>
            <h2 className="wb-serif mt-4 text-2xl font-semibold">
              Map unavailable
            </h2>
            <p className="mt-2 text-sm text-[var(--wb-secondary)]">
              This browser could not start the 3D map. Search, the list and
              bagging still work.
            </p>
          </div>
        </div>
      ) : null}

      <div className="wb-map-controls absolute z-10 flex items-start gap-2.5">
        {showsLayers ? (
          <LayerPanel
            current={effectiveLayer}
            isPro={isPro}
            onPick={(next) => {
              const locked = next !== "standard" && !isPro;
              if (locked) {
                setShowsLayers(false);
                onLockedLayer();
              } else {
                onLayer(next);
              }
            }}
          />
        ) : null}
        <div className="flex flex-col items-center gap-2.5">
          <div className="wb-glass flex w-12 flex-col items-center rounded-[24px]">
            <button
              type="button"
              className="wb-control-button text-[15px] font-semibold"
              onClick={toggle3D}
              aria-label={
                camera.pitched
                  ? "Switch to flat 2D map"
                  : "Switch to 3D terrain"
              }
            >
              {camera.pitched ? "2D" : "3D"}
            </button>
            <span className="wb-control-divider" />
            <button
              type="button"
              className="wb-control-button"
              onClick={() => geolocateRef.current?.trigger()}
              aria-label="Show my location"
              aria-pressed={following}
            >
              <LocationIcon size={19} filled={following} />
            </button>
            <span className="wb-control-divider" />
            <button
              type="button"
              className={cn(
                "wb-control-button",
                showsLayers && "text-[var(--wb-brand)]",
              )}
              onClick={() => setShowsLayers((value) => !value)}
              aria-label="Map layers"
              aria-expanded={showsLayers}
            >
              <LayersIcon size={20} filled={showsLayers} />
            </button>
          </div>
          {rotated ? (
            <button
              type="button"
              className="wb-glass wb-compass grid size-12 place-items-center rounded-full"
              onClick={resetNorth}
              aria-label={`Compass, ${camera.bearing} degrees. Turn the map to face north`}
            >
              <span
                className="flex flex-col items-center"
                style={{ transform: `rotate(${-camera.bearing}deg)` }}
              >
                <span className="text-[10px] font-bold leading-none text-[#DB3D33]">
                  N
                </span>
                <svg
                  width="8"
                  height="26"
                  viewBox="0 0 8 26"
                  aria-hidden="true"
                >
                  <path d="M4 0 8 13H0Z" fill="#DB3D33" />
                  <path d="M4 26 0 13h8Z" fill="currentColor" opacity="0.35" />
                </svg>
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const PIN_HTML = `
  <span class="wb-pin-body">
    <span class="wb-pin-ring"></span>
    <span class="wb-pin-head">
      <svg class="wb-pin-to-go" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 6.2c.4-.7 1.4-.7 1.8 0l3.3 5.6 1.2-1.9c.4-.7 1.4-.7 1.8 0l5 8.3c.4.7-.1 1.6-.9 1.6H3.2c-.8 0-1.3-.9-.9-1.6l6.3-12Z"/></svg>
      <svg class="wb-pin-bagged" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.4 4.4L19 7.4"/></svg>
    </span>
    <span class="wb-pin-tail"></span>
  </span>`;

/** The layers card beside the map controls: Standard, and the two Pro layers. */
function LayerPanel({
  current,
  isPro,
  onPick,
}: {
  current: MapLayer;
  isPro: boolean;
  onPick: (layer: MapLayer) => void;
}) {
  return (
    <div
      className="wb-glass wb-pop-in rounded-[24px] p-3"
      role="group"
      aria-label="Map layers"
    >
      <p className="mb-2.5 pl-0.5 text-[13px] font-semibold text-[var(--wb-secondary)]">
        Map
      </p>
      <div className="flex gap-2.5">
        {MAP_LAYERS.map((option) => {
          const selected = current === option.id;
          const locked = option.id !== "standard" && !isPro;
          return (
            <button
              key={option.id}
              type="button"
              className="flex w-[70px] flex-col items-center gap-1.5"
              onClick={() => onPick(option.id)}
              aria-pressed={selected}
              aria-label={locked ? `${option.title}, Pro` : option.title}
            >
              <span
                className={cn(
                  "relative block size-[66px] overflow-hidden rounded-[14px] ring-inset",
                  selected
                    ? "ring-[2.5px] ring-[var(--wb-brand)]"
                    : "ring-1 ring-black/10",
                )}
              >
                <LayerSwatch layer={option.id} />
                {locked ? (
                  <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-[var(--wb-bracken)] text-[var(--wb-pine)]">
                    <LockIcon size={10} />
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-xs",
                  selected
                    ? "font-semibold text-[var(--wb-brand)]"
                    : "text-[var(--wb-label)]",
                )}
              >
                {option.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A small drawn swatch of each layer, so the choice reads at a glance. */
function LayerSwatch({ layer }: { layer: MapLayer }) {
  const rings = (
    count: number,
    spread: number,
    color: string,
    width: number,
    indexEvery = 0,
  ) =>
    Array.from({ length: count }, (_, index) => {
      const ring = index + 1;
      const r = ring * spread;
      const points = Array.from({ length: 49 }, (_, step) => {
        const angle = (step / 48) * Math.PI * 2;
        const wobble = 1 + 0.14 * Math.sin(3 * angle + ring * 0.4);
        return `${(43.6 + Math.cos(angle) * r * wobble * 1.2).toFixed(1)},${(25 + Math.sin(angle) * r * wobble).toFixed(1)}`;
      });
      const isIndex = indexEvery > 0 && ring % indexEvery === 0;
      return (
        <polyline
          key={ring}
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={isIndex ? width * 1.9 : width}
        />
      );
    });

  return (
    <svg viewBox="0 0 66 66" className="size-full" aria-hidden="true">
      {layer === "standard" ? (
        <>
          <rect width="66" height="66" fill="#E9EDD9" />
          <ellipse cx="14.5" cy="47.5" rx="15.8" ry="13.2" fill="#B3CFDC" />
          {rings(5, 7.3, "rgba(138,110,75,0.35)", 0.8)}
          <path
            d="M0 19.8C26 10 40 41 66 34"
            stroke="#fff"
            strokeWidth="2.4"
            fill="none"
          />
        </>
      ) : null}
      {layer === "satellite" ? (
        <>
          <rect width="66" height="66" fill="#3F4B30" />
          <ellipse cx="13" cy="16.5" rx="23.8" ry="19.8" fill="#5A6440" />
          <ellipse cx="49.5" cy="19.8" rx="20.6" ry="17.2" fill="#6E6A4A" />
          <ellipse cx="39.6" cy="52.8" rx="23.8" ry="19.8" fill="#2F3B26" />
          <ellipse cx="6.6" cy="59.4" rx="15.8" ry="13.2" fill="#4E5A39" />
          <ellipse cx="16.5" cy="46.2" rx="12.7" ry="10.6" fill="#23394A" />
          {rings(3, 7.3, "rgba(255,255,255,0.18)", 0.8)}
        </>
      ) : null}
      {layer === "contours" ? (
        <>
          <rect width="66" height="66" fill="#F4F0E1" />
          {rings(11, 4, "rgba(138,110,75,0.75)", 0.9, 5)}
        </>
      ) : null}
    </svg>
  );
}
