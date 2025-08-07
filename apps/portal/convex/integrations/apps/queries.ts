import { v } from "convex/values";

import { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * List all available integration apps
 */
export const list = query({
  args: {
    showDisabled: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("apps"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      authType: v.string(),
      configTemplate: v.string(),
      iconUrl: v.optional(v.string()),
      isEnabled: v.boolean(),
      isInternal: v.optional(v.boolean()), // Add the isInternal field
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let appsQuery = ctx.db.query("apps");

    if (args.showDisabled !== undefined && !args.showDisabled) {
      appsQuery = appsQuery.withIndex("by_enabled", (q) =>
        q.eq("isEnabled", true),
      );
    }

    const apps = await appsQuery.collect();
    return apps as Array<Doc<"apps">>;
  },
});

/**
 * Get a specific app by ID
 */
export const get = query({
  args: {
    id: v.id("apps"),
  },
  returns: v.union(
    v.object({
      _id: v.id("apps"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      authType: v.string(),
      configTemplate: v.string(),
      iconUrl: v.optional(v.string()),
      isEnabled: v.boolean(),
      isInternal: v.optional(v.boolean()), // Add the isInternal field
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const app = await ctx.db.get(args.id);
    return app;
  },
});
