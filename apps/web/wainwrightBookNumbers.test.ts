import { describe, expect, it } from "vitest";

import {
  TOTAL_WAINWRIGHTS,
  WAINWRIGHTS,
} from "@wainwrights/catalog/wainwrights";

describe("Wainwright book numbers", () => {
  it("assigns every fell a unique Pictorial Guide number", () => {
    const bookNumbers = WAINWRIGHTS.map((peak) => peak.bookNumber).sort(
      (a, b) => a - b,
    );

    expect(bookNumbers).toHaveLength(TOTAL_WAINWRIGHTS);
    expect(bookNumbers).toEqual(
      Array.from({ length: TOTAL_WAINWRIGHTS }, (_, index) => index + 1),
    );
  });

  it("uses known guide-order anchor points", () => {
    expect(
      WAINWRIGHTS.find((peak) => peak.id === "arnison-crag")?.bookNumber,
    ).toBe(1);
    expect(
      WAINWRIGHTS.find((peak) => peak.id === "helvellyn")?.bookNumber,
    ).toBe(17);
    expect(
      WAINWRIGHTS.find((peak) => peak.id === "scafell-pike")?.bookNumber,
    ).toBe(123);
    expect(
      WAINWRIGHTS.find((peak) => peak.id === "yewbarrow")?.bookNumber,
    ).toBe(214);
  });
});
