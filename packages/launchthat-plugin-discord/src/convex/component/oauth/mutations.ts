import { v } from "convex/values";
import { mutation } from "../server";

export const createOauthState = mutation({
  args: {
    organizationId: v.string(),
    kind: v.union(v.literal("org_install"), v.literal("user_link")),
    userId: v.optional(v.string()),
    state: v.string(),
    codeVerifier: v.string(),
    returnTo: v.string(),
    callbackPath: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthStates", {
      organizationId: args.organizationId,
      kind: args.kind,
      userId: args.userId,
      state: args.state,
      codeVerifier: args.codeVerifier,
      returnTo: args.returnTo,
      callbackPath: args.callbackPath,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const consumeOauthState = mutation({
  args: { state: v.string() },
  returns: v.union(
    v.object({
      organizationId: v.string(),
      kind: v.union(v.literal("org_install"), v.literal("user_link")),
      userId: v.optional(v.string()),
      codeVerifier: v.string(),
      returnTo: v.string(),
      callbackPath: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthStates")
      .withIndex("by_state", (q: any) => q.eq("state", args.state))
      .unique();
    if (!row) return null;
    await ctx.db.delete(row._id);
    return {
      organizationId: row.organizationId,
      kind: row.kind,
      userId: row.userId,
      codeVerifier: row.codeVerifier,
      returnTo: row.returnTo,
      callbackPath: row.callbackPath,
    };
  },
});


