// Thin wrappers to read/write support component options from portal-side callers.
import { v } from "convex/values";

import { components } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";

// Cast to avoid deep type instantiation issues from generated bindings.
const supportQueries = components.launchthat_support.queries;
const supportMutations = components.launchthat_support.mutations;

export const getSupportOption = query({
  args: {
    organizationId: v.string(),
    key: v.string(),
  },
  returns: v.union(v.string(), v.number(), v.boolean(), v.null()),
  handler: async (ctx, args) => {
    const options = (await ctx.runQuery(supportQueries.listSupportOptions, {
      organizationId: args.organizationId,
    })) as { key: string; value: unknown }[];
    const match = options.find((o) => o.key === args.key);
    const value = match?.value;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return value;
    }
    return null;
  },
});

export const saveSupportOption = mutation({
  args: {
    organizationId: v.string(),
    key: v.string(),
    value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(supportMutations.upsertSupportOption, {
      organizationId: args.organizationId,
      key: args.key,
      value: args.value ?? null,
    });
    return null;
  },
});
