import { v } from "convex/values";
import { query } from "../server";

export const peekOauthState = query({
  args: { state: v.string() },
  returns: v.union(
    v.object({
      kind: v.union(v.literal("org_install"), v.literal("user_link")),
      userId: v.optional(v.string()),
      returnTo: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("platformOauthStates")
      .withIndex("by_state", (q: any) => q.eq("state", args.state))
      .unique();
    if (!row) return null;
    return {
      kind: row.kind,
      userId: row.userId,
      returnTo: row.returnTo,
    };
  },
});
