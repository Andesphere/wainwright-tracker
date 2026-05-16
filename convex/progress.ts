import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

const requireUserId = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Sign in to save progress.",
    });
  }
  return identity.subject;
};

const photoMetadataValidator = v.object({
  mimeType: v.optional(v.string()),
  originalName: v.optional(v.string()),
  sizeBytes: v.optional(v.number()),
  storageId: v.id("_storage"),
  uploadedAt: v.string(),
});

const photoWithUrlValidator = v.object({
  mimeType: v.optional(v.string()),
  originalName: v.optional(v.string()),
  sizeBytes: v.optional(v.number()),
  storageId: v.id("_storage"),
  uploadedAt: v.string(),
  url: v.union(v.string(), v.null()),
});

const completionEntryWithUrlsValidator = v.object({
  completedAt: v.optional(v.string()),
  id: v.string(),
  note: v.optional(v.string()),
  photos: v.optional(v.array(photoWithUrlValidator)),
});

const MAX_PHOTOS_PER_WAINWRIGHT = 2;

const cleanOptionalText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const get = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return progress?.completed ?? [];
  },
});

export const getEntries = query({
  args: {},
  returns: v.array(completionEntryWithUrlsValidator),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const entries = progress?.entries ?? [];
    return Promise.all(
      entries.map(async (entry) => ({
        ...entry,
        photos: await Promise.all(
          (entry.photos ?? []).map(async (photo) => ({
            ...photo,
            url: await ctx.storage.getUrl(photo.storageId),
          })),
        ),
      })),
    );
  },
});

export const replace = mutation({
  args: { completed: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const completed = Array.from(new Set(args.completed)).sort();
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const previousEntries = existing?.entries ?? [];
    const entries = completed.map(
      (id) => previousEntries.find((entry) => entry.id === id) ?? { id },
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed,
        entries,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProgress", {
        completed,
        entries,
        updatedAt: Date.now(),
        userId,
      });
    }

    return null;
  },
});

export const setBagged = mutation({
  args: {
    bagged: v.boolean(),
    completedAt: v.optional(v.string()),
    id: v.string(),
    note: v.optional(v.string()),
    photos: v.optional(v.array(photoMetadataValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const previous = existing?.completed ?? [];
    const previousEntries = existing?.entries ?? [];
    const next = args.bagged
      ? Array.from(new Set([...previous, args.id])).sort()
      : previous.filter((id) => id !== args.id);
    const entries = args.bagged
      ? [
          ...previousEntries.filter((entry) => entry.id !== args.id),
          {
            completedAt: cleanOptionalText(args.completedAt),
            id: args.id,
            note: cleanOptionalText(args.note),
            photos: args.photos,
          },
        ].sort((a, b) => a.id.localeCompare(b.id))
      : previousEntries.filter((entry) => entry.id !== args.id);

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: next,
        entries,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProgress", {
        completed: next,
        entries,
        updatedAt: Date.now(),
        userId,
      });
    }

    return null;
  },
});

export const generatePhotoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUserId(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const attachPhoto = mutation({
  args: {
    id: v.string(),
    mimeType: v.optional(v.string()),
    originalName: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const previous = existing?.completed ?? [];
    const previousEntries = existing?.entries ?? [];
    const entry = previousEntries.find((item) => item.id === args.id) ?? {
      id: args.id,
    };
    const photos = entry.photos ?? [];

    if (photos.length >= MAX_PHOTOS_PER_WAINWRIGHT) {
      throw new ConvexError({
        code: "PHOTO_LIMIT_REACHED",
        message: `Only ${MAX_PHOTOS_PER_WAINWRIGHT} photos are allowed per Wainwright.`,
      });
    }

    const nextEntry = {
      ...entry,
      photos: [
        ...photos,
        {
          mimeType: cleanOptionalText(args.mimeType),
          originalName: cleanOptionalText(args.originalName),
          sizeBytes: args.sizeBytes,
          storageId: args.storageId,
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
    const completed = Array.from(new Set([...previous, args.id])).sort();
    const entries = [
      ...previousEntries.filter((item) => item.id !== args.id),
      nextEntry,
    ].sort((a, b) => a.id.localeCompare(b.id));

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed,
        entries,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProgress", {
        completed,
        entries,
        updatedAt: Date.now(),
        userId,
      });
    }

    return null;
  },
});
