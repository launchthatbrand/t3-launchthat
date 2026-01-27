/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { resolveOrganizationId, resolveViewerIsAdmin, resolveViewerUserId } from "./lib/resolve";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";

const tradeIdeasNotesMutations = components.launchthat_traderlaunchpad.tradeIdeas
  .notes as any;
const tradeIdeasIdeasMutations = (components.launchthat_traderlaunchpad.tradeIdeas as any)
  .ideas as any;
const sharingModule = components.launchthat_traderlaunchpad.sharing as any;
const visibilityModule = components.launchthat_traderlaunchpad.visibility as any;
const permissionsModule = components.launchthat_traderlaunchpad.permissions as any;
const tradingPlansMutations = components.launchthat_traderlaunchpad.tradingPlans.index as any;
const connectionsQueries = components.launchthat_traderlaunchpad.connections.queries as any;
const connectionsMutations = components.launchthat_traderlaunchpad.connections.mutations as any;
const coreTenantQueries = components.launchthat_core_tenant.queries as any;
const coreTenantMutations = components.launchthat_core_tenant.mutations as any;
const joinCodesMutations = components.launchthat_joincodes.mutations as any;
const permissionsMutations = components.launchthat_traderlaunchpad.permissions as any;
const analyticsMutations = components.launchthat_traderlaunchpad.analytics.mutations as any;

const resolveMembershipForOrg = async (ctx: any, organizationId: string, userId: string) => {
  const memberships = (await ctx.runQuery(coreTenantQueries.listOrganizationsByUserId, {
    userId,
  })) as unknown as any[];

  const match =
    Array.isArray(memberships)
      ? memberships.find((m) => {
          const orgId = String((m as any)?.organizationId ?? (m as any)?.org?._id ?? "");
          return orgId === organizationId;
        })
      : null;

  if (!match) return null;
  if (!Boolean((match as any)?.isActive)) return null;

  const role = String((match as any)?.role ?? "");
  return { role };
};

const resolveUserDocIdByClerkId = async (
  ctx: any,
  clerkId: string,
): Promise<string | null> => {
  const normalized = String(clerkId ?? "").trim();
  if (!normalized) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", normalized))
    .first();

  return user ? String(user._id) : null;
};

const isEntitledForType = (
  limits: unknown,
  type: "tradeIdeas" | "openPositions" | "orders",
): boolean => {
  // Default to enabled to avoid accidental lockouts; platform admin can explicitly disable.
  const raw = limits && typeof limits === "object" ? (limits as Record<string, unknown>) : {};
  const featuresRaw =
    raw.features && typeof raw.features === "object" ? (raw.features as Record<string, unknown>) : {};

  const tradeIdeas = featuresRaw.tradeIdeas !== false;
  const journal = featuresRaw.journal !== false;
  const orders = featuresRaw.orders !== false;

  if (type === "tradeIdeas") return tradeIdeas;
  if (type === "openPositions") return journal;
  return orders;
};

const requireGlobalPermission = async (
  ctx: any,
  type: "tradeIdeas" | "openPositions" | "orders",
): Promise<string> => {
  const userId = await resolveViewerUserId(ctx);

  // Admins bypass feature-permission gating.
  if (await resolveViewerIsAdmin(ctx)) {
    return userId;
  }

  const row = await ctx.db
    .query("userEntitlements")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  const limits = (row as any)?.limits;

  if (!isEntitledForType(limits, type)) {
    throw new ConvexError("Forbidden: You do not have access to this feature.");
  }

  return userId;
};

const randomToken = (): string => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // base64url
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const upsertMyTradeIdeaNoteForGroup = mutation({
  args: {
    tradeIdeaGroupId: v.string(),
    thesis: v.optional(v.string()),
    setup: v.optional(v.string()),
    mistakes: v.optional(v.string()),
    outcome: v.optional(v.string()),
    nextTime: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.object({ noteId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await requireGlobalPermission(ctx, "tradeIdeas");

    const noteId = await ctx.runMutation(tradeIdeasNotesMutations.upsertNoteForGroup, {
      organizationId,
      userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId as any,
      thesis: args.thesis,
      setup: args.setup,
      mistakes: args.mistakes,
      outcome: args.outcome,
      nextTime: args.nextTime,
      tags: args.tags,
    });

    return { noteId: String(noteId) };
  },
});

export const upsertMyTradeIdeaSettings = mutation({
  args: {
    groupingWindowMs: v.number(),
    splitOnDirectionFlip: v.boolean(),
    defaultTimeframe: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await requireGlobalPermission(ctx, "tradeIdeas");
    await ctx.runMutation(tradeIdeasIdeasMutations.upsertMyTradeIdeaSettings, {
      organizationId,
      userId,
      groupingWindowMs: args.groupingWindowMs,
      splitOnDirectionFlip: args.splitOnDirectionFlip,
      defaultTimeframe: args.defaultTimeframe,
    });
    return null;
  },
});

export const upsertMyShareVisibilitySettings = mutation({
  args: {
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
    positionsEnabled: v.boolean(),
    profileEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await requireGlobalPermission(ctx, "tradeIdeas");
    await ctx.runMutation(sharingModule.upsertMyShareVisibilitySettings, {
      organizationId,
      userId,
      globalEnabled: args.globalEnabled,
      tradeIdeasEnabled: args.tradeIdeasEnabled,
      ordersEnabled: args.ordersEnabled,
      positionsEnabled: args.positionsEnabled,
      profileEnabled: args.profileEnabled,
    });
    return null;
  },
});

export const upsertMyVisibilitySettings = mutation({
  args: {
    globalPublic: v.boolean(),
    tradeIdeasPublic: v.boolean(),
    ordersPublic: v.boolean(),
    positionsPublic: v.boolean(),
    profilePublic: v.boolean(),
    analyticsReportsPublic: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await requireGlobalPermission(ctx, "tradeIdeas");
    await ctx.runMutation(visibilityModule.upsertMyVisibilitySettings, {
      organizationId,
      userId,
      globalPublic: args.globalPublic,
      tradeIdeasPublic: args.tradeIdeasPublic,
      ordersPublic: args.ordersPublic,
      positionsPublic: args.positionsPublic,
      profilePublic: args.profilePublic,
      analyticsReportsPublic: args.analyticsReportsPublic,
    });
    return null;
  },
});

export const upsertMyGlobalPermissions = mutation({
  args: {
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    openPositionsEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireGlobalPermission(ctx, "tradeIdeas");
    await ctx.runMutation(permissionsModule.upsertPermissions, {
      userId,
      scopeType: "global",
      globalEnabled: args.globalEnabled,
      tradeIdeasEnabled: args.tradeIdeasEnabled,
      openPositionsEnabled: args.openPositionsEnabled,
      ordersEnabled: args.ordersEnabled,
    });
    return null;
  },
});

export const upsertMyOrgPermissions = mutation({
  args: {
    organizationId: v.string(),
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    openPositionsEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = String(args.organizationId ?? "").trim();
    if (!organizationId) throw new Error("Missing organizationId");

    const userId = await requireGlobalPermission(ctx, "tradeIdeas");
    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) throw new Error("Not a member of this organization");

    await ctx.runMutation(permissionsModule.upsertPermissions, {
      userId,
      scopeType: "org",
      scopeId: organizationId,
      globalEnabled: args.globalEnabled,
      tradeIdeasEnabled: args.tradeIdeasEnabled,
      openPositionsEnabled: args.openPositionsEnabled,
      ordersEnabled: args.ordersEnabled,
    });
    return null;
  },
});

export const setMyTradeIdeaSharing = mutation({
  args: {
    tradeIdeaId: v.string(),
    visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    shareToken: v.optional(v.string()),
    visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
  }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await requireGlobalPermission(ctx, "tradeIdeas");
    const res = await ctx.runMutation(tradeIdeasIdeasMutations.setTradeIdeaSharing, {
      organizationId,
      userId,
      tradeIdeaId: args.tradeIdeaId as any,
      visibility: args.visibility,
      expiresAt: args.expiresAt,
    });
    return res as any;
  },
});

export const createMyTradeIdea = mutation({
  args: {
    symbol: v.string(),
    instrumentId: v.optional(v.string()),
    bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
    timeframe: v.optional(v.string()),
    timeframeLabel: v.optional(v.string()),
    thesis: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.object({ tradeIdeaId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const res = await ctx.runMutation(tradeIdeasIdeasMutations.createTradeIdea, {
      organizationId,
      userId,
      symbol: args.symbol,
      instrumentId: args.instrumentId,
      bias: args.bias,
      timeframe: args.timeframe,
      timeframeLabel: args.timeframeLabel,
      thesis: args.thesis,
      tags: args.tags,
    });
    return { tradeIdeaId: String((res as any).tradeIdeaId) };
  },
});

export const backfillMyTradeIdeas = mutation({
  args: {
    scanCap: v.optional(v.number()),
    limitAssigned: v.optional(v.number()),
  },
  returns: v.object({
    scanned: v.number(),
    assigned: v.number(),
    createdIdeas: v.number(),
  }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const res = await ctx.runMutation(tradeIdeasIdeasMutations.backfillIdeasForUser, {
      organizationId,
      userId,
      scanCap: args.scanCap,
      limitAssigned: args.limitAssigned,
    });
    return res as any;
  },
});

// Admin/debug utility: reconcile idea symbols + merge duplicates (uses your current settings)
export const reconcileMyTradeIdeas = mutation({
  args: {
    scanCap: v.optional(v.number()),
  },
  returns: v.object({
    ideasScanned: v.number(),
    ideasPatched: v.number(),
    groupsReassigned: v.number(),
    ideasDeleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const res = await ctx.runMutation(tradeIdeasIdeasMutations.reconcileIdeasForUser, {
      organizationId,
      userId,
      scanCap: args.scanCap,
    });
    return {
      ideasScanned: Number((res as any)?.ideasScanned ?? 0),
      ideasPatched: Number((res as any)?.ideasPatched ?? 0),
      groupsReassigned: Number((res as any)?.groupsReassigned ?? 0),
      ideasDeleted: Number((res as any)?.ideasDeleted ?? 0),
    };
  },
});

export const markMyTradeIdeaReviewed = mutation({
  args: {
    tradeIdeaGroupId: v.string(),
  },
  returns: v.object({ noteId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const noteId = await ctx.runMutation(tradeIdeasNotesMutations.markReviewed, {
      organizationId,
      userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId as any,
    });

    return { noteId: String(noteId) };
  },
});

export const createMyTradingPlanFromTemplate = mutation({
  args: {
    name: v.optional(v.string()),
  },
  returns: v.object({ planId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const planId = await ctx.runMutation(
      tradingPlansMutations.createTradingPlanFromTemplate,
      {
        organizationId,
        userId,
        name: args.name,
      },
    );
    return { planId: String(planId) };
  },
});

export const setMyActiveTradingPlan = mutation({
  args: {
    planId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(tradingPlansMutations.setActiveTradingPlan, {
      organizationId,
      userId,
      planId: args.planId as any,
    });
    return null;
  },
});

export const createOrgUserInvite = mutation({
  args: {
    organizationId: v.string(),
    email: v.string(),
    role: v.optional(v.string()),
    expiresInDays: v.optional(v.number()),
  },
  returns: v.object({ inviteId: v.string(), token: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const userId = await resolveViewerUserId(ctx);

    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) return { inviteId: "", token: "" };
    if (membership.role !== "owner" && membership.role !== "admin") return { inviteId: "", token: "" };

    const email = String(args.email ?? "").trim().toLowerCase();
    if (!email) return { inviteId: "", token: "" };

    const role = String(args.role ?? "viewer").trim() || "viewer";
    const days = Math.max(1, Math.min(Number(args.expiresInDays ?? 7), 30));

    const now = Date.now();
    const token = randomToken();
    const expiresAt = now + days * 24 * 60 * 60 * 1000;

    const id = await ctx.db.insert("orgUserInvites", {
      organizationId,
      email,
      role,
      token,
      createdByUserId: userId,
      createdAt: now,
      expiresAt,
    });

    return { inviteId: String(id), token };
  },
});

export const revokeOrgUserInvite = mutation({
  args: {
    organizationId: v.string(),
    inviteId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const userId = await resolveViewerUserId(ctx);

    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) return null;
    if (membership.role !== "owner" && membership.role !== "admin") return null;

    const invite = await ctx.db.get(args.inviteId as any);
    if (!invite) return null;
    if (String((invite as any).organizationId) !== organizationId) return null;

    await ctx.db.patch((invite as any)._id, { revokedAt: Date.now() });
    return null;
  },
});

export const setOrgAccessSettings = mutation({
  args: {
    organizationId: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    joinCodesEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const userId = await resolveViewerUserId(ctx);
    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) return null;
    if (membership.role !== "owner" && membership.role !== "admin") return null;

    const existing = await ctx.db
      .query("orgAccessSettings")
      .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch((existing as any)._id, {
        visibility: args.visibility,
        joinCodesEnabled: args.joinCodesEnabled,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("orgAccessSettings", {
      organizationId,
      visibility: args.visibility,
      joinCodesEnabled: args.joinCodesEnabled,
      updatedAt: now,
    });
    return null;
  },
});

export const createOrgJoinCode = mutation({
  args: {
    organizationId: v.string(),
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
  },
  returns: v.object({ code: v.string(), joinCodeId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const userId = await resolveViewerUserId(ctx);
    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) return { code: "", joinCodeId: "" };
    if (membership.role !== "owner" && membership.role !== "admin") {
      return { code: "", joinCodeId: "" };
    }

    const created = await ctx.runMutation(joinCodesMutations.createJoinCode, {
      scope: "organization",
      organizationId,
      label: args.label,
      role: args.role,
      tier: args.tier,
      permissions: args.permissions,
      maxUses: args.maxUses,
      expiresAt: args.expiresAt,
      createdByUserId: userId,
    });

    return {
      code: String((created as any)?.code ?? ""),
      joinCodeId: String((created as any)?.joinCodeId ?? ""),
    };
  },
});

export const redeemOrgJoinCode = mutation({
  args: {
    code: v.string(),
  },
  returns: v.object({ organizationId: v.string() }),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const code = String(args.code ?? "").trim();
    if (!code) return { organizationId: "" };

    const redemption = await ctx.runMutation(joinCodesMutations.redeemJoinCode, {
      code,
      redeemedByUserId: userId,
    });
    if (!redemption) return { organizationId: "" };

    const scope = String((redemption as any)?.scope ?? "");
    const organizationId = String((redemption as any)?.organizationId ?? "").trim();
    if (scope !== "organization" || !organizationId) return { organizationId: "" };

    const settings = await ctx.db
      .query("orgAccessSettings")
      .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
      .first();
    if (settings) {
      const visibility = String((settings as any)?.visibility ?? "public");
      const joinCodesEnabled = Boolean((settings as any)?.joinCodesEnabled);
      if (visibility === "private" && !joinCodesEnabled) {
        return { organizationId: "" };
      }
    }

    const role = String((redemption as any)?.role ?? "").trim();
    const tier = String((redemption as any)?.tier ?? "").trim();
    const permissions = (redemption as any)?.permissions as
      | {
          globalEnabled?: boolean;
          tradeIdeasEnabled?: boolean;
          openPositionsEnabled?: boolean;
          ordersEnabled?: boolean;
        }
      | undefined;
    const grants = (redemption as any)?.grants as
      | {
          limits?: unknown;
        }
      | undefined;

    if (role === "user" || role === "staff" || role === "admin") {
      const userDocId = await resolveUserDocIdByClerkId(ctx, userId);
      if (userDocId) {
        await ctx.db.patch(userDocId as any, {
          role,
          updatedAt: Date.now(),
        });
      }
    }

    if (tier === "free" || tier === "standard" || tier === "pro") {
      const normalizedTier: "free" | "standard" | "pro" = tier;
      const existing = await ctx.db
        .query("userEntitlements")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .first();
      const payload: {
        userId: string;
        tier: "free" | "standard" | "pro";
        limits?: any;
        updatedAt: number;
      } = {
        userId,
        tier: normalizedTier,
        ...(grants?.limits !== undefined ? { limits: grants.limits } : {}),
        updatedAt: Date.now(),
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("userEntitlements", payload);
      }
    }

    // NOTE: join codes previously wrote to the legacy permissions module.
    // Entitlements are now app-owned (`userEntitlements.limits`), so join codes
    // should only apply `tier` + optional `grants.limits`.

    await ctx.runMutation(coreTenantMutations.ensureMembership, {
      userId,
      organizationId: organizationId as any,
      role: "viewer" as any,
      setActive: true,
    });

    return { organizationId };
  },
});

export const redeemPlatformJoinCode = mutation({
  args: {
    code: v.string(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const code = String(args.code ?? "").trim();
    if (!code) return { ok: false };

    const redemption = await ctx.runMutation(joinCodesMutations.redeemJoinCode, {
      code,
      redeemedByUserId: userId,
    });
    if (!redemption) return { ok: false };

    const scope = String((redemption as any)?.scope ?? "");
    if (scope !== "platform") return { ok: false };

    const role = String((redemption as any)?.role ?? "").trim();
    const tier = String((redemption as any)?.tier ?? "").trim();
    const permissions = (redemption as any)?.permissions as
      | {
          globalEnabled?: boolean;
          tradeIdeasEnabled?: boolean;
          openPositionsEnabled?: boolean;
          ordersEnabled?: boolean;
        }
      | undefined;
    const grants = (redemption as any)?.grants as
      | {
          limits?: unknown;
        }
      | undefined;

    if (role === "user" || role === "staff" || role === "admin") {
      const userDocId = await resolveUserDocIdByClerkId(ctx, userId);
      if (userDocId) {
        await ctx.db.patch(userDocId as any, {
          role,
          updatedAt: Date.now(),
        });
      }
    }

    if (tier === "free" || tier === "standard" || tier === "pro") {
      const normalizedTier: "free" | "standard" | "pro" = tier;
      const existing = await ctx.db
        .query("userEntitlements")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .first();
      const payload: {
        userId: string;
        tier: "free" | "standard" | "pro";
        limits?: any;
        updatedAt: number;
      } = {
        userId,
        tier: normalizedTier,
        ...(grants?.limits !== undefined ? { limits: grants.limits } : {}),
        updatedAt: Date.now(),
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("userEntitlements", payload);
      }
    }

    // NOTE: join codes previously wrote to the legacy permissions module.
    // Entitlements are now app-owned (`userEntitlements.limits`), so join codes
    // should only apply `tier` + optional `grants.limits`.

    return { ok: true };
  },
});

export const createMyAnalyticsReport = mutation({
  args: {
    name: v.string(),
    accountId: v.optional(v.string()),
    visibility: v.union(v.literal("private"), v.literal("link")),
    spec: v.any(),
  },
  returns: v.object({ reportId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const out = await ctx.runMutation(analyticsMutations.createMyAnalyticsReport, {
      organizationId,
      userId,
      name: args.name,
      accountId: args.accountId,
      visibility: args.visibility,
      spec: args.spec,
    });
    return { reportId: String((out as any)?.reportId ?? "") };
  },
});

export const updateMyAnalyticsReport = mutation({
  args: {
    reportId: v.string(),
    name: v.optional(v.string()),
    accountId: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("private"), v.literal("link"))),
    spec: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(analyticsMutations.updateMyAnalyticsReport, {
      organizationId,
      userId,
      reportId: args.reportId as any,
      name: args.name,
      accountId: args.accountId,
      visibility: args.visibility,
      spec: args.spec,
    });
    return null;
  },
});

export const enableMyAnalyticsReportShareLink = mutation({
  args: { reportId: v.string() },
  returns: v.object({ shareToken: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const out = await ctx.runMutation(analyticsMutations.enableShareLink, {
      organizationId,
      userId,
      reportId: args.reportId as any,
    });
    return { shareToken: String((out as any)?.shareToken ?? "") };
  },
});

export const disableMyAnalyticsReportShareLink = mutation({
  args: { reportId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(analyticsMutations.disableShareLink, {
      organizationId,
      userId,
      reportId: args.reportId as any,
    });
    return null;
  },
});

export const deleteMyAnalyticsReport = mutation({
  args: { reportId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(analyticsMutations.deleteMyAnalyticsReport, {
      organizationId,
      userId,
      reportId: args.reportId as any,
    });
    return null;
  },
});

export const acceptOrgUserInvite = mutation({
  args: {
    token: v.string(),
  },
  returns: v.object({ organizationId: v.string() }),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const token = String(args.token ?? "").trim();
    if (!token) return { organizationId: "" };

    const invite = await ctx.db
      .query("orgUserInvites")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_token", (q: any) => q.eq("token", token))
      .first();

    if (!invite) return { organizationId: "" };

    const now = Date.now();
    if (typeof (invite as any).revokedAt === "number") return { organizationId: "" };
    if (typeof (invite as any).redeemedAt === "number") return { organizationId: "" };
    if (Number((invite as any).expiresAt ?? 0) < now) return { organizationId: "" };

    const organizationId = String((invite as any).organizationId ?? "").trim();
    const role = String((invite as any).role ?? "viewer").trim() || "viewer";

    // Add/activate membership in core-tenant.
    await ctx.runMutation(coreTenantMutations.ensureMembership, {
      userId,
      organizationId: organizationId as any,
      role: role as any,
      setActive: true,
    });

    await ctx.db.patch((invite as any)._id, {
      redeemedAt: now,
      redeemedByUserId: userId,
    });

    return { organizationId };
  },
});

export const createOrgTradingPlanFromTemplate = mutation({
  args: {
    organizationId: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.object({ planId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const userId = await resolveViewerUserId(ctx);

    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) return { planId: "" };
    if (membership.role !== "owner" && membership.role !== "admin") return { planId: "" };

    const planId = await ctx.runMutation(tradingPlansMutations.createOrgTradingPlanFromTemplate, {
      organizationId,
      createdByUserId: userId,
      name: args.name,
    });

    return { planId: String(planId) };
  },
});

export const setOrgTradingPlanPolicy = mutation({
  args: {
    organizationId: v.string(),
    allowedPlanIds: v.array(v.string()),
    forcedPlanId: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const userId = await resolveViewerUserId(ctx);

    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) return null;
    if (membership.role !== "owner" && membership.role !== "admin") return null;

    const allowedPlanIds = (Array.isArray(args.allowedPlanIds) ? args.allowedPlanIds : [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 2);

    const forcedPlanId =
      args.forcedPlanId === null || typeof args.forcedPlanId === "undefined"
        ? null
        : String(args.forcedPlanId).trim() || null;

    await ctx.runMutation(tradingPlansMutations.setOrgTradingPlanPolicy, {
      organizationId,
      updatedByUserId: userId,
      allowedPlanIds: allowedPlanIds as any,
      forcedPlanId: forcedPlanId as any,
    });

    return null;
  },
});

export const setMyOrgTradingPlan = mutation({
  args: {
    organizationId: v.string(),
    planId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const userId = await resolveViewerUserId(ctx);

    const membership = await resolveMembershipForOrg(ctx, organizationId, userId);
    if (!membership) return null;

    await ctx.runMutation(tradingPlansMutations.setMyOrgTradingPlan, {
      organizationId,
      userId,
      planId: args.planId as any,
    });

    return null;
  },
});

export const setMySelectedConnectionAccount = mutation({
  args: {
    // Id of the `connectionAccounts` row (stored in the component)
    accountRowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(connectionsQueries.getMyConnection, {
      organizationId,
      userId,
    });
    if (!connection) return null;

    const accounts = await ctx.runQuery(connectionsQueries.listMyConnectionAccounts, {
      organizationId,
      userId,
      connectionId: (connection as any)._id,
    } as any);
    const list = Array.isArray(accounts) ? accounts : [];

    const row =
      list.find((a: any) => String(a?._id ?? "") === args.accountRowId) ?? null;
    if (!row) return null;

    const selectedAccountId = String(row?.accountId ?? row?.id ?? "").trim();
    const selectedAccNum = Number(row?.accNum ?? row?.acc_num ?? row?.accountNumber ?? 0);
    if (!selectedAccountId || !Number.isFinite(selectedAccNum) || selectedAccNum <= 0) {
      return null;
    }

    await ctx.runMutation(connectionsMutations.setConnectionSelectedAccount, {
      organizationId,
      userId,
      connectionId: (connection as any)._id,
      selectedAccountId,
      selectedAccNum,
    } as any);

    return null;
  },
});

