/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unsafe-argument
*/

import { v } from "convex/values";

import { query, mutation } from "../_generated/server";
import { components } from "../_generated/api";

const requirePlatformAdmin = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  let viewer =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first()) ?? null;

  if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
    viewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  if (!viewer) throw new Error("Unauthorized");
  if (!viewer.isAdmin) throw new Error("Forbidden");
  return viewer;
};

const roleValidator = v.union(
  v.literal("user"),
  v.literal("staff"),
  v.literal("admin"),
);
const tierValidator = v.union(
  v.literal("free"),
  v.literal("standard"),
  v.literal("pro"),
);
const permissionsValidator = v.object({
  globalEnabled: v.boolean(),
  tradeIdeasEnabled: v.boolean(),
  openPositionsEnabled: v.boolean(),
  ordersEnabled: v.boolean(),
});

const permissionsModule = components.launchthat_traderlaunchpad.permissions as any;

export const getUserRole = query({
  args: { userId: v.string() },
  returns: v.union(roleValidator, v.null()),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const user = await ctx.db.get(args.userId as any);
    if (!user) return null;
    const role = typeof (user as any).role === "string" ? (user as any).role : null;
    return (role as any) ?? null;
  },
});

export const setUserRole = mutation({
  args: { userId: v.string(), role: roleValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.db.patch(args.userId as any, {
      role: args.role,
      isAdmin: args.role === "admin",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getUserEntitlement = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      userId: v.string(),
      tier: tierValidator,
      limits: v.optional(v.any()),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const row = await ctx.db
      .query("userEntitlements")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();
    if (!row) return null;
    return {
      userId: String((row as any).userId),
      tier: (row as any).tier,
      limits: (row as any).limits,
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});

export const setUserEntitlement = mutation({
  args: {
    userId: v.string(),
    tier: tierValidator,
    limits: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const existing = await ctx.db
      .query("userEntitlements")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();
    const payload = {
      userId: args.userId,
      tier: args.tier,
      limits: args.limits,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return null;
    }
    await ctx.db.insert("userEntitlements", payload);
    return null;
  },
});

export const getUserGlobalPermissions = query({
  args: { userId: v.string() },
  returns: permissionsValidator,
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const row = await ctx.runQuery(permissionsModule.getPermissions, {
      userId: args.userId,
      scopeType: "global",
    });
    return {
      globalEnabled: Boolean((row as any)?.globalEnabled),
      tradeIdeasEnabled: Boolean((row as any)?.tradeIdeasEnabled),
      openPositionsEnabled: Boolean((row as any)?.openPositionsEnabled),
      ordersEnabled: Boolean((row as any)?.ordersEnabled),
    };
  },
});

export const setUserGlobalPermissions = mutation({
  args: {
    userId: v.string(),
    permissions: permissionsValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(permissionsModule.upsertPermissions, {
      userId: args.userId,
      scopeType: "global",
      scopeId: undefined,
      globalEnabled: args.permissions.globalEnabled,
      tradeIdeasEnabled: args.permissions.tradeIdeasEnabled,
      openPositionsEnabled: args.permissions.openPositionsEnabled,
      ordersEnabled: args.permissions.ordersEnabled,
    });
    return null;
  },
});
