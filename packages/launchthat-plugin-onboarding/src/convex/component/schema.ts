import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const stepValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  route: v.optional(v.string()),
  required: v.optional(v.boolean()),
});

export default defineSchema({
  onboardingConfigs: defineTable({
    organizationId: v.string(),
    enabled: v.boolean(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaRoute: v.optional(v.string()),
    steps: v.array(stepValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizationId", ["organizationId"]),

  onboardingProgress: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    steps: v.array(
      v.object({
        id: v.string(),
        completedAt: v.number(),
      }),
    ),
    updatedAt: v.number(),
  }).index("by_organizationId_and_userId", ["organizationId", "userId"]),
});
