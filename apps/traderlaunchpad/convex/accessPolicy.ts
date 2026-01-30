import { v } from "convex/values";

import { query, mutation } from "./_generated/server";
import { resolveViewerUserId } from "./traderlaunchpad/lib/resolve";

type Tier = "free" | "standard" | "pro";

export type EntitlementFeature =
  | "journal"
  | "strategies"
  | "analytics"
  | "orders";

const tierValidator = v.union(
  v.literal("free"),
  v.literal("standard"),
  v.literal("pro"),
);

const featureFlagsValidator = v.object({
  journal: v.boolean(),
  strategies: v.boolean(),
  analytics: v.boolean(),
  orders: v.boolean(),
});

const visibilitySettingsValidator = v.object({
  publicProfileEnabled: v.boolean(),
  tradeIdeasIndexEnabled: v.boolean(),
  tradeIdeaDetailEnabled: v.boolean(),
  ordersIndexEnabled: v.boolean(),
  orderDetailEnabled: v.boolean(),
  analyticsReportsIndexEnabled: v.boolean(),
  analyticsReportDetailEnabled: v.boolean(),
});

const defaultEntitlementFeatures = (): Record<EntitlementFeature, boolean> => ({
  // MVP alpha: default locked. Access is granted via join codes or per-user entitlement settings.
  journal: false,
  strategies: false,
  analytics: false,
  orders: false,
});

const defaultVisibilitySettings = () => ({
  publicProfileEnabled: false,
  tradeIdeasIndexEnabled: false,
  tradeIdeaDetailEnabled: false,
  ordersIndexEnabled: false,
  orderDetailEnabled: false,
  analyticsReportsIndexEnabled: false,
  analyticsReportDetailEnabled: false,
});

const normalizeTier = (raw: unknown): Tier => {
  return raw === "free" || raw === "standard" || raw === "pro" ? raw : "free";
};

const normalizeEntitlementFeaturesFromLimits = (
  limits: unknown,
): Record<EntitlementFeature, boolean> => {
  const base = defaultEntitlementFeatures();
  if (!limits || typeof limits !== "object") return base;
  const featuresRaw = (limits as Record<string, unknown>).features;
  if (!featuresRaw || typeof featuresRaw !== "object") return base;
  const f = featuresRaw as Record<string, unknown>;
  return {
    // Explicit allowlist semantics: only `true` grants access.
    // Back-compat: older records may use `tradeIdeas` instead of `strategies`.
    journal: f.journal === true,
    strategies: f.strategies === true || f.tradeIdeas === true,
    analytics: f.analytics === true,
    orders: f.orders === true,
  };
};

/**
 * Logged-in feature access (entitlements) snapshot for the current viewer.
 * Used by UI gates and server-side enforcement helpers.
 */
export const getMyEntitlements = query({
  args: {},
  returns: v.object({
    isSignedIn: v.boolean(),
    userId: v.union(v.string(), v.null()),
    tier: tierValidator,
    // Stored raw so platform can extend without schema churn.
    limits: v.union(v.any(), v.null()),
    features: featureFlagsValidator,
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        isSignedIn: false,
        userId: null,
        tier: "free" as const,
        limits: null,
        features: defaultEntitlementFeatures(),
        updatedAt: 0,
      };
    }

    const userId = await resolveViewerUserId(ctx);
    const row = await ctx.db
      .query("userEntitlements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tier = normalizeTier((row as any)?.tier);
    const limits = (row as any)?.limits ?? null;
    const features = normalizeEntitlementFeaturesFromLimits(limits);
    const updatedAt = typeof (row as any)?.updatedAt === "number" ? Number((row as any).updatedAt) : 0;

    return { isSignedIn: true, userId, tier, limits, features, updatedAt };
  },
});

/**
 * User-controlled public visibility preferences for `/u/:username/*` pages.
 */
export const getMyVisibilitySettings = query({
  args: {},
  returns: visibilitySettingsValidator,
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return defaultVisibilitySettings();

    const userId = await resolveViewerUserId(ctx);
    const row = await ctx.db
      .query("userVisibilitySettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const d = defaultVisibilitySettings();
    if (!row) return d;

    return {
      publicProfileEnabled:
        typeof (row as any).publicProfileEnabled === "boolean"
          ? Boolean((row as any).publicProfileEnabled)
          : d.publicProfileEnabled,
      tradeIdeasIndexEnabled:
        typeof (row as any).tradeIdeasIndexEnabled === "boolean"
          ? Boolean((row as any).tradeIdeasIndexEnabled)
          : d.tradeIdeasIndexEnabled,
      tradeIdeaDetailEnabled:
        typeof (row as any).tradeIdeaDetailEnabled === "boolean"
          ? Boolean((row as any).tradeIdeaDetailEnabled)
          : d.tradeIdeaDetailEnabled,
      ordersIndexEnabled:
        typeof (row as any).ordersIndexEnabled === "boolean"
          ? Boolean((row as any).ordersIndexEnabled)
          : d.ordersIndexEnabled,
      orderDetailEnabled:
        typeof (row as any).orderDetailEnabled === "boolean"
          ? Boolean((row as any).orderDetailEnabled)
          : d.orderDetailEnabled,
      analyticsReportsIndexEnabled:
        typeof (row as any).analyticsReportsIndexEnabled === "boolean"
          ? Boolean((row as any).analyticsReportsIndexEnabled)
          : d.analyticsReportsIndexEnabled,
      analyticsReportDetailEnabled:
        typeof (row as any).analyticsReportDetailEnabled === "boolean"
          ? Boolean((row as any).analyticsReportDetailEnabled)
          : d.analyticsReportDetailEnabled,
    };
  },
});

export const upsertMyVisibilitySettings = mutation({
  args: visibilitySettingsValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("userVisibilitySettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const payload = {
      userId,
      ...args,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, payload as any);
      return null;
    }
    await ctx.db.insert("userVisibilitySettings", payload as any);
    return null;
  },
});

