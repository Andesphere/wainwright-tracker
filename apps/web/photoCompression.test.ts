import { describe, expect, it } from "vitest";

import {
  MAX_PHOTOS_PER_WAINWRIGHT,
  addPhotoMetadata,
  chooseCompressedImageType,
  removePhotoMetadata,
  validatePhotoSelectionLimit,
} from "./photoCompression";

describe("wainwright photo helpers", () => {
  it("limits each Wainwright journal entry to two photos", () => {
    const existing = [
      { storageId: "photo-a", uploadedAt: "2026-01-01T00:00:00.000Z" },
      { storageId: "photo-b", uploadedAt: "2026-01-02T00:00:00.000Z" },
    ];

    expect(() =>
      addPhotoMetadata(existing, {
        storageId: "photo-c",
        uploadedAt: "2026-01-03T00:00:00.000Z",
      }),
    ).toThrow(`Only ${MAX_PHOTOS_PER_WAINWRIGHT} photos are allowed`);
  });

  it("stores uploaded photos in a stable order below the limit", () => {
    const next = addPhotoMetadata(
      [{ storageId: "photo-a", uploadedAt: "2026-01-01T00:00:00.000Z" }],
      { storageId: "photo-b", uploadedAt: "2026-01-02T00:00:00.000Z" },
    );

    expect(next.map((photo) => photo.storageId)).toEqual([
      "photo-a",
      "photo-b",
    ]);
  });

  it("removes saved photo metadata by storage id", () => {
    const next = removePhotoMetadata(
      [
        { storageId: "photo-a", uploadedAt: "2026-01-01T00:00:00.000Z" },
        { storageId: "photo-b", uploadedAt: "2026-01-02T00:00:00.000Z" },
      ],
      "photo-a",
    );

    expect(next.map((photo) => photo.storageId)).toEqual(["photo-b"]);
  });

  it("allows replacing removed photos with up to two pending selections", () => {
    expect(() => validatePhotoSelectionLimit(0, 0, 2)).not.toThrow();
    expect(() => validatePhotoSelectionLimit(1, 0, 2)).toThrow(
      `Only ${MAX_PHOTOS_PER_WAINWRIGHT} photos are allowed`,
    );
  });

  it("compresses images to jpeg unless transparency needs webp", () => {
    expect(chooseCompressedImageType("image/png")).toBe("image/webp");
    expect(chooseCompressedImageType("image/heic")).toBe("image/jpeg");
    expect(chooseCompressedImageType("image/jpeg")).toBe("image/jpeg");
  });
});
