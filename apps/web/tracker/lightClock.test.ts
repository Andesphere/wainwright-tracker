import { describe, expect, it } from "vitest";
import { forcedLightPreset, lightPreset } from "./lightClock";

describe("light clock", () => {
  it("follows the sun over the Lake District", () => {
    expect(lightPreset(new Date("2026-06-21T12:00:00Z"))).toBe("day");
    expect(lightPreset(new Date("2026-06-21T00:30:00Z"))).toBe("night");
    expect(lightPreset(new Date("2026-12-21T08:00:00Z"))).toBe("dawn");
    expect(lightPreset(new Date("2026-12-21T16:00:00Z"))).toBe("dusk");
  });

  it("lets a query parameter force the lighting", () => {
    expect(forcedLightPreset("?light=night")).toBe("night");
    expect(forcedLightPreset("?light=noon")).toBeNull();
    expect(forcedLightPreset("")).toBeNull();
  });
});
