import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type EntryWithPhotos = { photos?: { storageId: Id<"_storage"> }[] };

const storageIds = (entries: EntryWithPhotos[]) =>
  new Set(
    entries.flatMap((entry) =>
      (entry.photos ?? []).map((photo) => photo.storageId),
    ),
  );

// Deletes files that `before` referenced and `after` no longer does.
export const deleteReleasedPhotos = async (
  ctx: MutationCtx,
  before: EntryWithPhotos[],
  after: EntryWithPhotos[],
) => {
  const kept = storageIds(after);
  for (const storageId of storageIds(before)) {
    if (!kept.has(storageId)) await ctx.storage.delete(storageId);
  }
};
