/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unnecessary-type-assertion
*/

import { v } from "convex/values";
import { query } from "../_generated/server";
import { components } from "../_generated/api";

const platform = components.launchthat_traderlaunchpad.connections.platform as any;

const requirePlatformAdmin = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  let viewer: any =
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

const toUserStyleConnection = (row: any): any => {
  const secrets = row?.secrets && typeof row.secrets === "object" ? row.secrets : {};
  const status = row?.status === "active" ? "connected" : "disconnected";
  return {
    _id: row._id,
    _creationTime: row._creationTime,
    organizationId: "platform",
    userId: "platform",
    environment: secrets.environment === "live" ? "live" : "demo",
    server: String(secrets.server ?? ""),
    jwtHost: typeof secrets.jwtHost === "string" ? secrets.jwtHost : undefined,
    selectedAccountId: String(secrets.selectedAccountId ?? ""),
    selectedAccNum: typeof secrets.selectedAccNum === "number" ? secrets.selectedAccNum : 0,
    status,
    lastError: undefined,
    lastSyncAt: 0,
    lastBrokerActivityAt: undefined,
    hasOpenTrade: undefined,
    syncLeaseUntil: undefined,
    syncLeaseOwner: undefined,
    createdAt: typeof row.createdAt === "number" ? row.createdAt : 0,
    updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : 0,
  };
};

export const getPlatformTradeLockerConnection = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      connection: v.any(),
      accounts: v.array(v.any()),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);

    const connections: any[] = await ctx.runQuery(platform.listConnections, {
      provider: "tradelocker",
      limit: 50,
    });

    const list = Array.isArray(connections) ? connections : [];
    const defaultConn = list.find((c) => Boolean(c?.isDefault)) ?? list[0] ?? null;
    if (!defaultConn) return null;

    const accounts: any[] = await ctx.runQuery(platform.listConnectionAccounts, {
      connectionId: (defaultConn._id as unknown) as any,
    });

    return {
      connection: toUserStyleConnection(defaultConn),
      accounts: Array.isArray(accounts) ? accounts : [],
    };
  },
});

export const getPlatformConnectionAccountById = query({
  args: { accountRowId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      provider: v.string(),
      connection: v.any(),
      account: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const connections: any[] = await ctx.runQuery(platform.listConnections, {
      provider: "tradelocker",
      limit: 50,
    });
    const list = Array.isArray(connections) ? connections : [];
    const defaultConn = list.find((c) => Boolean(c?.isDefault)) ?? list[0] ?? null;
    if (!defaultConn) return null;

    const account: any = await ctx.runQuery(platform.getConnectionAccount, {
      accountRowId: (args.accountRowId as unknown) as any,
    });
    if (!account) return null;

    return {
      provider: "tradelocker",
      connection: toUserStyleConnection(defaultConn),
      account,
    };
  },
});

