/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const joinCodesQueries = components.launchthat_joincodes.queries as any;
const joinCodesMutations = components.launchthat_joincodes.mutations as any;

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

export const listPlatformJoinCodes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.string(),
      scope: v.union(v.literal("platform"), v.literal("organization")),
      organizationId: v.optional(v.string()),
      label: v.optional(v.string()),
      code: v.optional(v.string()),
      role: v.optional(v.union(v.literal("user"), v.literal("staff"), v.literal("admin"))),
      tier: v.optional(v.union(v.literal("free"), v.literal("standard"), v.literal("pro"))),
      permissions: v.optional(
        v.object({
          globalEnabled: v.optional(v.boolean()),
          tradeIdeasEnabled: v.optional(v.boolean()),
          openPositionsEnabled: v.optional(v.boolean()),
          ordersEnabled: v.optional(v.boolean()),
        }),
      ),
      maxUses: v.optional(v.number()),
      uses: v.number(),
      expiresAt: v.optional(v.number()),
      isActive: v.boolean(),
      createdByUserId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const rows = await ctx.runQuery(joinCodesQueries.listJoinCodes, {
      scope: "platform",
    });
    return (Array.isArray(rows) ? rows : []).map((row: any) => ({
      _id: String(row?._id ?? ""),
      scope: row?.scope === "organization" ? ("organization" as const) : ("platform" as const),
      organizationId:
        typeof row?.organizationId === "string" ? row.organizationId : undefined,
      label: typeof row?.label === "string" ? row.label : undefined,
      code: typeof row?.code === "string" ? row.code : undefined,
      role:
        row?.role === "admin" || row?.role === "staff" || row?.role === "user"
          ? row.role
          : undefined,
      tier:
        row?.tier === "pro" || row?.tier === "standard" || row?.tier === "free"
          ? row.tier
          : undefined,
      permissions: row?.permissions
        ? {
            globalEnabled:
              typeof row.permissions.globalEnabled === "boolean"
                ? row.permissions.globalEnabled
                : undefined,
            tradeIdeasEnabled:
              typeof row.permissions.tradeIdeasEnabled === "boolean"
                ? row.permissions.tradeIdeasEnabled
                : undefined,
            openPositionsEnabled:
              typeof row.permissions.openPositionsEnabled === "boolean"
                ? row.permissions.openPositionsEnabled
                : undefined,
            ordersEnabled:
              typeof row.permissions.ordersEnabled === "boolean"
                ? row.permissions.ordersEnabled
                : undefined,
          }
        : undefined,
      maxUses: typeof row?.maxUses === "number" ? row.maxUses : undefined,
      uses: typeof row?.uses === "number" ? row.uses : 0,
      expiresAt: typeof row?.expiresAt === "number" ? row.expiresAt : undefined,
      isActive: Boolean(row?.isActive),
      createdByUserId: String(row?.createdByUserId ?? ""),
      createdAt: typeof row?.createdAt === "number" ? row.createdAt : 0,
      updatedAt: typeof row?.updatedAt === "number" ? row.updatedAt : 0,
    }));
  },
});

export const createPlatformJoinCode = mutation({
  args: {
    label: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("staff"), v.literal("admin"))),
    tier: v.optional(v.union(v.literal("free"), v.literal("standard"), v.literal("pro"))),
    permissions: v.optional(
      v.object({
        globalEnabled: v.optional(v.boolean()),
        tradeIdeasEnabled: v.optional(v.boolean()),
        openPositionsEnabled: v.optional(v.boolean()),
        ordersEnabled: v.optional(v.boolean()),
      }),
    ),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({
    code: v.string(),
    codeHash: v.string(),
    joinCodeId: v.string(),
  }),
  handler: async (ctx, args) => {
    const viewer = await requirePlatformAdmin(ctx);
    return await ctx.runMutation(joinCodesMutations.createJoinCode, {
      scope: "platform",
      label: args.label,
      role: args.role,
      tier: args.tier,
      permissions: args.permissions,
      maxUses: args.maxUses,
      expiresAt: args.expiresAt,
      createdByUserId: String(viewer._id),
    });
  },
});

export const deactivatePlatformJoinCode = mutation({
  args: { joinCodeId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(joinCodesMutations.deactivateJoinCode, {
      joinCodeId: args.joinCodeId,
    });
    return null;
  },
});

export const deletePlatformJoinCode = mutation({
  args: { joinCodeId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(joinCodesMutations.deleteJoinCode, {
      joinCodeId: args.joinCodeId,
    });
    return null;
  },
});
