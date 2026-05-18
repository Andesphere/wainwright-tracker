import { describe, expect, it } from "vitest";

import {
  buildBulkReviewRows,
  parseDelimitedImportText,
  type BulkMatchResult,
} from "./bulkImport";

describe("bulk import helpers", () => {
  it("normalizes pasted CSV, spreadsheet, and text rows into AI-ready lines", () => {
    expect(
      parseDelimitedImportText(
        "Name,Date,Notes\nScafell Pike,2024-05-01,clear day\nHelvellyn\t2024-05-02\nGreat Gable",
      ),
    ).toEqual([
      "Scafell Pike 2024-05-01 clear day",
      "Helvellyn 2024-05-02",
      "Great Gable",
    ]);
  });

  it("builds a review queue that auto-selects one exact match and flags ambiguous rows", () => {
    const matches: BulkMatchResult[] = [
      {
        sourceText: "Scafell Pike",
        candidates: [
          {
            id: "scafell-pike",
            name: "Scafell Pike",
            confidence: 0.99,
            reason: "exact",
          },
        ],
      },
      {
        sourceText: "High Raise",
        candidates: [
          {
            id: "high-raise-high-street",
            name: "High Raise (High Street)",
            confidence: 0.74,
            reason: "area clue",
          },
          {
            id: "high-raise-langdale",
            name: "High Raise (Langdale)",
            confidence: 0.72,
            reason: "same name",
          },
        ],
      },
      { sourceText: "Not a fell", candidates: [] },
    ];

    const rows = buildBulkReviewRows(matches, new Set(["scafell-pike"]));

    expect(rows).toEqual([
      expect.objectContaining({
        selectedId: "scafell-pike",
        status: "already-bagged",
      }),
      expect.objectContaining({
        selectedId: undefined,
        status: "needs-choice",
      }),
      expect.objectContaining({ selectedId: undefined, status: "no-match" }),
    ]);
  });
});
