/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const platformConnections = components.launchthat_traderlaunchpad.connections.platform as any;

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

const computeTradeLockerSourceKey = (args: {
  environment: "demo" | "live";
  jwtHost?: string;
  server?: string;
}): string => {
  const envName = args.environment === "live" ? "live" : "demo";
  const baseUrlHost =
    typeof args.jwtHost === "string" && args.jwtHost.trim()
      ? args.jwtHost.trim()
      : `${envName}.tradelocker.com`;
  const server =
    typeof args.server === "string" && args.server.trim() ? args.server.trim() : "unknown";
  return `tradelocker:${envName}:${baseUrlHost}:${server}`.toLowerCase().trim();
};

export const listAccountsBySourceKey = query({
  args: {
    sourceKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      provider: v.string(),
      sourceKey: v.string(),
      connectionId: v.string(),
      connectionLabel: v.string(),
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      jwtHost: v.optional(v.string()),
      accounts: v.array(
        v.object({
          accountRowId: v.string(),
          accountId: v.string(),
          accNum: v.number(),
          name: v.optional(v.string()),
          currency: v.optional(v.string()),
          status: v.optional(v.string()),
          lastConfigOk: v.optional(v.boolean()),
          lastConfigError: v.optional(v.string()),
          enabledForPriceData: v.boolean(),
          policyId: v.optional(v.id("platformPriceDataAccountPolicies")),
          weight: v.optional(v.number()),
          notes: v.optional(v.string()),
          lastUsedAt: v.optional(v.number()),
          lastError: v.optional(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const sourceKeyFilter = typeof args.sourceKey === "string" ? args.sourceKey.trim().toLowerCase() : "";

    const policyRows: any[] = await ctx.db.query("platformPriceDataAccountPolicies").take(10_000);
    const policyByAccountRowId = new Map<string, any>();
    for (const p of Array.isArray(policyRows) ? policyRows : []) {
      if (typeof p?.accountRowId === "string") policyByAccountRowId.set(p.accountRowId, p);
    }

    const connections: any[] = await ctx.runQuery(platformConnections.listConnections, {
      provider: "tradelocker",
      limit: 200,
    });

    const out: any[] = [];
    for (const c of Array.isArray(connections) ? connections : []) {
      const secretsRes: any = await ctx.runQuery(platformConnections.getConnectionSecrets, {
        connectionId: c._id,
      });
      const secrets = secretsRes?.secrets ?? null;
      if (!secrets) continue;

      const environment = secrets.environment === "live" ? ("live" as const) : ("demo" as const);
      const server = String(secrets.server ?? "");
      const jwtHost = typeof secrets.jwtHost === "string" ? secrets.jwtHost : undefined;
      const sourceKey = computeTradeLockerSourceKey({ environment, jwtHost, server });
      if (sourceKeyFilter && sourceKey !== sourceKeyFilter) continue;

      const accounts: any[] = await ctx.runQuery(platformConnections.listConnectionAccounts, {
        connectionId: c._id,
      });
      const mappedAccounts = (Array.isArray(accounts) ? accounts : [])
        .map((a: any) => {
          const accountRowId = String(a?._id ?? "");
          const p = accountRowId ? policyByAccountRowId.get(accountRowId) : undefined;
          return {
            accountRowId,
            accountId: String(a?.accountId ?? ""),
            accNum: Number(a?.accNum ?? NaN),
            name: typeof a?.name === "string" ? a.name : undefined,
            currency: typeof a?.currency === "string" ? a.currency : undefined,
            status: typeof a?.status === "string" ? a.status : undefined,
            lastConfigOk: typeof a?.lastConfigOk === "boolean" ? a.lastConfigOk : undefined,
            lastConfigError: typeof a?.lastConfigError === "string" ? a.lastConfigError : undefined,
            enabledForPriceData: typeof p?.enabledForPriceData === "boolean" ? Boolean(p.enabledForPriceData) : false,
            policyId: p?._id,
            weight: typeof p?.weight === "number" ? p.weight : undefined,
            notes: typeof p?.notes === "string" ? p.notes : undefined,
            lastUsedAt: typeof p?.lastUsedAt === "number" ? p.lastUsedAt : undefined,
            lastError: typeof p?.lastError === "string" ? p.lastError : undefined,
          };
        })
        .filter((a: any) => a.accountRowId && a.accountId && Number.isFinite(a.accNum));

      out.push({
        provider: "tradelocker",
        sourceKey,
        connectionId: String(c?._id ?? ""),
        connectionLabel: String(c?.label ?? ""),
        environment,
        server,
        jwtHost,
        accounts: mappedAccounts,
      });
    }

    return out;
  },
});

export const setAccountEnabledForPriceData = mutation({
  args: {
    accountRowId: v.string(),
    enabledForPriceData: v.boolean(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const accountRowId = args.accountRowId.trim();
    if (!accountRowId) throw new Error("Missing accountRowId");

    const account: any = await ctx.runQuery(platformConnections.getConnectionAccount, {
      accountRowId: (accountRowId as unknown) as any,
    });
    if (!account) throw new Error("Account not found");

    const connectionId = String(account.connectionId ?? "");
    if (!connectionId) throw new Error("Account missing connectionId");

    const secretsRes: any = await ctx.runQuery(platformConnections.getConnectionSecrets, {
      connectionId: (connectionId as unknown) as any,
    });
    const secrets = secretsRes?.secrets ?? null;
    if (!secrets) throw new Error("Missing connection secrets");

    const environment = secrets.environment === "live" ? ("live" as const) : ("demo" as const);
    const server = String(secrets.server ?? "");
    const jwtHost = typeof secrets.jwtHost === "string" ? secrets.jwtHost : undefined;
    const sourceKey = computeTradeLockerSourceKey({ environment, jwtHost, server });

    const now = Date.now();
    const existing = await ctx.db
      .query("platformPriceDataAccountPolicies")
      .withIndex("by_account_row", (q) => q.eq("accountRowId", accountRowId))
      .first();

    const payload = {
      provider: "tradelocker",
      sourceKey,
      connectionId,
      accountRowId,
      accountId: String(account.accountId ?? ""),
      accNum: Number(account.accNum ?? NaN),
      label: typeof account.name === "string" ? account.name : undefined,
      enabledForPriceData: Boolean(args.enabledForPriceData),
      updatedAt: now,
    };

    if (!payload.accountId || !Number.isFinite(payload.accNum)) {
      throw new Error("Invalid account fields");
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { ok: true };
    }

    await ctx.db.insert("platformPriceDataAccountPolicies", {
      ...payload,
      createdAt: now,
    });
    return { ok: true };
  },
});

