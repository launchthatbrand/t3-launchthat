import { query } from "../_generated/server";
import { v } from "convex/values";

export const getProfileForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("journalProfiles"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      isPublic: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("journalProfiles")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();
    return row ?? null;
  },
});

export const listPublicProfiles = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("journalProfiles"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      isPublic: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(50, args.limit ?? 20));
    const rows = await ctx.db
      .query("journalProfiles")
      .withIndex("by_org_and_isPublic", (q) =>
        q.eq("organizationId", args.organizationId).eq("isPublic", true),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});


