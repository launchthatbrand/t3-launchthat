import { PORTAL_TENANT_ID, PORTAL_TENANT_SLUG } from "../constants";
import { mutation, query } from "../_generated/server";

import { v } from "convex/values";

const portalAwareOrgId = v.optional(
  v.union(v.id("organizations"), v.literal(PORTAL_TENANT_SLUG)),
);

// Remove the auth import since we'll use raw identity

// Get a specific option by key and type
export const get = query({
  args: {
    metaKey: v.string(),
    type: v.optional(v.union(v.literal("store"), v.literal("site"))),
    orgId: portalAwareOrgId,
  },
  handler: async (ctx, args) => {
    const option = await ctx.db
      .query("options")
      .withIndex("by_org_key_type", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("metaKey", args.metaKey)
          .eq("type", args.type),
      )
      .first();

    return option;
  },
});

// Get all options by type
export const getByType = query({
  args: {
    type: v.optional(v.union(v.literal("store"), v.literal("site"))),
    orgId: portalAwareOrgId,
  },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("options")
      .withIndex("by_org_and_type", (q) =>
        q.eq("orgId", args.orgId).eq("type", args.type),
      )
      .collect();

    return options;
  },
});

// Get all store options as key-value pairs
export const getStoreOptions = query({
  args: {
    orgId: portalAwareOrgId,
  },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("options")
      .withIndex("by_org_and_type", (q) =>
        q.eq("orgId", args.orgId).eq("type", "store"),
      )
      .collect();

    // Convert to key-value object
    const result: Record<string, unknown> = {};
    for (const option of options) {
      result[option.metaKey] = option.metaValue as unknown;
    }

    return result;
  },
});

// Set/update an option
export const set = mutation({
  args: {
    metaKey: v.string(),
    metaValue: v.any(),
    type: v.optional(v.union(v.literal("store"), v.literal("site"))),
    orgId: portalAwareOrgId,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const existing = await ctx.db
      .query("options")
      .withIndex("by_org_key_type", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("metaKey", args.metaKey)
          .eq("type", args.type),
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing option
      await ctx.db.patch(existing._id, {
        metaValue: args.metaValue as unknown,
        updatedAt: now,
        updatedBy: userId,
      });
      return existing._id;
    } else {
      // Create new option
      return await ctx.db.insert("options", {
        metaKey: args.metaKey,
        metaValue: args.metaValue as unknown,
        type: args.type,
        orgId: args.orgId,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      });
    }
  },
});

// Set multiple options at once (batch update)
export const setBatch = mutation({
  args: {
    options: v.array(
      v.object({
        metaKey: v.string(),
        metaValue: v.any(),
      }),
    ),
    type: v.optional(v.union(v.literal("store"), v.literal("site"))),
    orgId: portalAwareOrgId,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const now = Date.now();

    const results = [];

    for (const option of args.options) {
      const existing = await ctx.db
        .query("options")
        .withIndex("by_org_key_type", (q) =>
          q
            .eq("orgId", args.orgId)
            .eq("metaKey", option.metaKey)
            .eq("type", args.type),
        )
        .first();

      if (existing) {
        // Update existing option
        await ctx.db.patch(existing._id, {
          metaValue: option.metaValue as unknown,
          updatedAt: now,
          updatedBy: userId,
        });
        results.push(existing._id);
      } else {
        // Create new option
        const id = await ctx.db.insert("options", {
          metaKey: option.metaKey,
          metaValue: option.metaValue as unknown,
          type: args.type,
          orgId: args.orgId,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        });
        results.push(id);
      }
    }

    return results;
  },
});

// Delete an option
export const remove = mutation({
  args: {
    metaKey: v.string(),
    type: v.optional(v.union(v.literal("store"), v.literal("site"))),
    orgId: portalAwareOrgId,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("options")
      .withIndex("by_org_key_type", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("metaKey", args.metaKey)
          .eq("type", args.type),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }

    return false;
  },
});
