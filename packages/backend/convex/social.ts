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
const clean = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};
const visibilityValidator = v.union(v.literal("public"), v.literal("private"));
type ProfileVisibility = "public" | "private";

type ProfileInput = {
  displayName: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  profileVisibility: ProfileVisibility;
};

const searchableTextFor = ({
  displayName,
  firstName,
  lastName,
  nickname,
}: Pick<ProfileInput, "displayName" | "firstName" | "lastName" | "nickname">) =>
  normalize(
    [
      displayName,
      firstName,
      lastName,
      nickname,
      [firstName, lastName].filter(Boolean).join(" "),
      nickname ? `${firstName} ${nickname}` : undefined,
    ]
      .filter(Boolean)
      .join(" "),
  );

const searchableFieldsFor = (input: {
  displayName: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
}) => ({
  searchableDisplayName: normalize(input.displayName),
  searchableFirstName: normalize(input.firstName),
  searchableLastName: normalize(input.lastName),
  searchableNickname: normalize(input.nickname),
  searchableText: searchableTextFor(input),
});

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

const identityProfileDefaults = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await requireIdentity(ctx);
  const email = clean(identity.email);
  const imageUrl = clean(identity.pictureUrl);
  const identityName = clean(identity.name);
  const fallbackName =
    identityName || email?.split("@")[0] || "Wainwright bagger";
  const [firstName, ...lastNameParts] = fallbackName
    .split(/\s+/)
    .filter(Boolean);

  return {
    displayName: fallbackName,
    email,
    firstName: firstName || fallbackName,
    imageUrl,
    lastName: clean(lastNameParts.join(" ")),
    userId: identity.subject,
  };
};

const publicIdentityFields = (profile: {
  displayName: string;
  firstName?: string;
  imageUrl?: string;
  lastName?: string;
  nickname?: string;
  onboardingCompletedAt?: number;
  profileVisibility?: ProfileVisibility;
  searchableText?: string;
  updatedAt: number;
  userId: string;
}) => ({
  displayName: profile.displayName,
  firstName: profile.firstName,
  imageUrl: profile.imageUrl,
  lastName: profile.lastName,
  needsOnboarding: !profile.onboardingCompletedAt,
  nickname: profile.nickname,
  onboardingCompletedAt: profile.onboardingCompletedAt,
  profileVisibility: profile.profileVisibility ?? "private",
  updatedAt: profile.updatedAt,
  userId: profile.userId,
});

const validateProfileInput = (args: ProfileInput): ProfileInput => {
  const firstName = clean(args.firstName);
  const displayName = clean(args.displayName) || firstName;
  if (!firstName) {
    throw new ConvexError({
      code: "FIRST_NAME_REQUIRED",
      message: "Add your first name so other baggers can recognise you.",
    });
  }
  if (!displayName) {
    throw new ConvexError({
      code: "DISPLAY_NAME_REQUIRED",
      message: "Choose the name other baggers will see.",
    });
  }

  return {
    displayName,
    firstName,
    lastName: clean(args.lastName),
    nickname: clean(args.nickname),
    profileVisibility: args.profileVisibility,
  };
};

const ensureCurrentProfile = async (ctx: MutationCtx) => {
  const defaults = await identityProfileDefaults(ctx);
  const now = Date.now();

  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", defaults.userId))
    .unique();

  if (existing) {
    const patch = existing.onboardingCompletedAt
      ? {
          email: defaults.email,
          imageUrl: defaults.imageUrl ?? existing.imageUrl,
          updatedAt: now,
        }
      : {
          displayName: existing.displayName || defaults.displayName,
          email: defaults.email,
          firstName: existing.firstName ?? defaults.firstName,
          imageUrl: defaults.imageUrl ?? existing.imageUrl,
          lastName: existing.lastName ?? defaults.lastName,
          updatedAt: now,
        };
    await ctx.db.patch(existing._id, patch);
    return { ...existing, ...patch };
  }

  const _id = await ctx.db.insert("userProfiles", {
    createdAt: now,
    displayName: defaults.displayName,
    email: defaults.email,
    firstName: defaults.firstName,
    imageUrl: defaults.imageUrl,
    lastName: defaults.lastName,
    profileVisibility: "private" as const,
    ...searchableFieldsFor({
      displayName: defaults.displayName,
      firstName: defaults.firstName,
      lastName: defaults.lastName,
    }),
    updatedAt: now,
    userId: defaults.userId,
  });

  return {
    _id,
    _creationTime: now,
    createdAt: now,
    displayName: defaults.displayName,
    email: defaults.email,
    firstName: defaults.firstName,
    imageUrl: defaults.imageUrl,
    lastName: defaults.lastName,
    profileVisibility: "private" as const,
    ...searchableFieldsFor({
      displayName: defaults.displayName,
      firstName: defaults.firstName,
      lastName: defaults.lastName,
    }),
    updatedAt: now,
    userId: defaults.userId,
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

const canViewProfile = (
  profile: {
    onboardingCompletedAt?: number;
    profileVisibility?: ProfileVisibility;
  },
  isSelf: boolean,
) =>
  isSelf ||
  (profile.profileVisibility === "public" &&
    Boolean(profile.onboardingCompletedAt));

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

  const isSelf = userId === viewerUserId;
  if (!canViewProfile(profile, isSelf)) return null;

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
    firstName: profile.firstName,
    followersCount: followers.length,
    followingCount: followingCount.length,
    imageUrl: profile.imageUrl,
    isFollowing: Boolean(following),
    isSelf,
    lastName: profile.lastName,
    nickname: profile.nickname,
    photoUrls: progress.photoUrls,
    profileVisibility: profile.profileVisibility ?? "private",
    updatedAt: progress.updatedAt,
    userId: profile.userId,
  };
};

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!existing) return null;
    return publicIdentityFields(existing);
  },
});

export const upsertCurrentProfile = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ensureCurrentProfile(ctx);
    return null;
  },
});

const profileArgs = {
  displayName: v.string(),
  firstName: v.string(),
  lastName: v.optional(v.string()),
  nickname: v.optional(v.string()),
  profileVisibility: visibilityValidator,
};

export const completeOnboarding = mutation({
  args: profileArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ensureCurrentProfile(ctx);
    const input = validateProfileInput(args);
    const now = Date.now();
    await ctx.db.patch(existing._id, {
      ...input,
      onboardingCompletedAt: now,
      ...searchableFieldsFor(input),
      updatedAt: now,
    });
    return null;
  },
});

export const updateProfileSettings = mutation({
  args: profileArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ensureCurrentProfile(ctx);
    const input = validateProfileInput(args);
    const now = Date.now();
    await ctx.db.patch(existing._id, {
      ...input,
      onboardingCompletedAt: existing.onboardingCompletedAt ?? now,
      ...searchableFieldsFor(input),
      updatedAt: now,
    });
    return null;
  },
});

export const searchBaggers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const viewerUserId = identity.subject;
    const needle = normalize(args.query);

    const queryByField = async (
      indexName:
        | "by_visibility_searchable_display_name"
        | "by_visibility_searchable_first_name"
        | "by_visibility_searchable_last_name"
        | "by_visibility_searchable_nickname",
      fieldName:
        | "searchableDisplayName"
        | "searchableFirstName"
        | "searchableLastName"
        | "searchableNickname",
    ) =>
      ctx.db
        .query("userProfiles")
        .withIndex(indexName, (q) =>
          q
            .eq("profileVisibility", "public")
            .gte(fieldName, needle)
            .lt(fieldName, `${needle}\uffff`),
        )
        .take(SEARCH_LIMIT);

    const profiles = needle
      ? [
          ...(await queryByField(
            "by_visibility_searchable_display_name",
            "searchableDisplayName",
          )),
          ...(await queryByField(
            "by_visibility_searchable_first_name",
            "searchableFirstName",
          )),
          ...(await queryByField(
            "by_visibility_searchable_last_name",
            "searchableLastName",
          )),
          ...(await queryByField(
            "by_visibility_searchable_nickname",
            "searchableNickname",
          )),
        ]
      : await ctx.db
          .query("userProfiles")
          .withIndex("by_visibility_searchable_text", (q) =>
            q.eq("profileVisibility", "public"),
          )
          .take(SEARCH_LIMIT + 1);

    const unique = Array.from(
      new Map(
        profiles
          .filter(
            (profile) =>
              profile.userId !== viewerUserId &&
              profile.profileVisibility === "public" &&
              Boolean(profile.onboardingCompletedAt),
          )
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
    if (!viewer.onboardingCompletedAt) {
      throw new ConvexError({
        code: "ONBOARDING_REQUIRED",
        message: "Set up your profile before following other baggers.",
      });
    }
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
    if (!target || !canViewProfile(target, false)) {
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
