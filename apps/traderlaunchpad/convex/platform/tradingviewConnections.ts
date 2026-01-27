import { v } from "convex/values";

import {
  mutation,
  query,
} from "../_generated/server";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/
// Avoid typed `components` import (can cause TS deep instantiation errors).
const componentsUntyped: any = require("../_generated/api").components;

const traderlaunchpadPlatform = componentsUntyped.launchthat_traderlaunchpad.connections.platform;

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

const tradingViewAccountStatusValidator = v.union(
  v.literal("active"),
  v.literal("disabled"),
);

const toStatus = (raw: unknown): "active" | "disabled" =>
  raw === "disabled" ? "disabled" : "active";

const tradingViewAccountPublicView = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  label: v.string(),
  username: v.optional(v.string()),
  status: tradingViewAccountStatusValidator,
  isDefault: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastUsedAt: v.optional(v.number()),
});

export const listAccounts = query({
  args: {},
  returns: v.array(tradingViewAccountPublicView),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);

    const rows: any[] = await ctx.runQuery(traderlaunchpadPlatform.listConnections, {
      provider: "tradingview",
      limit: 100,
    });

    return (Array.isArray(rows) ? rows : []).map((r: any) => ({
      _id: String(r._id),
      _creationTime: Number(r._creationTime ?? 0),
      label: String(r.label ?? ""),
      username: typeof r.username === "string" ? r.username : undefined,
      status: toStatus(r.status),
      isDefault: Boolean(r.isDefault),
      createdAt: Number(r.createdAt ?? 0),
      updatedAt: Number(r.updatedAt ?? 0),
      lastUsedAt: typeof r.lastUsedAt === "number" ? r.lastUsedAt : undefined,
    }));
  },
});

export const getAccount = query({
  args: { accountId: v.string() },
  returns: v.union(tradingViewAccountPublicView, v.null()),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const row: any = await ctx.runQuery(traderlaunchpadPlatform.getConnection, {
      connectionId: args.accountId as any,
    });
    if (!row) return null;
    return {
      _id: String(row._id),
      _creationTime: Number(row._creationTime ?? 0),
      label: String(row.label ?? ""),
      username: typeof row.username === "string" ? row.username : undefined,
      status: toStatus(row.status),
      isDefault: Boolean(row.isDefault),
      createdAt: Number(row.createdAt ?? 0),
      updatedAt: Number(row.updatedAt ?? 0),
      lastUsedAt: typeof row.lastUsedAt === "number" ? row.lastUsedAt : undefined,
    };
  },
});

export const setDefaultAccount = mutation({
  args: { accountId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(traderlaunchpadPlatform.setDefaultConnection, {
      connectionId: args.accountId as any,
    });
    return null;
  },
});

export const setAccountStatus = mutation({
  args: {
    accountId: v.string(),
    status: tradingViewAccountStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(traderlaunchpadPlatform.setConnectionStatus, {
      connectionId: args.accountId as any,
      status: args.status,
    });
    return null;
  },
});

export const deleteAccount = mutation({
  args: { accountId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(traderlaunchpadPlatform.deleteConnection, {
      connectionId: args.accountId as any,
    });
    return null;
  },
});
