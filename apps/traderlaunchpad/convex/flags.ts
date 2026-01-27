import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { clampPercent, isUserInRollout } from "../src/lib/rollout";

const flagKeyValidator = v.string();

const flagValidator = v.object({
  key: v.string(),
  enabled: v.boolean(),
  rolloutPercent: v.optional(v.number()),
  allowUserIds: v.optional(v.array(v.string())),
  denyUserIds: v.optional(v.array(v.string())),
  updatedAt: v.number(),
});

const requirePlatformAdmin = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  let viewer =
    (await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first()) ?? null;

  if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
    viewer = await ctx.db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  if (!viewer) throw new Error("Unauthorized");
  if (!viewer.isAdmin) throw new Error("Forbidden");
};

export const get = query({
  args: { key: flagKeyValidator },
  returns: v.union(flagValidator, v.null()),
  handler: async (ctx, args) => {
    const key = String(args.key ?? "").trim();
    if (!key) return null;
    const row = await ctx.db
      .query("flags")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();
    return (row as any) ?? null;
  },
});

export const isEnabledForUser = query({
  args: { key: flagKeyValidator, userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const key = String(args.key ?? "").trim();
    const userId = String(args.userId ?? "").trim();
    if (!key || !userId) return false;

    const row = await ctx.db
      .query("flags")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();
    if (!row) return false;

    const enabled = Boolean((row as any).enabled);
    if (!enabled) return false;

    const deny = Array.isArray((row as any).denyUserIds) ? (row as any).denyUserIds : [];
    if (deny.includes(userId)) return false;

    const allow = Array.isArray((row as any).allowUserIds) ? (row as any).allowUserIds : [];
    if (allow.includes(userId)) return true;

    const rolloutPercent = clampPercent((row as any).rolloutPercent);
    return isUserInRollout(key, userId, rolloutPercent);
  },
});

export const upsert = mutation({
  args: {
    key: flagKeyValidator,
    enabled: v.boolean(),
    rolloutPercent: v.optional(v.number()),
    allowUserIds: v.optional(v.array(v.string())),
    denyUserIds: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const key = String(args.key ?? "").trim();
    if (!key) throw new Error("Missing key");

    const now = Date.now();
    const existing = await ctx.db
      .query("flags")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();

    const payload = {
      key,
      enabled: Boolean(args.enabled),
      rolloutPercent: args.rolloutPercent,
      allowUserIds: args.allowUserIds,
      denyUserIds: args.denyUserIds,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, payload as any);
      return null;
    }
    await ctx.db.insert("flags", payload as any);
    return null;
  },
});

