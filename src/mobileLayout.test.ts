/// <reference types="node" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appSource = readFileSync(join(root, "src/App.tsx"), "utf8");
const cssSource = readFileSync(join(root, "src/index.css"), "utf8");

describe("mobile map layout", () => {
  it("stacks floating header controls below the brand card on phones", () => {
    expect(appSource).toContain("mobile-map-brand");
    expect(appSource).toContain("mobile-map-controls");
    expect(appSource).toContain("top-[calc(env(safe-area-inset-top)+4.75rem)]");
  });

  it("keeps MapLibre controls above the mobile journal bar", () => {
    expect(cssSource).toContain(".maplibregl-ctrl-bottom-right");
    expect(cssSource).toContain(
      "bottom: calc(env(safe-area-inset-bottom) + 5rem) !important;",
    );
  });

  it("resizes the map when mobile browser chrome changes the viewport", () => {
    expect(appSource).toContain("ResizeObserver");
    expect(appSource).toContain("visualViewport");
    expect(appSource).toContain("map.resize()");
  });

  it("keeps the completion drawer usable when the iOS keyboard opens", () => {
    expect(appSource).toContain("repositionInputs={false}");
    expect(appSource).toContain("completion-drawer-content");
    expect(appSource).toContain("completion-drawer-body");
    expect(appSource).toContain("overflow-y-auto");
    expect(cssSource).toContain(".completion-drawer-content");
    expect(cssSource).toContain("max-height: min(92dvh, 42rem);");
    expect(cssSource).toContain(".completion-drawer-body");
    expect(cssSource).toContain("-webkit-overflow-scrolling: touch;");
  });

  it("makes mobile map selection easy to hit and easy to clear", () => {
    expect(appSource).toContain('id: "peak-hit-area"');
    expect(appSource).toContain('layers: ["peak-hit-area", "clusters"]');
    expect(appSource).toContain("setSelectedId(null)");
    expect(appSource).toContain("show all fells");
    expect(cssSource).toContain("width: 48px;");
    expect(cssSource).toContain("height: 48px;");
  });

  it("uses progress as the header copy instead of mobile brand text", () => {
    const brandStart = appSource.indexOf("mobile-map-brand");
    const controlsStart = appSource.indexOf("mobile-map-controls");
    const brandMarkup = appSource.slice(brandStart, controlsStart);

    expect(brandMarkup).toContain("mobile-brand-progress");
    expect(brandMarkup).toContain("{doneCount}/{TOTAL_WAINWRIGHTS}");
    expect(brandMarkup).toContain("{percent}%");
    expect(brandMarkup).not.toContain("the lake district · 214 fells");
    expect(brandMarkup).not.toContain("fells journal");
  });

  it("pins the mobile completion percent to the right side of the header", () => {
    const brandStart = appSource.indexOf("mobile-map-brand");
    const controlsStart = appSource.indexOf("mobile-map-controls");
    const brandMarkup = appSource.slice(brandStart, controlsStart);

    expect(brandMarkup).toContain("justify-between");
    expect(brandMarkup).toContain("mobile-brand-percent");
    expect(brandMarkup).toContain("ml-auto");
  });

  it("lets users edit a bagged Wainwright from the list with existing details", () => {
    expect(appSource).toContain("PencilEdit02Icon");
    expect(appSource).toContain("onEdit");
    expect(appSource).toContain("aria-label={`edit ${peak.name}`}");
    expect(appSource).toContain("initialMetadata");
    expect(appSource).toContain('initialMetadata?.completedAt ?? ""');
    expect(appSource).toContain('initialMetadata?.note ?? ""');
  });

  it("turns the bottom mobile drawer trigger into an obvious Search button", () => {
    expect(appSource).toContain("mobile-search-trigger");
    expect(appSource).toContain('aria-label="open search"');
    expect(appSource).toContain("Search");
    expect(appSource).toContain("Search01Icon");
  });

  it("opens a mobile sidebar from the burger with search and configuration pages", () => {
    expect(appSource).toContain("mobile-sidebar-open");
    expect(appSource).toContain('aria-label="open menu"');
    expect(appSource).toContain('side="right"');
    expect(appSource).toContain("mobile-sidebar-page");
    expect(appSource).toContain('value="search"');
    expect(appSource).toContain('value="configuration"');
    expect(appSource).toContain("Configuration");
  });

  it("lets users configure one visible height unit and removes grid refs from list rows", () => {
    expect(appSource).toContain("HeightUnit");
    expect(appSource).toContain("loadHeightUnitPreference");
    expect(appSource).toContain("storeHeightUnitPreference");
    expect(appSource).toContain("formatPeakHeight(peak, heightUnit)");
    expect(appSource).toContain('value="m"');
    expect(appSource).toContain('value="ft"');

    const peakRowStart = appSource.indexOf("function PeakRow");
    const peakRowMarkup = appSource.slice(peakRowStart);
    expect(peakRowMarkup).not.toContain("heightMetres}m · {peak.heightFt}ft");
    expect(peakRowMarkup).not.toContain("peak.gridReference");
  });

  it("does not duplicate the tally card inside the search journal", () => {
    const journalStart = appSource.indexOf("function Journal");
    const resultsStart = appSource.indexOf("{/* Result meta */}", journalStart);
    const searchJournalMarkup = appSource.slice(journalStart, resultsStart);

    expect(searchJournalMarkup).not.toContain("HeroProgress");
    expect(searchJournalMarkup).not.toContain("your tally");
  });

  it("lets users queue, remove, replace, and fullscreen photos before saving", () => {
    expect(appSource).toContain("pendingPhotoPreviews");
    expect(appSource).toContain("removedPhotoStorageIds");
    expect(appSource).toContain("multiple");
    expect(appSource).toContain("fullscreenPhoto");
    expect(appSource).toContain("fullscreen-photo-dialog");
    expect(appSource).toContain("fullscreen-photo-image");
    expect(appSource).toContain("Open full screen photo");
    expect(cssSource).toContain(".fullscreen-photo-dialog");
    expect(cssSource).toContain("@media (orientation: landscape)");
    expect(cssSource).toContain("100dvw");
    expect(appSource).toContain(
      'aria-label={`remove ${photo.originalName ?? "saved photo"}`}',
    );
    expect(appSource).toContain("compressing photos…");
    expect(appSource).not.toContain("compressing + saving…");
  });

  it("keeps offline topo downloads automatic and out of the primary map controls", () => {
    expect(appSource).toContain("startAutoOfflineTopoDownload");
    expect(appSource).toContain("loadTopoPreference");
    expect(appSource).toContain("storeTopoPreference");
    expect(appSource).not.toContain(
      'aria-label={\n                  offlineStatus === "downloading"',
    );
    expect(appSource).not.toContain('aria-label="download lakes"');
    expect(appSource).not.toContain("download the full Wainwright map area");
  });

  it("keeps sort visible while moving rare filters and tools into progressive disclosure", () => {
    const journalStart = appSource.indexOf("function Journal");
    const advancedStart = appSource.indexOf("advanced-options", journalStart);
    const primaryControls = appSource.slice(journalStart, advancedStart);
    const advancedControls = appSource.slice(
      advancedStart,
      appSource.indexOf("<Dialog", advancedStart),
    );

    expect(primaryControls).toContain("Sort by");
    expect(primaryControls).toContain("Recently bagged");
    expect(primaryControls).toContain("Oldest bagged");
    expect(primaryControls).not.toContain("Reset all progress");
    expect(advancedControls).toContain("mobile-filter-summary");
    expect(advancedControls).toContain("Area filter");
    expect(advancedControls).toContain("Bulk add fells");
    expect(advancedControls).toContain("Reset all progress");
  });

  it("hides destructive progress actions behind progressive advanced options", () => {
    expect(appSource).toContain("advanced-options");
    expect(appSource).toContain("Advanced");
    expect(appSource).toContain("Reset all progress");
    expect(appSource).toContain("This will reset all of your bagged fells");
    expect(appSource).toContain("reset-confirmation-dialog");
    expect(appSource).not.toContain("onExport:");
    expect(appSource).not.toContain("onImportClick:");
  });
});
