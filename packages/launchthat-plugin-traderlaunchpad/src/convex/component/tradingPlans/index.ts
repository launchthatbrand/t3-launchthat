import { mutation, query } from "../server";

import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";

const tradingPlanSession = v.object({
  id: v.string(),
  label: v.string(),
  timezone: v.string(),
  days: v.array(v.string()),
  start: v.string(),
  end: v.string(),
});

const tradingPlanRule = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  category: v.union(
    v.literal("Entry"),
    v.literal("Risk"),
    v.literal("Exit"),
    v.literal("Process"),
    v.literal("Psychology"),
  ),
  severity: v.union(v.literal("hard"), v.literal("soft")),
});

const orgTradingPlanView = v.object({
  _id: v.id("orgTradingPlans"),
  _creationTime: v.number(),
  organizationId: v.string(),
  createdByUserId: v.string(),
  name: v.string(),
  version: v.string(),
  strategySummary: v.string(),
  markets: v.array(v.string()),
  sessions: v.array(tradingPlanSession),
  risk: v.object({
    maxRiskPerTradePct: v.number(),
    maxDailyLossPct: v.number(),
    maxWeeklyLossPct: v.number(),
    maxOpenPositions: v.number(),
    maxTradesPerDay: v.number(),
  }),
  rules: v.array(tradingPlanRule),
  kpis: v.object({
    adherencePct: v.number(),
    sessionDisciplinePct7d: v.number(),
    avgRiskPerTradePct7d: v.number(),
    journalCompliancePct: v.number(),
    violations7d: v.number(),
  }),
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const toOrgPlanListRow = v.object({
  _id: v.id("orgTradingPlans"),
  name: v.string(),
  version: v.string(),
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const tradingPlanView = v.object({
  _id: v.id("tradingPlans"),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  name: v.string(),
  version: v.string(),
  strategySummary: v.string(),
  markets: v.array(v.string()),
  sessions: v.array(tradingPlanSession),
  risk: v.object({
    maxRiskPerTradePct: v.number(),
    maxDailyLossPct: v.number(),
    maxWeeklyLossPct: v.number(),
    maxOpenPositions: v.number(),
    maxTradesPerDay: v.number(),
  }),
  rules: v.array(tradingPlanRule),
  kpis: v.object({
    adherencePct: v.number(),
    sessionDisciplinePct7d: v.number(),
    avgRiskPerTradePct7d: v.number(),
    journalCompliancePct: v.number(),
    violations7d: v.number(),
  }),
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const toPlanListRow = v.object({
  _id: v.id("tradingPlans"),
  name: v.string(),
  version: v.string(),
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const DEFAULT_PLAN = {
  name: "My First Trading Plan",
  version: "v1.0",
  strategySummary:
    "A simple, repeatable process: trade only A+ setups, size risk consistently, and journal every closed trade.",
  markets: ["ES", "NQ", "CL"],
  sessions: [
    {
      id: "london",
      label: "London",
      timezone: "UTC",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "07:00",
      end: "10:00",
    },
    {
      id: "newyork",
      label: "New York",
      timezone: "America/New_York",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "09:30",
      end: "11:30",
    },
  ],
  risk: {
    maxRiskPerTradePct: 1,
    maxDailyLossPct: 3,
    maxWeeklyLossPct: 6,
    maxOpenPositions: 2,
    maxTradesPerDay: 3,
  },
  rules: [
    {
      id: "entry-1",
      title: "Trade only A+ setups",
      description: "If you wouldn’t take it live on max size, don’t take it at all.",
      category: "Entry" as const,
      severity: "hard" as const,
    },
    {
      id: "risk-1",
      title: "Size risk before entry",
      description: "Risk is defined at entry. No moving stops wider.",
      category: "Risk" as const,
      severity: "hard" as const,
    },
    {
      id: "process-1",
      title: "Journal every closed trade",
      description: "No exceptions. Review within 24 hours.",
      category: "Process" as const,
      severity: "soft" as const,
    },
  ],
  kpis: {
    adherencePct: 80,
    sessionDisciplinePct7d: 80,
    avgRiskPerTradePct7d: 1,
    journalCompliancePct: 80,
    violations7d: 0,
  },
} as const;

export const listTradingPlans = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(toPlanListRow),
  handler: async (ctx, args) => {
    const includeArchived = Boolean(args.includeArchived);
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    const rows = await ctx.db
      .query("tradingPlans")
      .withIndex("by_org_and_user_and_updatedAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .take(limit);

    return rows
      .filter((p) => includeArchived || typeof p.archivedAt !== "number")
      .map((p) => ({
        _id: p._id,
        name: p.name,
        version: p.version,
        archivedAt: p.archivedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
  },
});

export const getTradingPlan = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    planId: v.id("tradingPlans"),
  },
  returns: v.union(tradingPlanView, v.null()),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    if (plan.organizationId !== args.organizationId) return null;
    if (plan.userId !== args.userId) return null;
    return plan;
  },
});

export const getActiveTradingPlan = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.union(tradingPlanView, v.null()),
  handler: async (ctx, args) => {
    const selection = await ctx.db
      .query("tradingPlanSelections")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (selection) {
      const plan = await ctx.db.get(selection.activePlanId);
      if (
        plan &&
        plan.organizationId === args.organizationId &&
        plan.userId === args.userId &&
        typeof plan.archivedAt !== "number"
      ) {
        return plan;
      }
    }

    const latest = await ctx.db
      .query("tradingPlans")
      .withIndex("by_org_and_user_and_updatedAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .first();

    if (!latest || typeof latest.archivedAt === "number") return null;
    return latest;
  },
});

export const createTradingPlanFromTemplate = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("tradingPlans"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const name = String(args.name ?? DEFAULT_PLAN.name).trim() || DEFAULT_PLAN.name;

    const id = await ctx.db.insert("tradingPlans", {
      organizationId: args.organizationId,
      userId: args.userId,
      name,
      version: DEFAULT_PLAN.version,
      strategySummary: DEFAULT_PLAN.strategySummary,
      markets: [...DEFAULT_PLAN.markets],
      sessions: DEFAULT_PLAN.sessions.map((s) => ({ ...s })),
      risk: { ...DEFAULT_PLAN.risk },
      rules: DEFAULT_PLAN.rules.map((r) => ({ ...r })),
      kpis: { ...DEFAULT_PLAN.kpis },
      archivedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-select the newly created plan as active.
    const existingSelection = await ctx.db
      .query("tradingPlanSelections")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existingSelection) {
      await ctx.db.patch(existingSelection._id, {
        activePlanId: id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("tradingPlanSelections", {
        organizationId: args.organizationId,
        userId: args.userId,
        activePlanId: id,
        updatedAt: now,
      });
    }

    return id;
  },
});

export const setActiveTradingPlan = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    planId: v.id("tradingPlans"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    if (plan.organizationId !== args.organizationId) return null;
    if (plan.userId !== args.userId) return null;
    if (typeof plan.archivedAt === "number") return null;

    const now = Date.now();
    const existingSelection = await ctx.db
      .query("tradingPlanSelections")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existingSelection) {
      await ctx.db.patch(existingSelection._id, {
        activePlanId: args.planId,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("tradingPlanSelections", {
      organizationId: args.organizationId,
      userId: args.userId,
      activePlanId: args.planId,
      updatedAt: now,
    });
    return null;
  },
});

export const archiveTradingPlan = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    planId: v.id("tradingPlans"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    if (plan.organizationId !== args.organizationId) return null;
    if (plan.userId !== args.userId) return null;

    const now = Date.now();
    await ctx.db.patch(args.planId, {
      archivedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const listOrgTradingPlans = query({
  args: {
    organizationId: v.string(),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(toOrgPlanListRow),
  handler: async (ctx, args) => {
    const includeArchived = Boolean(args.includeArchived);
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    const rows = await ctx.db
      .query("orgTradingPlans")
      .withIndex("by_org_and_updatedAt", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(limit);

    return rows
      .filter((p) => includeArchived || typeof p.archivedAt !== "number")
      .map((p) => ({
        _id: p._id,
        name: p.name,
        version: p.version,
        archivedAt: p.archivedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
  },
});

export const getOrgTradingPlan = query({
  args: {
    organizationId: v.string(),
    planId: v.id("orgTradingPlans"),
  },
  returns: v.union(orgTradingPlanView, v.null()),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    if (plan.organizationId !== args.organizationId) return null;
    return plan;
  },
});

export const createOrgTradingPlanFromTemplate = mutation({
  args: {
    organizationId: v.string(),
    createdByUserId: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("orgTradingPlans"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const name = String(args.name ?? DEFAULT_PLAN.name).trim() || DEFAULT_PLAN.name;

    const id = await ctx.db.insert("orgTradingPlans", {
      organizationId: args.organizationId,
      createdByUserId: args.createdByUserId,
      name,
      version: DEFAULT_PLAN.version,
      strategySummary: DEFAULT_PLAN.strategySummary,
      markets: [...DEFAULT_PLAN.markets],
      sessions: DEFAULT_PLAN.sessions.map((s) => ({ ...s })),
      risk: { ...DEFAULT_PLAN.risk },
      rules: DEFAULT_PLAN.rules.map((r) => ({ ...r })),
      kpis: { ...DEFAULT_PLAN.kpis },
      archivedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const getOrgTradingPlanPolicy = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.object({
    allowedPlanIds: v.array(v.id("orgTradingPlans")),
    forcedPlanId: v.union(v.id("orgTradingPlans"), v.null()),
    updatedAt: v.union(v.number(), v.null()),
    updatedByUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("orgTradingPlanPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();

    return {
      allowedPlanIds: Array.isArray(row?.allowedPlanIds) ? row.allowedPlanIds : [],
      forcedPlanId: row?.forcedPlanId ?? null,
      updatedAt: typeof row?.updatedAt === "number" ? row.updatedAt : null,
      updatedByUserId: typeof row?.updatedByUserId === "string" ? row.updatedByUserId : null,
    };
  },
});

export const setOrgTradingPlanPolicy = mutation({
  args: {
    organizationId: v.string(),
    updatedByUserId: v.string(),
    allowedPlanIds: v.array(v.id("orgTradingPlans")),
    forcedPlanId: v.optional(v.union(v.id("orgTradingPlans"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    const uniqueAllowed: Array<Id<"orgTradingPlans">> = [];
    for (const id of args.allowedPlanIds) {
      if (!uniqueAllowed.some((x) => x === id)) uniqueAllowed.push(id);
    }

    // Enforce “1–2 plans” constraint.
    const allowedPlanIds = uniqueAllowed.slice(0, 2);

    const forcedPlanId =
      args.forcedPlanId === null || typeof args.forcedPlanId === "undefined"
        ? null
        : args.forcedPlanId;

    // If forced, it must be one of the allowed.
    const effectiveAllowed =
      forcedPlanId && !allowedPlanIds.some((id) => id === forcedPlanId)
        ? [forcedPlanId]
        : allowedPlanIds;

    const existing = await ctx.db
      .query("orgTradingPlanPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        allowedPlanIds: effectiveAllowed,
        forcedPlanId: forcedPlanId ?? undefined,
        updatedAt: now,
        updatedByUserId: args.updatedByUserId,
      });
      return null;
    }

    await ctx.db.insert("orgTradingPlanPolicies", {
      organizationId: args.organizationId,
      allowedPlanIds: effectiveAllowed,
      forcedPlanId: forcedPlanId ?? undefined,
      updatedAt: now,
      updatedByUserId: args.updatedByUserId,
    });
    return null;
  },
});

export const getMyOrgTradingPlan = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.union(orgTradingPlanView, v.null()),
  handler: async (ctx, args) => {
    const policy = await ctx.db
      .query("orgTradingPlanPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();

    const forcedPlanId = policy?.forcedPlanId ?? null;
    const allowedPlanIds = Array.isArray(policy?.allowedPlanIds) ? policy.allowedPlanIds : [];

    const resolvePlan = async (planId: Id<"orgTradingPlans">): Promise<any | null> => {
      const plan = await ctx.db.get(planId);
      if (!plan) return null;
      if (plan.organizationId !== args.organizationId) return null;
      if (typeof plan.archivedAt === "number") return null;
      return plan;
    };

    if (forcedPlanId) {
      return await resolvePlan(forcedPlanId);
    }

    const assignment = await ctx.db
      .query("orgTradingPlanAssignments")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (assignment) {
      const assignedPlan = await resolvePlan(assignment.activePlanId);
      if (assignedPlan) {
        if (allowedPlanIds.length === 0) return assignedPlan;
        if (allowedPlanIds.some((id) => id === assignment.activePlanId)) return assignedPlan;
      }
    }

    return null;
  },
});

export const setMyOrgTradingPlan = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    planId: v.id("orgTradingPlans"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    if (plan.organizationId !== args.organizationId) return null;
    if (typeof plan.archivedAt === "number") return null;

    const policy = await ctx.db
      .query("orgTradingPlanPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();

    const forcedPlanId = policy?.forcedPlanId ?? null;
    const allowedPlanIds = Array.isArray(policy?.allowedPlanIds) ? policy.allowedPlanIds : [];

    const effectivePlanId: Id<"orgTradingPlans"> | null = forcedPlanId
      ? forcedPlanId
      : args.planId;

    if (!effectivePlanId) return null;

    if (allowedPlanIds.length > 0 && !allowedPlanIds.some((id) => id === effectivePlanId)) {
      return null;
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("orgTradingPlanAssignments")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        activePlanId: effectivePlanId,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("orgTradingPlanAssignments", {
      organizationId: args.organizationId,
      userId: args.userId,
      activePlanId: effectivePlanId,
      updatedAt: now,
    });
    return null;
  },
});

