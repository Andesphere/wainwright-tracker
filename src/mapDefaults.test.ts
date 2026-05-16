import { describe, expect, it } from "vitest";
import { DEFAULT_TOPO_ENABLED } from "./App";

describe("map defaults", () => {
  it("loads with the flaky topo overlay turned off by default", () => {
    expect(DEFAULT_TOPO_ENABLED).toBe(false);
  });
});
