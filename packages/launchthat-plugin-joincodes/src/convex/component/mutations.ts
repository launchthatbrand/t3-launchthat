import { hashJoinCode, randomJoinCode } from "./lib/hash";

import { mutation } from "./_generated/server";
import { v } from "convex/values";

const scopeValidator = v.union(v.literal("platform"), v.literal("organization"));

export const createJoinCode = mutation({
  args: {
    scope: scopeValidator,
    organizationId: v.optional(v.string()),
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
    createdByUserId: v.string(),
    code: v.optional(v.string()),
  },
  returns: v.object({
    code: v.string(),
    codeHash: v.string(),
    joinCodeId: v.id("joinCodes"),
  }),
  handler: async (ctx, args) => {
    if (args.scope === "organization" && !args.organizationId) {
      throw new Error("organizationId is required for organization scope");
    }

    const rawCode =
      typeof args.code === "string" && args.code.trim()
        ? args.code.trim()
        : randomJoinCode();
    const codeHash = await hashJoinCode(rawCode);

    const existing = await ctx.db
      .query("joinCodes")
      .withIndex("by_code_hash", (q) => q.eq("codeHash", codeHash))
      .first();
    if (existing) {
      throw new Error("Join code already exists");
    }

    const now = Date.now();
    const joinCodeId = await ctx.db.insert("joinCodes", {
      scope: args.scope,
      organizationId: args.organizationId,
      code: rawCode,
      codeHash,
      label: typeof args.label === "string" && args.label.trim() ? args.label.trim() : undefined,
      role: args.role,
      tier: args.tier,
      permissions: args.permissions,
      maxUses: typeof args.maxUses === "number" ? args.maxUses : undefined,
      uses: 0,
      expiresAt: typeof args.expiresAt === "number" ? args.expiresAt : undefined,
      isActive: true,
      createdByUserId: args.createdByUserId,
      createdAt: now,
      updatedAt: now,
    });

    return { code: rawCode, codeHash, joinCodeId };
  },
});

export const deactivateJoinCode = mutation({
  args: { joinCodeId: v.id("joinCodes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.joinCodeId);
    if (!row) return null;
    await ctx.db.patch(args.joinCodeId, {
      isActive: false,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deleteJoinCode = mutation({
  args: { joinCodeId: v.id("joinCodes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.joinCodeId);
    return null;
  },
});

export const redeemJoinCode = mutation({
  args: {
    code: v.string(),
    redeemedByUserId: v.string(),
  },
  returns: v.union(
    v.object({
      joinCodeId: v.id("joinCodes"),
      scope: scopeValidator,
      organizationId: v.optional(v.string()),
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
      uses: v.number(),
      maxUses: v.optional(v.number()),
      expiresAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const codeHash = await hashJoinCode(args.code.trim());
    const row = await ctx.db
      .query("joinCodes")
      .withIndex("by_code_hash", (q) => q.eq("codeHash", codeHash))
      .first();
    if (!row) return null;
    if (!row.isActive) return null;
    if (typeof row.expiresAt === "number" && Date.now() >= row.expiresAt) return null;
    if (typeof row.maxUses === "number" && row.uses >= row.maxUses) return null;

    const nextUses = row.uses + 1;
    await ctx.db.patch(row._id, { uses: nextUses, updatedAt: Date.now() });
    await ctx.db.insert("joinCodeRedemptions", {
      codeId: row._id,
      redeemedByUserId: args.redeemedByUserId,
      redeemedAt: Date.now(),
    });

    return {
      joinCodeId: row._id,
      scope: row.scope,
      organizationId: row.organizationId,
      label: row.label,
      role: row.role,
      tier: row.tier,
      permissions: row.permissions,
      uses: nextUses,
      maxUses: row.maxUses,
      expiresAt: row.expiresAt,
    };
  },
});
