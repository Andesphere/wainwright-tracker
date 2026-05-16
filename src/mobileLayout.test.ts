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

  it("uses progress as the left header copy instead of mobile brand text", () => {
    const brandStart = appSource.indexOf("mobile-map-brand");
    const controlsStart = appSource.indexOf("mobile-map-controls");
    const brandMarkup = appSource.slice(brandStart, controlsStart);

    expect(brandMarkup).toContain("mobile-brand-progress");
    expect(brandMarkup).toContain("{doneCount}/{TOTAL_WAINWRIGHTS}");
    expect(brandMarkup).toContain("{percent}%");
    expect(brandMarkup).not.toContain("the lake district · 214 fells");
    expect(brandMarkup).not.toContain("fells journal");
  });

  it("lets users edit a bagged Wainwright from the list with existing details", () => {
    expect(appSource).toContain("PencilEdit02Icon");
    expect(appSource).toContain("onEdit");
    expect(appSource).toContain('aria-label={`edit ${peak.name}`}');
    expect(appSource).toContain("initialMetadata");
    expect(appSource).toContain("initialMetadata?.completedAt ?? \"\"");
    expect(appSource).toContain("initialMetadata?.note ?? \"\"");
  });

  it("turns the bottom mobile drawer trigger into an obvious Search button", () => {
    expect(appSource).toContain("mobile-search-trigger");
    expect(appSource).toContain('aria-label="open search"');
    expect(appSource).toContain("Search");
    expect(appSource).toContain("Search01Icon");
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
