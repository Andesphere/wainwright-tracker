import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userProgress: defineTable({
    completed: v.array(v.string()),
    updatedAt: v.number(),
    userId: v.string(),
  }).index("by_user", ["userId"]),
});
