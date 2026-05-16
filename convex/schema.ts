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
    imageUrl: v.optional(v.string()),
    searchableEmail: v.string(),
    searchableName: v.string(),
    updatedAt: v.number(),
    userId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_searchable_name", ["searchableName"])
    .index("by_searchable_email", ["searchableEmail"]),

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
