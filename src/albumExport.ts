import type { WainwrightAlbumItem } from "./albums";

export type AlbumExportHeightUnit = "m" | "ft";

export type AlbumExportDocumentOptions = {
  heightUnit: AlbumExportHeightUnit;
  items: WainwrightAlbumItem[];
  subtitle: string;
  title: string;
};

export const ALBUM_PRINT_WINDOW_FEATURES = "width=1040,height=1200";

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

function buildMapPins(items: WainwrightAlbumItem[]) {
  if (items.length === 0) return "";
  const latitudes = items.map((item) => item.peak.latitude);
  const longitudes = items.map((item) => item.peak.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.015);
  const lngSpan = Math.max(maxLng - minLng, 0.015);

  return items
    .map((item, index) => {
      const left = 8 + ((item.peak.longitude - minLng) / lngSpan) * 84;
      const top = 88 - ((item.peak.latitude - minLat) / latSpan) * 76;
      return `<span class="map-pin" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%" title="${escapeHtml(item.peak.name)}">${index + 1}</span>`;
    })
    .join("");
}

function buildPhotoMosaic(item: WainwrightAlbumItem) {
  const photos = item.entry.photos?.filter((photo) => photo.url).slice(0, 4) ?? [];
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

function buildFellCards(items: WainwrightAlbumItem[], heightUnit: AlbumExportHeightUnit) {
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

export function buildAlbumExportDocument({
  heightUnit,
  items,
  subtitle,
  title,
}: AlbumExportDocumentOptions) {
  const photoCount = items.reduce(
    (total, item) => total + (item.entry.photos?.filter((photo) => photo.url).length ?? 0),
    0,
  );
  const printedAt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · Wainwright album</title>
  <style>
    @page { size: A4; margin: 13mm; }
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
  </style>
</head>
<body>
  <main class="album-export">
    <section class="hero">
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
      <div class="map-thumb" aria-label="All Wainwrights in this export">
        ${buildMapPins(items)}
        <span class="map-label">All Wainwrights in this export</span>
      </div>
    </section>
    <section class="fell-grid">
      ${buildFellCards(items, heightUnit)}
    </section>
    <footer class="footer">Created with Wainwrights Bagger. Fell data © Database of British and Irish Hills / Wainwright Peaks datasets.</footer>
  </main>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
}

export function openAlbumPrintWindow(html: string) {
  const popup = window.open("", "_blank", ALBUM_PRINT_WINDOW_FEATURES);
  if (!popup) {
    throw new Error("Pop-up blocked. Allow pop-ups to download the printable album PDF.");
  }
  popup.opener = null;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
