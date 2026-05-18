export const MAX_PHOTOS_PER_WAINWRIGHT = 2;
export const MAX_PHOTO_EDGE_PX = 1600;
export const PHOTO_COMPRESSION_QUALITY = 0.78;

export type WainwrightPhotoMetadata = {
  mimeType?: string;
  originalName?: string;
  sizeBytes?: number;
  storageId: string;
  uploadedAt: string;
  url?: string | null;
};

export function addPhotoMetadata(
  existing: WainwrightPhotoMetadata[],
  photo: WainwrightPhotoMetadata,
) {
  if (existing.length >= MAX_PHOTOS_PER_WAINWRIGHT) {
    throw new Error(`Only ${MAX_PHOTOS_PER_WAINWRIGHT} photos are allowed`);
  }
  return [...existing, photo].sort((a, b) =>
    a.uploadedAt.localeCompare(b.uploadedAt),
  );
}

export function removePhotoMetadata(
  existing: WainwrightPhotoMetadata[],
  storageId: string,
) {
  return existing.filter((photo) => photo.storageId !== storageId);
}

export function validatePhotoSelectionLimit(
  savedCount: number,
  pendingCount: number,
  selectedCount: number,
) {
  if (savedCount + pendingCount + selectedCount > MAX_PHOTOS_PER_WAINWRIGHT) {
    throw new Error(`Only ${MAX_PHOTOS_PER_WAINWRIGHT} photos are allowed`);
  }
}

export function chooseCompressedImageType(inputType: string) {
  return inputType === "image/png" || inputType === "image/webp"
    ? "image/webp"
    : "image/jpeg";
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(
    1,
    MAX_PHOTO_EDGE_PX / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot resize images.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = chooseCompressedImageType(file.type);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Could not compress image.")),
      outputType,
      PHOTO_COMPRESSION_QUALITY,
    );
  });

  const extension = outputType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "wainwright-photo";
  return new File([blob], `${baseName}.${extension}`, {
    lastModified: Date.now(),
    type: outputType,
  });
}
