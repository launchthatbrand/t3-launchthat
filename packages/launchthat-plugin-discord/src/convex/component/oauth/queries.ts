import { v } from "convex/values";

import { query } from "../server";

/**
 * Read an OAuth state without consuming it.
 *
 * This is used for central redirect handlers (e.g. auth host) that need to look up
 * the original returnTo URL before bouncing the user back to the tenant host.
 */
export const peekOauthState = query({
  args: { state: v.string() },
  returns: v.union(
    v.object({
      scope: v.union(v.literal("org"), v.literal("platform")),
      organizationId: v.optional(v.string()),
      kind: v.union(v.literal("org_install"), v.literal("user_link")),
      userId: v.optional(v.string()),
      codeVerifier: v.string(),
      returnTo: v.string(),
      callbackPath: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthStates")
      .withIndex("by_state", (q: any) => q.eq("state", args.state))
      .unique();
    if (!row) return null;
    return {
      scope: row.scope === "platform" ? ("platform" as const) : ("org" as const),
      organizationId: row.organizationId,
      kind: row.kind,
      userId: row.userId,
      codeVerifier: row.codeVerifier,
      returnTo: row.returnTo,
      callbackPath: row.callbackPath,
      createdAt: row.createdAt,
    };
  },
});
