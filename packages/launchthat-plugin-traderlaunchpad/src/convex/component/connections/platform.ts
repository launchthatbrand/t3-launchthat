import { v } from "convex/values";

import { mutation, query } from "../server";

const platformStatusValidator = v.union(v.literal("active"), v.literal("disabled"));

const toStatus = (raw: unknown): "active" | "disabled" =>
  raw === "disabled" ? "disabled" : "active";

const platformPublicView = v.object({
  _id: v.id("platformBrokerConnections"),
  _creationTime: v.number(),
  provider: v.string(),
  label: v.string(),
  username: v.optional(v.string()),
  status: platformStatusValidator,
  isDefault: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastUsedAt: v.optional(v.number()),
});

const platformAccountView = v.object({
  _id: v.id("platformBrokerConnectionAccounts"),
  _creationTime: v.number(),
  connectionId: v.id("platformBrokerConnections"),
  accountId: v.string(),
  accNum: v.number(),
  name: v.optional(v.string()),
  currency: v.optional(v.string()),
  status: v.optional(v.string()),
  customerAccess: v.optional(
    v.object({
      orders: v.boolean(),
      ordersHistory: v.boolean(),
      filledOrders: v.boolean(),
      positions: v.boolean(),
      symbolInfo: v.boolean(),
      marketDepth: v.boolean(),
    }),
  ),
  lastConfigOk: v.optional(v.boolean()),
  lastConfigCheckedAt: v.optional(v.number()),
  lastConfigError: v.optional(v.string()),
  lastConfigRaw: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listConnections = query({
  args: {
    provider: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(platformPublicView),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, args.limit ?? 100));
    const provider =
      typeof args.provider === "string" && args.provider.trim()
        ? args.provider.trim()
        : "tradelocker";

    const rows = await ctx.db
      .query("platformBrokerConnections")
      .withIndex("by_provider_and_updatedAt", (q: any) => q.eq("provider", provider))
      .order("desc")
      .take(limit);

    return (Array.isArray(rows) ? rows : []).map((r: any) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      provider: String(r.provider ?? ""),
      label: String(r.label ?? ""),
      username: typeof r.username === "string" ? r.username : undefined,
      status: toStatus(r.status),
      isDefault: Boolean(r.isDefault),
      createdAt: Number(r.createdAt ?? r._creationTime ?? 0),
      updatedAt: Number(r.updatedAt ?? r._creationTime ?? 0),
      lastUsedAt: typeof r.lastUsedAt === "number" ? r.lastUsedAt : undefined,
    }));
  },
});

export const getConnection = query({
  args: { connectionId: v.id("platformBrokerConnections") },
  returns: v.union(platformPublicView, v.null()),
  handler: async (ctx, args) => {
    const row: any = await ctx.db.get(args.connectionId);
    if (!row) return null;
    return {
      _id: row._id,
      _creationTime: row._creationTime,
      provider: String(row.provider ?? ""),
      label: String(row.label ?? ""),
      username: typeof row.username === "string" ? row.username : undefined,
      status: toStatus(row.status),
      isDefault: Boolean(row.isDefault),
      createdAt: Number(row.createdAt ?? row._creationTime ?? 0),
      updatedAt: Number(row.updatedAt ?? row._creationTime ?? 0),
      lastUsedAt: typeof row.lastUsedAt === "number" ? row.lastUsedAt : undefined,
    };
  },
});

export const getConnectionSecrets = query({
  args: { connectionId: v.id("platformBrokerConnections") },
  returns: v.union(
    v.object({
      connectionId: v.id("platformBrokerConnections"),
      provider: v.string(),
      status: platformStatusValidator,
      isDefault: v.boolean(),
      secrets: v.any(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row: any = await ctx.db.get(args.connectionId);
    if (!row) return null;
    return {
      connectionId: args.connectionId,
      provider: String(row.provider ?? ""),
      status: toStatus(row.status),
      isDefault: Boolean(row.isDefault),
      secrets: (row as any).secrets,
      updatedAt: Number(row.updatedAt ?? 0),
    };
  },
});

export const createTradeLockerConnectDraft = mutation({
  args: {
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    jwtHost: v.optional(v.string()),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    expiresAt: v.number(),
  },
  returns: v.id("platformBrokerConnectDrafts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("platformBrokerConnectDrafts", {
      provider: "tradelocker",
      environment: args.environment,
      server: args.server,
      jwtHost: args.jwtHost,
      accessTokenEncrypted: args.accessTokenEncrypted,
      refreshTokenEncrypted: args.refreshTokenEncrypted,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const consumeTradeLockerConnectDraft = mutation({
  args: {
    draftId: v.id("platformBrokerConnectDrafts"),
  },
  returns: v.union(
    v.object({
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      jwtHost: v.optional(v.string()),
      accessTokenEncrypted: v.string(),
      refreshTokenEncrypted: v.string(),
      accessTokenExpiresAt: v.optional(v.number()),
      refreshTokenExpiresAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const draft: any = await ctx.db.get(args.draftId);
    if (!draft) return null;
    if (String(draft.provider ?? "") !== "tradelocker") return null;
    if (Date.now() > Number(draft.expiresAt ?? 0)) {
      await ctx.db.delete(draft._id);
      return null;
    }
    await ctx.db.delete(draft._id);
    return {
      environment: draft.environment,
      server: draft.server,
      jwtHost: draft.jwtHost,
      accessTokenEncrypted: draft.accessTokenEncrypted,
      refreshTokenEncrypted: draft.refreshTokenEncrypted,
      accessTokenExpiresAt: draft.accessTokenExpiresAt,
      refreshTokenExpiresAt: draft.refreshTokenExpiresAt,
    };
  },
});

export const upsertTradeLockerConnectionWithSecrets = mutation({
  args: {
    connectionId: v.optional(v.id("platformBrokerConnections")),
    label: v.string(),
    status: platformStatusValidator, // active/disabled
    makeDefault: v.optional(v.boolean()),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    jwtHost: v.optional(v.string()),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    accounts: v.array(
      v.object({
        accountId: v.string(),
        accNum: v.number(),
        name: v.optional(v.string()),
        currency: v.optional(v.string()),
        status: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({ connectionId: v.id("platformBrokerConnections") }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const label = args.label.trim();
    if (!label) throw new Error("Missing label");

    const secrets = {
      environment: args.environment,
      server: args.server,
      jwtHost: args.jwtHost,
      selectedAccountId: args.selectedAccountId,
      selectedAccNum: args.selectedAccNum,
      accessTokenEncrypted: args.accessTokenEncrypted,
      refreshTokenEncrypted: args.refreshTokenEncrypted,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
    };

    const payload = {
      provider: "tradelocker",
      label,
      status: args.status,
      secrets,
      updatedAt: now,
    };

    const connectionId = args.connectionId
      ? args.connectionId
      : await ctx.db.insert("platformBrokerConnections", {
          ...payload,
          isDefault: false,
          createdAt: now,
        });

    if (args.connectionId) {
      await ctx.db.patch(connectionId, payload);
    }

    // Upsert account rows (for UI browsing + future health checks).
    for (const a of args.accounts) {
      const existing = await ctx.db
        .query("platformBrokerConnectionAccounts")
        .withIndex("by_connectionId_and_accNum", (q: any) =>
          q.eq("connectionId", connectionId).eq("accNum", a.accNum),
        )
        .first();

      const rowPayload = {
        connectionId,
        accountId: a.accountId,
        accNum: a.accNum,
        name: a.name,
        currency: a.currency,
        status: a.status,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, rowPayload);
      } else {
        await ctx.db.insert("platformBrokerConnectionAccounts", {
          ...rowPayload,
          createdAt: now,
        });
      }
    }

    if (args.makeDefault) {
      const current = await ctx.db
        .query("platformBrokerConnections")
        .withIndex("by_provider_and_isDefault", (q: any) =>
          q.eq("provider", "tradelocker").eq("isDefault", true),
        )
        .take(50);

      for (const row of current as any[]) {
        if (String(row._id) === String(connectionId)) continue;
        await ctx.db.patch(row._id, { isDefault: false, updatedAt: now });
      }

      await ctx.db.patch(connectionId, { isDefault: true, updatedAt: now });
    }

    return { connectionId };
  },
});

export const listConnectionAccounts = query({
  args: {
    connectionId: v.id("platformBrokerConnections"),
  },
  returns: v.array(platformAccountView),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("platformBrokerConnectionAccounts")
      .withIndex("by_connectionId", (q: any) => q.eq("connectionId", args.connectionId))
      .collect();
    return (Array.isArray(rows) ? rows : [])
      .slice()
      .sort((a: any, b: any) => (a.accNum ?? 0) - (b.accNum ?? 0))
      .map((r: any) => ({
        _id: r._id,
        _creationTime: r._creationTime,
        connectionId: r.connectionId,
        accountId: String(r.accountId ?? ""),
        accNum: typeof r.accNum === "number" ? r.accNum : 0,
        name: typeof r.name === "string" ? r.name : undefined,
        currency: typeof r.currency === "string" ? r.currency : undefined,
        status: typeof r.status === "string" ? r.status : undefined,
        customerAccess: r.customerAccess,
        lastConfigOk: r.lastConfigOk,
        lastConfigCheckedAt: r.lastConfigCheckedAt,
        lastConfigError: r.lastConfigError,
        lastConfigRaw: r.lastConfigRaw,
        createdAt: typeof r.createdAt === "number" ? r.createdAt : 0,
        updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : 0,
      }));
  },
});

export const getConnectionAccount = query({
  args: {
    accountRowId: v.id("platformBrokerConnectionAccounts"),
  },
  returns: v.union(platformAccountView, v.null()),
  handler: async (ctx, args) => {
    const row: any = await ctx.db.get(args.accountRowId);
    if (!row) return null;
    return {
      _id: row._id,
      _creationTime: row._creationTime,
      connectionId: row.connectionId,
      accountId: String(row.accountId ?? ""),
      accNum: typeof row.accNum === "number" ? row.accNum : 0,
      name: typeof row.name === "string" ? row.name : undefined,
      currency: typeof row.currency === "string" ? row.currency : undefined,
      status: typeof row.status === "string" ? row.status : undefined,
      customerAccess: row.customerAccess,
      lastConfigOk: row.lastConfigOk,
      lastConfigCheckedAt: row.lastConfigCheckedAt,
      lastConfigError: row.lastConfigError,
      lastConfigRaw: row.lastConfigRaw,
      createdAt: typeof row.createdAt === "number" ? row.createdAt : 0,
      updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : 0,
    };
  },
});

export const updateConnectionAccountDebug = mutation({
  args: {
    accountRowId: v.id("platformBrokerConnectionAccounts"),
    lastConfigOk: v.boolean(),
    customerAccess: v.optional(
      v.object({
        orders: v.boolean(),
        ordersHistory: v.boolean(),
        filledOrders: v.boolean(),
        positions: v.boolean(),
        symbolInfo: v.boolean(),
        marketDepth: v.boolean(),
      }),
    ),
    lastConfigError: v.optional(v.string()),
    lastConfigRaw: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row: any = await ctx.db.get(args.accountRowId);
    if (!row) throw new Error("Account not found");
    await ctx.db.patch(args.accountRowId, {
      lastConfigOk: args.lastConfigOk,
      customerAccess: args.customerAccess,
      lastConfigError: args.lastConfigError,
      lastConfigRaw: args.lastConfigRaw,
      lastConfigCheckedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setDefaultConnection = mutation({
  args: { connectionId: v.id("platformBrokerConnections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row: any = await ctx.db.get(args.connectionId);
    if (!row) throw new Error("Connection not found");
    const provider = String(row.provider ?? "").trim();
    if (!provider) throw new Error("Missing provider");

    const now = Date.now();
    const current = await ctx.db
      .query("platformBrokerConnections")
      .withIndex("by_provider_and_isDefault", (q: any) =>
        q.eq("provider", provider).eq("isDefault", true),
      )
      .take(50);

    for (const r of current as any[]) {
      if (String(r._id) === String(args.connectionId)) continue;
      await ctx.db.patch(r._id, { isDefault: false, updatedAt: now });
    }

    await ctx.db.patch(args.connectionId, { isDefault: true, updatedAt: now });
    return null;
  },
});

export const setConnectionStatus = mutation({
  args: {
    connectionId: v.id("platformBrokerConnections"),
    status: platformStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});

export const deleteConnection = mutation({
  args: { connectionId: v.id("platformBrokerConnections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.connectionId);
    return null;
  },
});

