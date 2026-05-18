import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  follows: defineTable({
    createdAt: v.number(),
    followerUserId: v.string(),
    followingUserId: v.string(),
  })
    .index("by_follower", ["followerUserId"])
    .index("by_following", ["followingUserId"])
    .index("by_pair", ["followerUserId", "followingUserId"]),

  userProfiles: defineTable({
    createdAt: v.number(),
    displayName: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    lastName: v.optional(v.string()),
    nickname: v.optional(v.string()),
    onboardingCompletedAt: v.optional(v.number()),
    profileVisibility: v.optional(
      v.union(v.literal("public"), v.literal("private")),
    ),
    searchableDisplayName: v.optional(v.string()),
    searchableEmail: v.optional(v.string()),
    searchableFirstName: v.optional(v.string()),
    searchableLastName: v.optional(v.string()),
    searchableName: v.optional(v.string()),
    searchableNickname: v.optional(v.string()),
    searchableText: v.optional(v.string()),
    updatedAt: v.number(),
    userId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_visibility_searchable_text", [
      "profileVisibility",
      "searchableText",
    ])
    .index("by_visibility_searchable_display_name", [
      "profileVisibility",
      "searchableDisplayName",
    ])
    .index("by_visibility_searchable_first_name", [
      "profileVisibility",
      "searchableFirstName",
    ])
    .index("by_visibility_searchable_last_name", [
      "profileVisibility",
      "searchableLastName",
    ])
    .index("by_visibility_searchable_nickname", [
      "profileVisibility",
      "searchableNickname",
    ]),

  userProgress: defineTable({
    completed: v.array(v.string()),
    entries: v.optional(
      v.array(
        v.object({
          completedAt: v.optional(v.string()),
          id: v.string(),
          note: v.optional(v.string()),
          photos: v.optional(
            v.array(
              v.object({
                mimeType: v.optional(v.string()),
                originalName: v.optional(v.string()),
                sizeBytes: v.optional(v.number()),
                storageId: v.id("_storage"),
                uploadedAt: v.string(),
              }),
            ),
          ),
        }),
      ),
    ),
    updatedAt: v.number(),
    userId: v.string(),
  }).index("by_user", ["userId"]),
});
