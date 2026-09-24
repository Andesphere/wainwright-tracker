import { ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { deleteReleasedPhotos } from "./photos";

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
    const userId = identity.subject;

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

    return null;
  },
});
