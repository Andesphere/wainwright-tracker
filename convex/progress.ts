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

const completionEntryValidator = v.object({
  completedAt: v.optional(v.string()),
  id: v.string(),
  note: v.optional(v.string()),
});

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
  returns: v.array(completionEntryValidator),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return progress?.entries ?? [];
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
