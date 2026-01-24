/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { resolveOrganizationId, resolveViewerUserId } from "./lib/resolve";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";
import { v } from "convex/values";

const tradeIdeasNotesMutations = components.launchthat_traderlaunchpad.tradeIdeas
  .notes as any;
const tradingPlansMutations = components.launchthat_traderlaunchpad.tradingPlans.index as any;
const connectionsQueries = components.launchthat_traderlaunchpad.connections.queries as any;
const connectionsMutations = components.launchthat_traderlaunchpad.connections.mutations as any;
const coreTenantQueries = components.launchthat_core_tenant.queries as any;
const coreTenantMutations = components.launchthat_core_tenant.mutations as any;
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
    const userId = await resolveViewerUserId(ctx);

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

