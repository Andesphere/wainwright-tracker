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

  it("makes mobile map selection easy to hit and fully reset to all fells", () => {
    expect(appSource).toContain('id: "peak-hit-area"');
    expect(appSource).toContain('layers: ["peak-hit-area", "clusters"]');
    expect(appSource).toContain("setSelectedId(null)");
    expect(appSource).toContain("show all fells");
    const showAllStart = appSource.indexOf("const showAllFells = () =>");
    const showAllEnd = appSource.indexOf("const resetProgress =", showAllStart);
    const showAllMarkup = appSource.slice(showAllStart, showAllEnd);
    expect(showAllMarkup).toContain('setQuery("")');
    expect(showAllMarkup).toContain("setArea(ALL_AREAS)");
    expect(showAllMarkup).toContain('setShowOnly("all")');
    expect(cssSource).toContain("width: 48px;");
    expect(cssSource).toContain("height: 48px;");
  });

  it("resets filters and recentres after saving a bagged fell", () => {
    const saveStart = appSource.indexOf("const savePeakCompletion = async");
    const saveEnd = appSource.indexOf("async function unbagPeak", saveStart);
    const saveMarkup = appSource.slice(saveStart, saveEnd);
    expect(saveMarkup).toContain("setSelectedId(null)");
    expect(saveMarkup).toContain("setSelectedDetailsOpen(false)");
    expect(saveMarkup).toContain('setQuery("")');
    expect(saveMarkup).toContain("setArea(ALL_AREAS)");
    expect(saveMarkup).toContain('setShowOnly("all")');
    expect(saveMarkup).toContain("requestAnimationFrame(fitLakeDistrict)");
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

  it("splits the bottom mobile actions between fell search and bagger discovery", () => {
    expect(appSource).toContain("mobile-action-bar");
    expect(appSource).toContain("mobile-search-trigger");
    expect(appSource).toContain("basis-[82%]");
    expect(appSource).toContain('aria-label="open search"');
    expect(appSource).toContain("Search");
    expect(appSource).toContain("Search01Icon");
    expect(appSource).toContain("mobile-baggers-trigger");
    expect(appSource).toContain('aria-label="find other baggers"');
    expect(appSource).toContain("UserGroupIcon");
  });

  it("adds a Polarsteps-style bagger discovery drawer with search, follows, profiles, and photos", () => {
    expect(appSource).toContain("PeopleDiscoverySheet");
    expect(appSource).toContain("Find other baggers");
    expect(appSource).toContain("Search by name or nickname");
    expect(appSource).toContain("Follow");
    expect(appSource).toContain("Following");
    expect(appSource).toContain("Wainwrights bagged");
    expect(appSource).toContain("photo-preview-grid");
  });

  it("uses friendly error boundaries instead of exposing raw Convex stack traces", () => {
    expect(appSource).toContain("AppErrorBoundary");
    expect(appSource).toContain("FeatureErrorBoundary");
    expect(appSource).toContain("Something went wrong");
    expect(appSource).toContain("We could not load this section");
    expect(appSource).toContain("componentDidCatch");
    expect(appSource).not.toContain("Called by client");
    expect(appSource).not.toContain("queryResult@");
  });

  it("gates signed-in users through profile setup and keeps email out of discovery UI", () => {
    expect(appSource).toContain("ProfileOnboardingGate");
    expect(appSource).toContain("Set up your bagger profile");
    expect(appSource).toContain("Profile & Privacy");
    expect(appSource).toContain("Search by name or nickname");
    expect(appSource).toContain("Public profile");
    expect(appSource).toContain("Private profile");
    expect(appSource).not.toContain("Search by name or email");
  });

  it("opens a mobile menu with album and configuration destinations", () => {
    expect(appSource).toContain("mobile-sidebar-open");
    expect(appSource).toContain('aria-label="open menu"');
    expect(appSource).toContain('side="right"');
    expect(appSource).toContain("mobile-albums-trigger");
    expect(appSource).toContain('aria-label="open albums"');
    expect(appSource).toContain("mobile-configuration-trigger");
    expect(appSource).toContain('aria-label="open configuration"');
    expect(appSource).toContain("mobile-settings-drawer");
    expect(appSource).toContain("All settings");
    expect(appSource).toContain("AlbumPage");
    expect(appSource).toContain("Wainwright albums");
    expect(appSource).toContain("Whole history");

    expect(appSource).not.toContain("MOBILE_SIDEBAR_PAGES");
    expect(appSource).not.toContain("mobile-sidebar-page");
    expect(appSource).not.toContain('value="search"');
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
