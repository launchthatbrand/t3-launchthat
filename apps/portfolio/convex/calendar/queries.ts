import { v } from "convex/values";

import { query } from "../_generated/server";
import { getAuthenticatedConvexId } from "./lib/authUtils";

/**
 * List calendars the current user can access (owned, shared, or public)
 */
export const getUserCalendars = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("calendars"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      color: v.optional(v.string()),
      ownerId: v.id("users"),
      ownerType: v.union(
        v.literal("user"),
        v.literal("group"),
        v.literal("course"),
        v.literal("organization"),
      ),
      groupId: v.optional(v.id("groups")),
      courseId: v.optional(v.id("courses")),
      organizationId: v.optional(v.id("organizations")),
      isDefault: v.optional(v.boolean()),
      isPublic: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    // Always include public calendars
    const publicCalendars = await ctx.db
      .query("calendars")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();

    // Try to resolve the authenticated user; fall back to public only
    let userId: ReturnType<typeof getAuthenticatedConvexId> extends Promise<
      infer T
    >
      ? T
      : never;
    try {
      userId = await getAuthenticatedConvexId(ctx);
    } catch {
      // Unauthenticated: return only public calendars
      return publicCalendars;
    }

    // Owned calendars
    const owned = await ctx.db
      .query("calendars")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    // Shared with user via permissions
    const permissions = await ctx.db
      .query("calendarPermissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const sharedIds = permissions.map((p) => p.calendarId);
    const shared: typeof owned = [];
    for (const id of sharedIds) {
      const c = await ctx.db.get(id);
      if (c) shared.push(c);
    }

    // Merge unique by _id
    const byId = new Map(owned.map((c) => [c._id, c] as const));
    for (const c of shared) byId.set(c._id, c);
    for (const c of publicCalendars) byId.set(c._id, c);

    return Array.from(byId.values());
  },
});
