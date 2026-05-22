import {
  getAlbumMapBounds,
  getAlbumMapMarkers,
  buildMapPinsHtml,
} from "./albumMap";
import {
  formatAlbumDateLabel,
  type WainwrightAlbumItem,
} from "./albums";

export type AlbumExportHeightUnit = "m" | "ft";
export type AlbumExportLayout = "portraitPair" | "classic";

export type AlbumExportDayGroup = {
  dateKey: string;
  items: WainwrightAlbumItem[];
};

export type AlbumExportOptions = {
  layout: AlbumExportLayout;
  coverTopoMap: boolean;
  dayMiniMaps: boolean;
  dayGroups?: AlbumExportDayGroup[];
};

export type AlbumExportDocumentOptions = {
  heightUnit: AlbumExportHeightUnit;
  items: WainwrightAlbumItem[];
  subtitle: string;
  title: string;
  exportOptions?: AlbumExportOptions;
};

export const ALBUM_PRINT_WINDOW_FEATURES = "width=1040,height=1200";
export const MAPLIBRE_CDN_VERSION = "5.24.0";
export const OPENTOPOMAP_TILE_URL =
  "https://tile.opentopomap.org/{z}/{x}/{y}.png";

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatHeight(item: WainwrightAlbumItem, unit: AlbumExportHeightUnit) {
  return unit === "m"
    ? `${item.peak.heightMetres} m`
    : `${item.peak.heightFt} ft`;
}

function formatRecordedDate(item: WainwrightAlbumItem) {
  const date = new Date(`${item.completedDateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return item.completedDateKey;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildPhotoMosaic(item: WainwrightAlbumItem) {
  const photos =
    item.entry.photos?.filter((photo) => photo.url).slice(0, 4) ?? [];
  if (photos.length === 0) {
    return `<div class="photo-placeholder">No photo saved yet</div>`;
  }

  return `<div class="photo-mosaic photo-count-${Math.min(photos.length, 4)}">${photos
    .map(
      (photo) =>
        `<img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.originalName ?? `${item.peak.name} Wainwright photo`)}" />`,
    )
    .join("")}</div>`;
}

function buildPortraitPhotoGrid(item: WainwrightAlbumItem) {
  const photos =
    item.entry.photos?.filter((photo) => photo.url).slice(0, 2) ?? [];
  if (photos.length === 0) {
    return `<div class="photo-placeholder">No photo saved yet</div>`;
  }

  return `<div class="photo-grid photo-count-${photos.length}">${photos
    .map(
      (photo) =>
        `<img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.originalName ?? `${item.peak.name} Wainwright photo`)}" />`,
    )
    .join("")}</div>`;
}

function buildFellSlot(
  item: WainwrightAlbumItem,
  index: number,
  heightUnit: AlbumExportHeightUnit,
) {
  return `<article class="fell-slot">
    <p class="fell-index">${String(index + 1).padStart(2, "0")} · ${escapeHtml(formatRecordedDate(item))}</p>
    <h2>${escapeHtml(item.peak.name)}</h2>
    <p class="fell-meta">${escapeHtml(formatHeight(item, heightUnit))} · ${escapeHtml(item.peak.area)}</p>
    ${item.entry.note ? `<p class="fell-note">${escapeHtml(item.entry.note)}</p>` : ""}
    ${buildPortraitPhotoGrid(item)}
  </article>`;
}

function buildFellPairPages(
  items: WainwrightAlbumItem[],
  heightUnit: AlbumExportHeightUnit,
  startIndex = 0,
) {
  return chunkItems(items, 2)
    .map((pair, pageIndex) => {
      const slots = pair
        .map((item, pairIndex) =>
          buildFellSlot(item, startIndex + pageIndex * 2 + pairIndex, heightUnit),
        )
        .join("");
      const filler =
        pair.length === 1 ? `<div class="fell-slot fell-slot-empty" aria-hidden="true"></div>` : "";
      return `<section class="fell-pair-page">${slots}${filler}</section>`;
    })
    .join("");
}

function buildFellCards(
  items: WainwrightAlbumItem[],
  heightUnit: AlbumExportHeightUnit,
) {
  return items
    .map(
      (item, index) => `<article class="fell-card">
        <div class="fell-copy">
          <p class="fell-index">${String(index + 1).padStart(2, "0")} · ${escapeHtml(formatRecordedDate(item))}</p>
          <h2>${escapeHtml(item.peak.name)}</h2>
          <p class="fell-meta">${escapeHtml(formatHeight(item, heightUnit))} · ${escapeHtml(item.peak.area)}</p>
          ${item.entry.note ? `<p class="fell-note">${escapeHtml(item.entry.note)}</p>` : ""}
        </div>
        ${buildPhotoMosaic(item)}
      </article>`,
    )
    .join("");
}

function buildTopoMapElement(mapId: string, label: string, compact = false) {
  const className = compact ? "topo-map topo-map-mini" : "topo-map topo-map-cover";
  return `<div class="${className}" id="${escapeHtml(mapId)}" data-map-label="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"></div>`;
}

function buildDecorativeMapThumb(items: WainwrightAlbumItem[], label: string) {
  return `<div class="map-thumb" aria-label="${escapeHtml(label)}">
    ${buildMapPinsHtml(items)}
    <span class="map-label">${escapeHtml(label)}</span>
  </div>`;
}

type MapConfigEntry = {
  id: string;
  bounds: NonNullable<ReturnType<typeof getAlbumMapBounds>>;
  markers: ReturnType<typeof getAlbumMapMarkers>;
  compact: boolean;
};

function buildMapConfigs(
  items: WainwrightAlbumItem[],
  coverTopoMap: boolean,
  dayMiniMaps: boolean,
  dayGroups: AlbumExportDayGroup[],
): MapConfigEntry[] {
  const configs: MapConfigEntry[] = [];
  if (coverTopoMap) {
    const bounds = getAlbumMapBounds(items, 0.02);
    if (bounds) {
      configs.push({
        id: "cover-map",
        bounds,
        markers: getAlbumMapMarkers(items),
        compact: false,
      });
    }
  }
  if (dayMiniMaps) {
    for (const group of dayGroups) {
      const bounds = getAlbumMapBounds(group.items, 0.012);
      if (!bounds) continue;
      configs.push({
        id: `mini-map-${group.dateKey}`,
        bounds,
        markers: getAlbumMapMarkers(group.items),
        compact: true,
      });
    }
  }
  return configs;
}

function buildTopoMapInitScript(mapConfigs: MapConfigEntry[]) {
  if (mapConfigs.length === 0) {
    return `<script>window.addEventListener('load', () => setTimeout(() => window.print(), 250));</script>`;
  }

  const serialized = JSON.stringify(mapConfigs).replaceAll("<", "\\u003c");
  return `<script src="https://unpkg.com/maplibre-gl@${MAPLIBRE_CDN_VERSION}/dist/maplibre-gl.js"></script>
  <script>
    (function () {
      const mapConfigs = ${serialized};
      const tileUrl = ${JSON.stringify(OPENTOPOMAP_TILE_URL)};
      const status = document.getElementById('map-status');
      let pending = mapConfigs.length;
      let printed = false;

      function schedulePrint() {
        if (printed || pending > 0) return;
        printed = true;
        if (status) status.textContent = 'Opening print dialog…';
        setTimeout(() => window.print(), 350);
      }

      function initMap(config) {
        const container = document.getElementById(config.id);
        if (!container || !window.maplibregl) {
          pending -= 1;
          schedulePrint();
          return;
        }

        const map = new maplibregl.Map({
          container,
          style: {
            version: 8,
            sources: {
              topo: {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256,
                attribution: '© OpenTopoMap (CC-BY-SA)',
              },
            },
            layers: [{ id: 'topo-layer', type: 'raster', source: 'topo' }],
          },
          interactive: false,
          attributionControl: false,
          preserveDrawingBuffer: true,
          fadeDuration: 0,
        });

        map.on('load', () => {
          const bounds = [
            [config.bounds.minLng, config.bounds.minLat],
            [config.bounds.maxLng, config.bounds.maxLat],
          ];
          map.fitBounds(bounds, {
            padding: config.compact ? 28 : 48,
            duration: 0,
            maxZoom: config.compact ? 11 : 10,
          });

          for (const marker of config.markers) {
            const element = document.createElement('div');
            element.className = config.compact ? 'maplibre-pin maplibre-pin-mini' : 'maplibre-pin';
            element.textContent = String(marker.index);
            new maplibregl.Marker({ element, anchor: 'center' })
              .setLngLat([marker.longitude, marker.latitude])
              .addTo(map);
          }

          map.once('idle', () => {
            map.resize();
            pending -= 1;
            schedulePrint();
          });
        });

        map.on('error', () => {
          pending -= 1;
          schedulePrint();
        });
      }

      window.addEventListener('load', () => {
        if (status) status.textContent = 'Preparing maps…';
        for (const config of mapConfigs) initMap(config);
        setTimeout(() => {
          if (!printed) {
            pending = 0;
            schedulePrint();
          }
        }, 8000);
      });
    })();
  </script>`;
}

function buildCoverPage(
  title: string,
  subtitle: string,
  items: WainwrightAlbumItem[],
  photoCount: number,
  printedAt: string,
  coverTopoMap: boolean,
) {
  const mapSection = coverTopoMap
    ? buildTopoMapElement("cover-map", "All Wainwrights in this export")
    : buildDecorativeMapThumb(items, "All Wainwrights in this export");

  return `<section class="cover-map-page">
    <div class="cover-header">
      <p class="eyebrow">Wainwright album</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
      <div class="hero-stats">
        <span class="stat"><strong>${items.length}</strong> Wainwright${items.length === 1 ? "" : "s"}</span>
        <span class="stat"><strong>${photoCount}</strong> photo${photoCount === 1 ? "" : "s"}</span>
        <span class="stat">Printed ${escapeHtml(printedAt)}</span>
      </div>
    </div>
    ${mapSection}
  </section>`;
}

function buildDayChapters(
  dayGroups: AlbumExportDayGroup[],
  heightUnit: AlbumExportHeightUnit,
  dayMiniMaps: boolean,
) {
  let globalIndex = 0;
  return dayGroups
    .map((group) => {
      const compactClass =
        group.items.length <= 2 ? " day-chapter--compact" : "";
      const miniMap = dayMiniMaps
        ? buildTopoMapElement(
            `mini-map-${group.dateKey}`,
            `${formatAlbumDateLabel(group.dateKey)} mini map`,
            true,
          )
        : "";
      const pairPages = buildFellPairPages(
        group.items,
        heightUnit,
        globalIndex,
      );
      globalIndex += group.items.length;
      return `<section class="day-chapter${compactClass}">
        <header class="day-header">
          <p class="day-eyebrow">Album day</p>
          <h3>${escapeHtml(formatAlbumDateLabel(group.dateKey))}</h3>
          <p class="day-meta">${group.items.length} Wainwright${group.items.length === 1 ? "" : "s"}</p>
        </header>
        ${miniMap}
        ${pairPages}
      </section>`;
    })
    .join("");
}

function buildPortraitBody(
  title: string,
  subtitle: string,
  items: WainwrightAlbumItem[],
  heightUnit: AlbumExportHeightUnit,
  photoCount: number,
  printedAt: string,
  options: AlbumExportOptions,
) {
  const dayGroups =
    options.dayGroups && options.dayGroups.length > 0
      ? options.dayGroups
      : [{ dateKey: "export", items }];
  const useDayChapters =
    options.dayMiniMaps && options.dayGroups && options.dayGroups.length > 1;
  const content = useDayChapters
    ? buildDayChapters(dayGroups, heightUnit, options.dayMiniMaps)
    : buildFellPairPages(items, heightUnit);

  return `${buildCoverPage(title, subtitle, items, photoCount, printedAt, options.coverTopoMap)}
    <section class="album-content">${content}</section>`;
}

function buildClassicBody(
  title: string,
  subtitle: string,
  items: WainwrightAlbumItem[],
  heightUnit: AlbumExportHeightUnit,
  photoCount: number,
  printedAt: string,
  coverTopoMap: boolean,
) {
  const mapSection = coverTopoMap
    ? buildTopoMapElement("cover-map", "All Wainwrights in this export")
    : `<div class="map-thumb" aria-label="All Wainwrights in this export">
        ${buildMapPinsHtml(items)}
        <span class="map-label">All Wainwrights in this export</span>
      </div>`;

  return `<section class="hero">
      <div>
        <p class="eyebrow">Wainwright album</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        <div class="hero-stats">
          <span class="stat"><strong>${items.length}</strong> Wainwright${items.length === 1 ? "" : "s"}</span>
          <span class="stat"><strong>${photoCount}</strong> photo${photoCount === 1 ? "" : "s"}</span>
          <span class="stat">Printed ${escapeHtml(printedAt)}</span>
        </div>
      </div>
      ${mapSection}
    </section>
    <section class="fell-grid">
      ${buildFellCards(items, heightUnit)}
    </section>`;
}

function buildSharedStyles(layout: AlbumExportLayout, hasTopoMaps: boolean) {
  const topoMapStyles = hasTopoMaps
    ? `
    .topo-map {
      position: relative;
      width: 100%;
      overflow: hidden;
      background: #e8ebe2;
    }
    .topo-map-mini {
      min-height: 120px;
      height: 120px;
      border-radius: 16px;
      margin-bottom: 12px;
      border: 1px solid #e5e5ea;
    }
    .topo-map-cover {
      min-height: 240mm;
      border-radius: 20px;
      border: 1px solid #e5e5ea;
      flex: 1;
    }
    .hero .topo-map {
      min-height: 260px;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,.22);
    }
    .maplibre-pin {
      display: grid;
      width: 28px;
      height: 28px;
      place-items: center;
      border-radius: 999px;
      background: #0071e3;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 6px 16px rgba(0,0,0,.28);
      outline: 3px solid rgba(255,255,255,.92);
    }
    .maplibre-pin-mini { width: 22px; height: 22px; font-size: 10px; }
    `
    : "";

  const portraitStyles =
    layout === "portraitPair"
      ? `
    @page { size: A4 portrait; margin: 12mm; }
    .cover-map-page {
      display: grid;
      grid-template-rows: auto minmax(240mm, 1fr);
      gap: 16px;
      min-height: calc(297mm - 24mm);
      page-break-after: always;
      break-after: page;
      padding: 0 0 8px;
    }
    .cover-header { padding: 8px 0 0; }
    .cover-header h1 { font-size: clamp(32px, 6vw, 56px); }
    .cover-header .subtitle { color: #6e6e73; font-size: 15px; max-width: 620px; }
    .cover-header .hero-stats { margin-top: 14px; }
    .cover-header .stat {
      border: 1px solid #e5e5ea;
      color: #6e6e73;
    }
    .cover-header .stat strong { color: #1d1d1f; }
    .album-content { display: grid; gap: 0; }
    .day-chapter { margin-bottom: 8px; }
    .day-chapter--compact { break-inside: avoid; page-break-inside: avoid; }
    .day-header { margin: 8px 0 10px; }
    .day-eyebrow {
      margin: 0 0 6px;
      font-size: 10px;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: #86868b;
    }
    .day-header h3 {
      margin: 0;
      font-size: clamp(24px, 4vw, 34px);
      line-height: 1;
      letter-spacing: -.04em;
    }
    .day-meta { margin: 6px 0 0; font-size: 12px; color: #6e6e73; }
    .fell-pair-page {
      display: grid;
      grid-template-rows: 1fr 1fr;
      gap: 14px;
      min-height: calc(297mm - 24mm);
      page-break-after: always;
      break-after: page;
    }
    .fell-pair-page:last-child { page-break-after: auto; break-after: auto; }
    .fell-slot {
      display: grid;
      grid-template-rows: auto auto auto auto 1fr;
      gap: 6px;
      min-height: 0;
      padding: 12px;
      border: 1px solid #e5e5ea;
      border-radius: 18px;
      background: #fff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .fell-slot-empty { visibility: hidden; border-style: dashed; background: transparent; }
    .fell-slot h2 {
      margin: 0;
      font-size: clamp(22px, 3.5vw, 32px);
      line-height: 1;
      letter-spacing: -.04em;
    }
    .fell-slot .fell-note {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: #3a3a3c;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .photo-grid {
      display: grid;
      gap: 8px;
      min-height: 0;
      height: 100%;
      align-content: stretch;
    }
    .photo-grid.photo-count-1 { grid-template-columns: 1fr; }
    .photo-grid.photo-count-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .photo-grid img {
      width: 100%;
      max-height: 100%;
      min-height: 120px;
      object-fit: contain;
      border-radius: 12px;
      background: #f5f5f7;
    }
    .fell-slot .photo-placeholder {
      display: grid;
      min-height: 120px;
      height: 100%;
      place-items: center;
      border: 1px dashed #c7c7cc;
      border-radius: 12px;
      background: #f5f5f7;
      color: #86868b;
      font-size: 12px;
    }
    @media print {
      .fell-pair-page { break-after: page; }
      .cover-map-page { break-after: page; }
    }
    `
      : "";

  const mapStatusStyles = hasTopoMaps
    ? `
    .map-status {
      position: fixed;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      z-index: 20;
      border-radius: 999px;
      background: rgba(29,29,31,.92);
      color: #fff;
      padding: 10px 16px;
      font-size: 12px;
      letter-spacing: .04em;
    }
    @media print { .map-status { display: none !important; } }
    `
    : "";

  return `
    ${topoMapStyles}
    ${portraitStyles}
    ${mapStatusStyles}
    @page { size: A4${layout === "portraitPair" ? " portrait" : ""}; margin: ${layout === "portraitPair" ? "12mm" : "13mm"}; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f5f5f7;
      color: #1d1d1f;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .album-export { max-width: 1040px; margin: 0 auto; background: #fff; }
    .hero {
      display: grid;
      gap: 20px;
      padding: 34px;
      border-radius: 28px;
      background: #000;
      color: #fff;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .eyebrow { margin: 0 0 8px; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; opacity: .72; }
    h1 { margin: 0; font-size: clamp(34px, 7vw, 68px); line-height: .96; letter-spacing: -.05em; }
    .subtitle { max-width: 620px; margin: 12px 0 0; font-size: 16px; line-height: 1.45; color: rgba(255,255,255,.76); }
    .hero-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
    .stat { border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 7px 12px; font-size: 12px; color: rgba(255,255,255,.78); }
    .stat strong { color: #fff; }
    .map-thumb {
      position: relative;
      min-height: 260px;
      border-radius: 24px;
      overflow: hidden;
      background:
        radial-gradient(circle at 18% 18%, rgba(216, 220, 200, .9), transparent 26%),
        radial-gradient(circle at 76% 30%, rgba(136, 162, 104, .9), transparent 28%),
        linear-gradient(135deg, #d8dcc8, #9eaf78 48%, #65784f);
      border: 1px solid rgba(255,255,255,.22);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
    }
    .map-thumb::before, .map-thumb::after { content: ""; position: absolute; inset: 18%; border: 1px solid rgba(255,255,255,.22); border-radius: 999px; transform: rotate(-18deg); }
    .map-thumb::after { inset: 31% 10%; transform: rotate(22deg); }
    .map-label { position: absolute; left: 16px; bottom: 14px; border-radius: 999px; background: rgba(255,255,255,.86); padding: 7px 11px; color: #1d1d1f; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .map-pin { position: absolute; display: grid; width: 26px; height: 26px; place-items: center; transform: translate(-50%, -50%); border-radius: 999px; background: #0071e3; color: #fff; font-size: 11px; font-weight: 700; box-shadow: 0 8px 22px rgba(0,0,0,.32); outline: 3px solid rgba(255,255,255,.9); }
    .fell-grid { display: grid; gap: 16px; padding: 20px 0 0; }
    .fell-card { display: grid; grid-template-columns: minmax(0, .95fr) minmax(220px, 1.05fr); gap: 16px; min-height: 220px; padding: 18px; border: 1px solid #e5e5ea; border-radius: 24px; page-break-inside: avoid; background: #fff; }
    .fell-copy { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
    .fell-index { margin: 0 0 10px; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: #6e6e73; }
    h2 { margin: 0; font-size: clamp(28px, 5vw, 46px); line-height: .98; letter-spacing: -.045em; }
    .fell-meta { margin: 10px 0 0; font-size: 13px; color: #6e6e73; }
    .fell-note { margin: 16px 0 0; font-size: 13px; line-height: 1.5; color: #3a3a3c; }
    .photo-mosaic { display: grid; gap: 6px; height: 220px; min-height: 190px; }
    .photo-mosaic img { width: 100%; height: 100%; min-height: 92px; object-fit: cover; border-radius: 16px; background: #f5f5f7; }
    .photo-count-1 { grid-template-columns: 1fr; }
    .photo-count-2, .photo-count-3, .photo-count-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .photo-count-3 img:first-child { grid-row: span 2; }
    .photo-placeholder { display: grid; min-height: 190px; place-items: center; border: 1px dashed #c7c7cc; border-radius: 18px; background: #f5f5f7; color: #86868b; font-size: 13px; }
    .footer { margin-top: 22px; padding: 14px 0 0; border-top: 1px solid #e5e5ea; color: #86868b; font-size: 10px; }
    @media print {
      body { background: #fff; }
      .album-export { box-shadow: none; }
      .hero { border-radius: 0; }
      .fell-card { break-inside: avoid; }
      .print-action { display: none !important; }
    }
    @media (max-width: 760px) {
      .hero { padding: 24px; }
      .fell-card { grid-template-columns: 1fr; }
    }
  `;
}

export function buildAlbumExportDocument({
  heightUnit,
  items,
  subtitle,
  title,
  exportOptions,
}: AlbumExportDocumentOptions) {
  const options: AlbumExportOptions = {
    layout: exportOptions?.layout ?? "portraitPair",
    coverTopoMap: exportOptions?.coverTopoMap ?? true,
    dayMiniMaps: exportOptions?.dayMiniMaps ?? false,
    dayGroups: exportOptions?.dayGroups,
  };

  const photoCount = items.reduce(
    (total, item) =>
      total + (item.entry.photos?.filter((photo) => photo.url).length ?? 0),
    0,
  );
  const printedAt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const dayGroups =
    options.dayGroups && options.dayGroups.length > 0
      ? options.dayGroups
      : [{ dateKey: "export", items }];

  const mapConfigs = buildMapConfigs(
    items,
    options.coverTopoMap,
    options.dayMiniMaps,
    dayGroups,
  );
  const hasTopoMaps = mapConfigs.length > 0;
  const layout = options.layout;
  const bodyContent =
    layout === "portraitPair"
      ? buildPortraitBody(
          title,
          subtitle,
          items,
          heightUnit,
          photoCount,
          printedAt,
          options,
        )
      : buildClassicBody(
          title,
          subtitle,
          items,
          heightUnit,
          photoCount,
          printedAt,
          options.coverTopoMap,
        );

  const mapLibreCss = hasTopoMaps
    ? `<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@${MAPLIBRE_CDN_VERSION}/dist/maplibre-gl.css" />`
    : "";

  const mapStatus = hasTopoMaps
    ? `<p class="map-status" id="map-status">Preparing maps…</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · Wainwright album</title>
  ${mapLibreCss}
  <style>${buildSharedStyles(layout, hasTopoMaps)}</style>
</head>
<body>
  <main class="album-export layout-${escapeHtml(layout)}">
    ${bodyContent}
    <footer class="footer">Created with Wainwrights Bagger. Fell data © Database of British and Irish Hills / Wainwright Peaks datasets. Map data © OpenStreetMap contributors, SRTM | Style: © OpenTopoMap (CC-BY-SA).</footer>
  </main>
  ${mapStatus}
  ${buildTopoMapInitScript(mapConfigs)}
</body>
</html>`;
}

export function openAlbumPrintWindow(html: string) {
  const popup = window.open("", "_blank", ALBUM_PRINT_WINDOW_FEATURES);
  if (!popup) {
    throw new Error(
      "Pop-up blocked. Allow pop-ups to download the printable album PDF.",
    );
  }
  popup.opener = null;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
