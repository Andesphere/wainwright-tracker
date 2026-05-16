import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
