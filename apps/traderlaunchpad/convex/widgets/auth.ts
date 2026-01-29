import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";

const widgetTypeValidator = v.union(
  v.literal("profileCard"),
  v.literal("equityCurve"),
  v.literal("journalMetrics"),
  v.literal("myTrades"),
  v.literal("openPositions"),
);

const tierValidator = v.union(
  v.literal("free"),
  v.literal("standard"),
  v.literal("pro"),
);

export const requiredTierForWidgetType = (
  widgetType: unknown,
): "free" | "standard" | "pro" => {
  // Per requirements: free users get basic widgets; pro users get open positions + advanced.
  const w = String(widgetType ?? "");
  if (w === "openPositions") return "pro";
  if (w === "myTrades") return "pro";
  return "free";
};

const tierRank = (tier: string) => (tier === "pro" ? 3 : tier === "standard" ? 2 : 1);
const isTierAtLeast = (tier: string, required: string) => tierRank(tier) >= tierRank(required);

export const validateWidgetKey = internalQuery({
  args: { installationId: v.id("widgetInstallations"), apiKey: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      installationId: v.id("widgetInstallations"),
      userId: v.string(),
      widgetType: widgetTypeValidator,
      enabled: v.boolean(),
      config: v.optional(v.any()),
      requiredTier: tierValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.installationId);
    if (!row) return null;
    if (!Boolean((row as any).enabled)) return null;
    if (String((row as any).apiKey) !== args.apiKey) return null;

    const widgetType = (row as any).widgetType;
    const requiredTier = requiredTierForWidgetType(widgetType);

    return {
      installationId: args.installationId,
      userId: String((row as any).userId ?? ""),
      widgetType,
      enabled: true,
      config: (row as any).config ?? undefined,
      requiredTier,
    };
  },
});

export const assertTierForWidget = internalQuery({
  args: { userId: v.string(), requiredTier: tierValidator },
  returns: tierValidator,
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("userEntitlements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const tierRaw = row && typeof (row as any).tier === "string" ? String((row as any).tier) : "free";
    const tier: "free" | "standard" | "pro" =
      tierRaw === "pro" || tierRaw === "standard" || tierRaw === "free" ? (tierRaw as any) : "free";

    if (!isTierAtLeast(tier, args.requiredTier)) {
      throw new Error("Upgrade required");
    }

    return tier;
  },
});

export const touchInstallationLastUsedAt = internalMutation({
  args: { installationId: v.id("widgetInstallations"), at: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.installationId);
    if (!row) return null;
    await ctx.db.patch(args.installationId, { lastUsedAt: args.at } as any);
    return null;
  },
});

