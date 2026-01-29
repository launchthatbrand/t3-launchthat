import { v } from "convex/values";

import { action, internalMutation, mutation, query } from "../_generated/server";
import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const internalUntyped: any = require("../_generated/api").internal;

const widgetTypeValidator = v.union(
  v.literal("profileCard"),
  v.literal("equityCurve"),
  v.literal("journalMetrics"),
  v.literal("myTrades"),
  v.literal("openPositions"),
);

const randomHex = (bytes: number): string => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const installationView = v.object({
  _id: v.id("widgetInstallations"),
  widgetType: widgetTypeValidator,
  enabled: v.boolean(),
  displayName: v.optional(v.string()),
  config: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastUsedAt: v.optional(v.number()),
});

export const listMyWidgetInstallations = query({
  args: {},
  returns: v.array(installationView),
  handler: async (ctx) => {
    const userId = await resolveViewerUserId(ctx);
    const rows = await ctx.db
      .query("widgetInstallations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return rows.map((r) => ({
      _id: r._id,
      widgetType: (r as any).widgetType,
      enabled: Boolean((r as any).enabled),
      displayName: typeof (r as any).displayName === "string" ? (r as any).displayName : undefined,
      config: (r as any).config ?? undefined,
      createdAt: Number((r as any).createdAt ?? 0),
      updatedAt: Number((r as any).updatedAt ?? 0),
      lastUsedAt: typeof (r as any).lastUsedAt === "number" ? Number((r as any).lastUsedAt) : undefined,
    }));
  },
});

export const setMyWidgetInstallationEnabled = mutation({
  args: { installationId: v.id("widgetInstallations"), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const row = await ctx.db.get(args.installationId);
    if (!row) throw new Error("Widget installation not found");
    if (String((row as any).userId) !== userId) throw new Error("Forbidden");
    await ctx.db.patch(args.installationId, { enabled: Boolean(args.enabled), updatedAt: Date.now() } as any);
    return null;
  },
});

export const deleteMyWidgetInstallation = mutation({
  args: { installationId: v.id("widgetInstallations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const row = await ctx.db.get(args.installationId);
    if (!row) return null;
    if (String((row as any).userId) !== userId) throw new Error("Forbidden");
    await ctx.db.delete(args.installationId);
    return null;
  },
});

export const createMyWidgetInstallation = action({
  args: {
    widgetType: widgetTypeValidator,
    displayName: v.optional(v.string()),
    config: v.optional(v.any()),
  },
  returns: v.object({
    installationId: v.id("widgetInstallations"),
    apiKey: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const now = Date.now();
    const apiKey = `wkey_${randomHex(24)}`;

    const installationId = await ctx.runMutation(internalUntyped.widgets.installations.insertInstallationInternal, {
      userId,
      widgetType: args.widgetType,
      enabled: true,
      apiKey,
      displayName: args.displayName,
      config: args.config,
      createdAt: now,
      updatedAt: now,
    });

    return { installationId, apiKey };
  },
});

export const rotateMyWidgetInstallationKey = action({
  args: { installationId: v.id("widgetInstallations") },
  returns: v.object({ apiKey: v.string() }),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const apiKey = `wkey_${randomHex(24)}`;

    await ctx.runMutation(internalUntyped.widgets.installations.rotateInstallationKeyInternal, {
      installationId: args.installationId,
      userId,
      apiKey,
    });

    return { apiKey };
  },
});

export const insertInstallationInternal = internalMutation({
  args: {
    userId: v.string(),
    widgetType: widgetTypeValidator,
    enabled: v.boolean(),
    apiKey: v.string(),
    displayName: v.optional(v.string()),
    config: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  returns: v.id("widgetInstallations"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("widgetInstallations", args as any);
  },
});

export const rotateInstallationKeyInternal = internalMutation({
  args: { installationId: v.id("widgetInstallations"), userId: v.string(), apiKey: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.installationId);
    if (!row) throw new Error("Widget installation not found");
    if (String((row as any).userId) !== args.userId) throw new Error("Forbidden");
    await ctx.db.patch(args.installationId, { apiKey: args.apiKey, updatedAt: Date.now() } as any);
    return null;
  },
});

