import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

const SEARCH_LIMIT = 12;
const PHOTO_PREVIEW_LIMIT = 6;

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Sign in to find and follow other baggers.",
    });
  }
  return identity;
};

const profileFieldsFromIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await requireIdentity(ctx);
  const email = identity.email?.trim();
  const displayName =
    identity.name?.trim() || email?.split("@")[0] || "Wainwright bagger";
  const imageUrl = identity.pictureUrl?.trim() || undefined;

  return {
    displayName,
    email,
    imageUrl,
    searchableEmail: normalize(email),
    searchableName: normalize(displayName),
    userId: identity.subject,
  };
};

const ensureCurrentProfile = async (ctx: MutationCtx) => {
  const profile = await profileFieldsFromIdentity(ctx);
  const now = Date.now();

  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", profile.userId))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { ...profile, updatedAt: now });
    return { ...existing, ...profile, updatedAt: now };
  }

  const _id = await ctx.db.insert("userProfiles", {
    ...profile,
    createdAt: now,
    updatedAt: now,
  });

  return {
    _id,
    _creationTime: now,
    ...profile,
    createdAt: now,
    updatedAt: now,
  };
};

const followDoc = async (
  ctx: QueryCtx | MutationCtx,
  followerUserId: string,
  followingUserId: string,
) =>
  ctx.db
    .query("follows")
    .withIndex("by_pair", (q) =>
      q
        .eq("followerUserId", followerUserId)
        .eq("followingUserId", followingUserId),
    )
    .unique();

const progressForUser = async (ctx: QueryCtx | MutationCtx, userId: string) => {
  const progress = await ctx.db
    .query("userProgress")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  const photoUrls = (
    await Promise.all(
      (progress?.entries ?? [])
        .flatMap((entry) => entry.photos ?? [])
        .slice(0, PHOTO_PREVIEW_LIMIT)
        .map((photo) => ctx.storage.getUrl(photo.storageId)),
    )
  ).filter((url): url is string => Boolean(url));

  return {
    completedCount: progress?.completed.length ?? 0,
    photoUrls,
    updatedAt: progress?.updatedAt,
  };
};

const publicProfile = async (
  ctx: QueryCtx | MutationCtx,
  userId: string,
  viewerUserId: string,
) => {
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!profile) return null;

  const [progress, following, followers, followingCount] = await Promise.all([
    progressForUser(ctx, userId),
    followDoc(ctx, viewerUserId, userId),
    ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingUserId", userId))
      .collect(),
    ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerUserId", userId))
      .collect(),
  ]);

  return {
    completedCount: progress.completedCount,
    displayName: profile.displayName,
    email: profile.email,
    followersCount: followers.length,
    followingCount: followingCount.length,
    imageUrl: profile.imageUrl,
    isFollowing: Boolean(following),
    isSelf: userId === viewerUserId,
    photoUrls: progress.photoUrls,
    updatedAt: progress.updatedAt,
    userId: profile.userId,
  };
};

export const upsertCurrentProfile = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ensureCurrentProfile(ctx);
    return null;
  },
});

export const searchBaggers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const viewerUserId = identity.subject;
    const needle = normalize(args.query);

    const profiles = needle
      ? [
          ...(await ctx.db
            .query("userProfiles")
            .withIndex("by_searchable_name", (q) =>
              q
                .gte("searchableName", needle)
                .lt("searchableName", `${needle}\uffff`),
            )
            .take(SEARCH_LIMIT)),
          ...(await ctx.db
            .query("userProfiles")
            .withIndex("by_searchable_email", (q) =>
              q
                .gte("searchableEmail", needle)
                .lt("searchableEmail", `${needle}\uffff`),
            )
            .take(SEARCH_LIMIT)),
        ]
      : await ctx.db
          .query("userProfiles")
          .order("desc")
          .take(SEARCH_LIMIT + 1);

    const unique = Array.from(
      new Map(
        profiles
          .filter((profile) => profile.userId !== viewerUserId)
          .map((profile) => [profile.userId, profile]),
      ).values(),
    ).slice(0, SEARCH_LIMIT);

    return Promise.all(
      unique.map(async (profile) => {
        const summary = await publicProfile(ctx, profile.userId, viewerUserId);
        return summary!;
      }),
    );
  },
});

export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return publicProfile(ctx, args.userId, identity.subject);
  },
});

export const follow = mutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const viewer = await ensureCurrentProfile(ctx);
    if (viewer.userId === args.userId) {
      throw new ConvexError({
        code: "CANNOT_FOLLOW_SELF",
        message: "You cannot follow yourself.",
      });
    }

    const target = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!target) {
      throw new ConvexError({
        code: "BAGGER_NOT_FOUND",
        message: "That bagger profile could not be found.",
      });
    }

    const existing = await followDoc(ctx, viewer.userId, args.userId);
    if (!existing) {
      await ctx.db.insert("follows", {
        createdAt: Date.now(),
        followerUserId: viewer.userId,
        followingUserId: args.userId,
      });
    }

    return null;
  },
});

export const unfollow = mutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const viewer = await ensureCurrentProfile(ctx);
    const existing = await followDoc(ctx, viewer.userId, args.userId);
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});
