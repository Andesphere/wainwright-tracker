import { describe, expect, it } from "vitest";
import { DEFAULT_TOPO_ENABLED } from "./mapPreferences";

describe("map defaults", () => {
  it("loads with topo overlay on by default", () => {
    expect(DEFAULT_TOPO_ENABLED).toBe(true);
  });
});
