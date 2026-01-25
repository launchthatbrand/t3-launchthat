import { v } from "convex/values";

import { mutation, query } from "./server";

type ScopeType = "global" | "org";

const defaults = () => ({
  globalEnabled: false,
  tradeIdeasEnabled: false,
  openPositionsEnabled: false,
  ordersEnabled: false,
});

const normalizeScope = (args: {
  scopeType: ScopeType;
  scopeId?: string | null;
}): { scopeType: ScopeType; scopeId: string | null } => {
  if (args.scopeType === "global") return { scopeType: "global", scopeId: null };
  const scopeId =
    typeof args.scopeId === "string" && args.scopeId.trim() ? args.scopeId.trim() : "";
  if (!scopeId) throw new Error("scopeId is required when scopeType='org'");
  return { scopeType: "org", scopeId };
};

export const getPermissions = query({
  args: {
    userId: v.string(),
    scopeType: v.union(v.literal("global"), v.literal("org")),
    scopeId: v.optional(v.string()),
  },
  returns: v.object({
    userId: v.string(),
    scopeType: v.union(v.literal("global"), v.literal("org")),
    scopeId: v.union(v.string(), v.null()),
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    openPositionsEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const { scopeType, scopeId } = normalizeScope({
      scopeType: args.scopeType,
      scopeId: args.scopeId,
    });

    const row = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q.eq("userId", args.userId).eq("scopeType", scopeType).eq("scopeId", scopeId),
      )
      .unique();

    const d = defaults();
    return {
      userId: args.userId,
      scopeType,
      scopeId,
      globalEnabled: typeof row?.globalEnabled === "boolean" ? row.globalEnabled : d.globalEnabled,
      tradeIdeasEnabled:
        typeof row?.tradeIdeasEnabled === "boolean" ? row.tradeIdeasEnabled : d.tradeIdeasEnabled,
      openPositionsEnabled:
        typeof row?.openPositionsEnabled === "boolean"
          ? row.openPositionsEnabled
          : d.openPositionsEnabled,
      ordersEnabled: typeof row?.ordersEnabled === "boolean" ? row.ordersEnabled : d.ordersEnabled,
      updatedAt: typeof row?.updatedAt === "number" ? row.updatedAt : 0,
    };
  },
});

export const upsertPermissions = mutation({
  args: {
    userId: v.string(),
    scopeType: v.union(v.literal("global"), v.literal("org")),
    scopeId: v.optional(v.string()),
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    openPositionsEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { scopeType, scopeId } = normalizeScope({
      scopeType: args.scopeType,
      scopeId: args.scopeId,
    });

    const now = Date.now();
    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q.eq("userId", args.userId).eq("scopeType", scopeType).eq("scopeId", scopeId),
      )
      .unique();

    const next = {
      globalEnabled: Boolean(args.globalEnabled),
      tradeIdeasEnabled: Boolean(args.tradeIdeasEnabled),
      openPositionsEnabled: Boolean(args.openPositionsEnabled),
      ordersEnabled: Boolean(args.ordersEnabled),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return null;
    }

    await ctx.db.insert("permissions", {
      userId: args.userId,
      scopeType,
      scopeId,
      ...next,
    });
    return null;
  },
});

export const listOrgPermissionsForUsers = query({
  args: {
    organizationId: v.string(),
    userIds: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      scopeType: v.literal("org"),
      scopeId: v.string(),
      globalEnabled: v.boolean(),
      tradeIdeasEnabled: v.boolean(),
      openPositionsEnabled: v.boolean(),
      ordersEnabled: v.boolean(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const scopeId = args.organizationId.trim();
    if (!scopeId) return [];

    const userIds = Array.from(
      new Set(args.userIds.map((u) => String(u ?? "").trim()).filter(Boolean)),
    ).slice(0, 1000);
    if (userIds.length === 0) return [];

    // NOTE: Convex has no "in" operator; do per-user index lookups.
    const out: Array<{
      userId: string;
      scopeType: "org";
      scopeId: string;
      globalEnabled: boolean;
      tradeIdeasEnabled: boolean;
      openPositionsEnabled: boolean;
      ordersEnabled: boolean;
      updatedAt: number;
    }> = [];

    const d = defaults();
    for (const userId of userIds) {
      const row = await ctx.db
        .query("permissions")
        .withIndex("by_user_scope", (q: any) =>
          q.eq("userId", userId).eq("scopeType", "org").eq("scopeId", scopeId),
        )
        .unique();

      out.push({
        userId,
        scopeType: "org",
        scopeId,
        globalEnabled: typeof row?.globalEnabled === "boolean" ? row.globalEnabled : d.globalEnabled,
        tradeIdeasEnabled:
          typeof row?.tradeIdeasEnabled === "boolean" ? row.tradeIdeasEnabled : d.tradeIdeasEnabled,
        openPositionsEnabled:
          typeof row?.openPositionsEnabled === "boolean"
            ? row.openPositionsEnabled
            : d.openPositionsEnabled,
        ordersEnabled: typeof row?.ordersEnabled === "boolean" ? row.ordersEnabled : d.ordersEnabled,
        updatedAt: typeof row?.updatedAt === "number" ? row.updatedAt : 0,
      });
    }

    return out;
  },
});

export const isEnabledForType = (
  p: Pick<
    ReturnType<typeof defaults>,
    "globalEnabled" | "tradeIdeasEnabled" | "openPositionsEnabled" | "ordersEnabled"
  >,
  type: "tradeIdeas" | "openPositions" | "orders",
): boolean => {
  if (p.globalEnabled) return true;
  if (type === "tradeIdeas") return p.tradeIdeasEnabled;
  if (type === "openPositions") return p.openPositionsEnabled;
  return p.ordersEnabled;
};

