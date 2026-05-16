import { describe, expect, it } from "vitest";

import { buildPeakPopupHtml } from "./peakPopup";
import { WAINWRIGHTS } from "./data/wainwrights";

describe("peak map popup", () => {
  it("includes a button that opens the bagging drawer for an unbagged fell", () => {
    const peak = WAINWRIGHTS.find((item) => item.id === "high-seat")!;

    const html = buildPeakPopupHtml(peak, false);

    expect(html).toContain("High Seat");
    expect(html).toContain('data-peak-action="bag"');
    expect(html).toContain('data-peak-id="high-seat"');
    expect(html).toContain("mark as bagged");
  });

  it("uses unbag wording when the fell is already bagged", () => {
    const peak = WAINWRIGHTS.find((item) => item.id === "high-seat")!;

    const html = buildPeakPopupHtml(peak, true);

    expect(html).toContain('data-peak-action="unbag"');
    expect(html).toContain("mark unbagged");
  });
});
