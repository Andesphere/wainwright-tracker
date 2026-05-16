import type { Wainwright } from "./data/wainwrights";

const escapeHtml = (value: string | number) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function buildPeakPopupHtml(peak: Wainwright, done: boolean) {
  const action = done ? "unbag" : "bag";
  const label = done ? "mark unbagged" : "mark as bagged";

  return `
    <div class="peak-popup-card">
      <strong>#${escapeHtml(peak.bookNumber)} · ${escapeHtml(peak.name)}</strong>
      <span>${escapeHtml(peak.heightMetres)}m · ${escapeHtml(peak.gridReference)}</span>
      <button
        type="button"
        class="peak-popup-action"
        data-peak-action="${action}"
        data-peak-id="${escapeHtml(peak.id)}"
      >${label}</button>
    </div>
  `;
}
