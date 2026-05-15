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

    if (existing) {
      await ctx.db.patch(existing._id, { completed, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("userProgress", {
        completed,
        updatedAt: Date.now(),
        userId,
      });
    }

    return null;
  },
});

export const setBagged = mutation({
  args: { id: v.string(), bagged: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const previous = existing?.completed ?? [];
    const next = args.bagged
      ? Array.from(new Set([...previous, args.id])).sort()
      : previous.filter((id) => id !== args.id);

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: next,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProgress", {
        completed: next,
        updatedAt: Date.now(),
        userId,
      });
    }

    return null;
  },
});
