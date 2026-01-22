import { v } from "convex/values";

import { query } from "../_generated/server";

type DataMode = "demo" | "live";

const normalizeDataMode = (value: unknown): DataMode => {
  return value === "demo" || value === "live" ? value : "live";
};

export const getViewerSettings = query({
  args: {},
  returns: v.object({
    isSignedIn: v.boolean(),
    isAdmin: v.boolean(),
    dataMode: v.union(v.literal("demo"), v.literal("live")),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isSignedIn: false, isAdmin: false, dataMode: "live" as const };
    }

    // Prefer tokenIdentifier (convex auth) when available.
    let existing =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first()) ?? null;

    if (
      !existing &&
      typeof identity.subject === "string" &&
      identity.subject.trim()
    ) {
      existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();
    }

    const isAdmin = Boolean(existing?.isAdmin);
    const dataMode = normalizeDataMode(existing?.dataMode);

    return { isSignedIn: true, isAdmin, dataMode };
  },
});

