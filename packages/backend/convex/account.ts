import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  mutation,
  type MutationCtx,
} from "./_generated/server";
import { deleteReleasedPhotos } from "./photos";

// Everything the app stores for one user: progress, photo files, profile,
// follows in both directions and the Pro entitlement row.
const deleteUserData = async (ctx: MutationCtx, userId: string) => {
  const progress = await ctx.db
    .query("userProgress")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (progress) {
    await deleteReleasedPhotos(ctx, progress.entries ?? [], []);
    await ctx.db.delete(progress._id);
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (profile) await ctx.db.delete(profile._id);

  const following = await ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerUserId", userId))
    .collect();
  const followers = await ctx.db
    .query("follows")
    .withIndex("by_following", (q) => q.eq("followingUserId", userId))
    .collect();
  for (const follow of [...following, ...followers]) {
    await ctx.db.delete(follow._id);
  }

  const entitlement = await ctx.db
    .query("entitlements")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (entitlement) await ctx.db.delete(entitlement._id);
};

// Removes everything the app stores for the signed-in user. Clients call this
// before deleting the Clerk user.
export const deleteMyData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Sign in to delete your account.",
      });
    }
    await deleteUserData(ctx, identity.subject);
    return null;
  },
});

// The Clerk `user.deleted` webhook (http.ts) calls this, so a user removed
// outside the apps (Clerk dashboard, Backend API) is cleaned up too.
export const deleteUserDataInternal = internalMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await deleteUserData(ctx, args.userId);
    return null;
  },
});
