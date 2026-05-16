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
});
