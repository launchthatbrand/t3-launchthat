import { mutation } from "../server";
import { v } from "convex/values";

import { analyticsReportSpecValidator } from "./types";

const randomShareToken = (): string => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // base64url
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const createMyAnalyticsReport = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    name: v.string(),
    accountId: v.optional(v.string()),
    visibility: v.union(v.literal("private"), v.literal("link")),
    spec: analyticsReportSpecValidator,
  },
  returns: v.object({ reportId: v.id("analyticsReports") }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const name = String(args.name ?? "").trim();
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";
    const visibility = args.visibility === "link" ? "link" : "private";
    const shareToken = visibility === "link" ? randomShareToken() : undefined;

    const reportId = await ctx.db.insert("analyticsReports", {
      organizationId: args.organizationId,
      userId: args.userId,
      name: name || "Untitled report",
      accountId: accountId || undefined,
      visibility,
      shareToken,
      shareEnabledAt: visibility === "link" ? now : undefined,
      spec: args.spec,
      createdAt: now,
      updatedAt: now,
    });

    return { reportId };
  },
});

export const updateMyAnalyticsReport = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    reportId: v.id("analyticsReports"),
    name: v.optional(v.string()),
    accountId: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("private"), v.literal("link"))),
    spec: v.optional(analyticsReportSpecValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.reportId);
    if (!row) return null;
    if (row.organizationId !== args.organizationId || row.userId !== args.userId) return null;

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };

    if (typeof args.name === "string") {
      const name = args.name.trim();
      if (name) patch.name = name;
    }
    if (typeof args.accountId === "string") {
      const accountId = args.accountId.trim();
      patch.accountId = accountId || undefined;
    }
    if (args.spec) patch.spec = args.spec;

    if (args.visibility) {
      const next = args.visibility === "link" ? "link" : "private";
      patch.visibility = next;
      if (next === "link") {
        patch.shareToken = typeof (row as any).shareToken === "string" ? (row as any).shareToken : randomShareToken();
        patch.shareEnabledAt =
          typeof (row as any).shareEnabledAt === "number" ? (row as any).shareEnabledAt : now;
      } else {
        patch.shareToken = undefined;
        patch.shareEnabledAt = undefined;
      }
    }

    await ctx.db.patch(args.reportId, patch);
    return null;
  },
});

export const enableShareLink = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    reportId: v.id("analyticsReports"),
  },
  returns: v.object({ shareToken: v.string() }),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.reportId);
    if (!row) return { shareToken: "" };
    if (row.organizationId !== args.organizationId || row.userId !== args.userId) return { shareToken: "" };

    const now = Date.now();
    const shareToken = typeof (row as any).shareToken === "string" ? (row as any).shareToken : randomShareToken();
    await ctx.db.patch(args.reportId, {
      visibility: "link",
      shareToken,
      shareEnabledAt: typeof (row as any).shareEnabledAt === "number" ? (row as any).shareEnabledAt : now,
      updatedAt: now,
    });

    return { shareToken };
  },
});

export const disableShareLink = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    reportId: v.id("analyticsReports"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.reportId);
    if (!row) return null;
    if (row.organizationId !== args.organizationId || row.userId !== args.userId) return null;

    const now = Date.now();
    await ctx.db.patch(args.reportId, {
      visibility: "private",
      shareToken: undefined,
      shareEnabledAt: undefined,
      updatedAt: now,
    });
    return null;
  },
});

export const deleteMyAnalyticsReport = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    reportId: v.id("analyticsReports"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.reportId);
    if (!row) return null;
    if (row.organizationId !== args.organizationId || row.userId !== args.userId) return null;
    await ctx.db.delete(args.reportId);
    return null;
  },
});

