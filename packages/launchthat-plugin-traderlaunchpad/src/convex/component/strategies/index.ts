import { mutation, query } from "../server";

import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";

const strategyKindValidator = v.union(v.literal("plan"), v.literal("dsl"));
const ownerTypeValidator = v.union(v.literal("user"), v.literal("org"));

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

const planSpecValidator = v.object({
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
});

const strategyListRow = v.object({
  _id: v.id("strategies"),
  kind: strategyKindValidator,
  ownerType: ownerTypeValidator,
  name: v.string(),
  version: v.string(),
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const strategyPlanView = v.object({
  _id: v.id("strategies"),
  _creationTime: v.number(),
  organizationId: v.string(),
  ownerType: ownerTypeValidator,
  ownerId: v.string(),
  kind: v.literal("plan"),
  name: v.string(),
  version: v.string(),
  summary: v.string(),
  spec: planSpecValidator,
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const strategyDslView = v.object({
  _id: v.id("strategies"),
  _creationTime: v.number(),
  organizationId: v.string(),
  ownerType: ownerTypeValidator,
  ownerId: v.string(),
  kind: v.literal("dsl"),
  name: v.string(),
  version: v.string(),
  summary: v.string(),
  spec: v.any(),
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const strategyView = v.union(strategyPlanView, strategyDslView);

const DEFAULT_PLAN = {
  name: "My First Strategy",
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

const ensureStrategy = async (
  ctx: any,
  strategyId: Id<"strategies">,
  args: { organizationId: string; ownerType: "user" | "org"; ownerId: string },
) => {
  const row = await ctx.db.get(strategyId);
  if (!row) return null;
  if (row.organizationId !== args.organizationId) return null;
  if (row.ownerType !== args.ownerType) return null;
  if (row.ownerId !== args.ownerId) return null;
  return row;
};

export const listMyStrategies = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(strategyListRow),
  handler: async (ctx, args) => {
    const includeArchived = Boolean(args.includeArchived);
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    const rows = await ctx.db
      .query("strategies")
      .withIndex("by_org_and_ownerType_and_ownerId_and_updatedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("ownerType", "user")
          .eq("ownerId", args.userId),
      )
      .order("desc")
      .take(limit);

    return rows
      .filter((s: any) => includeArchived || typeof s.archivedAt !== "number")
      .map((s: any) => ({
        _id: s._id,
        kind: s.kind === "dsl" ? ("dsl" as const) : ("plan" as const),
        ownerType: s.ownerType === "org" ? ("org" as const) : ("user" as const),
        name: s.name,
        version: s.version,
        archivedAt: s.archivedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
  },
});

export const getMyStrategy = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    strategyId: v.id("strategies"),
  },
  returns: v.union(strategyView, v.null()),
  handler: async (ctx, args) => {
    const row = await ensureStrategy(ctx, args.strategyId, {
      organizationId: args.organizationId,
      ownerType: "user",
      ownerId: args.userId,
    });
    if (!row) return null;
    if (typeof (row as any).archivedAt === "number") return null;
    return row;
  },
});

export const getMyActiveStrategy = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.union(strategyView, v.null()),
  handler: async (ctx, args) => {
    const selection = await ctx.db
      .query("strategySelections")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (selection) {
      const s = await ensureStrategy(ctx, selection.activeStrategyId, {
        organizationId: args.organizationId,
        ownerType: "user",
        ownerId: args.userId,
      });
      if (s && typeof (s as any).archivedAt !== "number") return s;
    }

    const latest = await ctx.db
      .query("strategies")
      .withIndex("by_org_and_ownerType_and_ownerId_and_updatedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("ownerType", "user")
          .eq("ownerId", args.userId),
      )
      .order("desc")
      .first();

    if (!latest || typeof (latest as any).archivedAt === "number") return null;
    return latest;
  },
});

export const createMyStrategyFromTemplate = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("strategies"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const name = String(args.name ?? DEFAULT_PLAN.name).trim() || DEFAULT_PLAN.name;
    const spec = {
      strategySummary: DEFAULT_PLAN.strategySummary,
      markets: [...DEFAULT_PLAN.markets],
      sessions: DEFAULT_PLAN.sessions.map((s) => ({ ...s })),
      risk: { ...DEFAULT_PLAN.risk },
      rules: DEFAULT_PLAN.rules.map((r) => ({ ...r })),
      kpis: { ...DEFAULT_PLAN.kpis },
    };

    const id = await ctx.db.insert("strategies", {
      organizationId: args.organizationId,
      ownerType: "user",
      ownerId: args.userId,
      kind: "plan",
      name,
      version: DEFAULT_PLAN.version,
      summary: spec.strategySummary,
      spec,
      createdByUserId: args.userId,
      archivedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const existingSelection = await ctx.db
      .query("strategySelections")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existingSelection) {
      await ctx.db.patch(existingSelection._id, {
        activeStrategyId: id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("strategySelections", {
        organizationId: args.organizationId,
        userId: args.userId,
        activeStrategyId: id,
        updatedAt: now,
      });
    }

    return id;
  },
});

export const setMyActiveStrategy = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    strategyId: v.id("strategies"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const s = await ensureStrategy(ctx, args.strategyId, {
      organizationId: args.organizationId,
      ownerType: "user",
      ownerId: args.userId,
    });
    if (!s) return null;
    if (typeof (s as any).archivedAt === "number") return null;

    const now = Date.now();
    const existing = await ctx.db
      .query("strategySelections")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { activeStrategyId: args.strategyId, updatedAt: now });
      return null;
    }

    await ctx.db.insert("strategySelections", {
      organizationId: args.organizationId,
      userId: args.userId,
      activeStrategyId: args.strategyId,
      updatedAt: now,
    });
    return null;
  },
});

export const archiveMyStrategy = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    strategyId: v.id("strategies"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const s = await ensureStrategy(ctx, args.strategyId, {
      organizationId: args.organizationId,
      ownerType: "user",
      ownerId: args.userId,
    });
    if (!s) return null;
    const now = Date.now();
    await ctx.db.patch(args.strategyId, { archivedAt: now, updatedAt: now });
    return null;
  },
});

export const listOrgStrategies = query({
  args: {
    organizationId: v.string(),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(strategyListRow),
  handler: async (ctx, args) => {
    const includeArchived = Boolean(args.includeArchived);
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    const rows = await ctx.db
      .query("strategies")
      .withIndex("by_org_and_ownerType_and_updatedAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("ownerType", "org"),
      )
      .order("desc")
      .take(limit);

    return rows
      .filter((s: any) => includeArchived || typeof s.archivedAt !== "number")
      .map((s: any) => ({
        _id: s._id,
        kind: s.kind === "dsl" ? ("dsl" as const) : ("plan" as const),
        ownerType: "org" as const,
        name: s.name,
        version: s.version,
        archivedAt: s.archivedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
  },
});

export const getOrgStrategy = query({
  args: { organizationId: v.string(), strategyId: v.id("strategies") },
  returns: v.union(strategyView, v.null()),
  handler: async (ctx, args) => {
    const row = await ensureStrategy(ctx, args.strategyId, {
      organizationId: args.organizationId,
      ownerType: "org",
      ownerId: args.organizationId,
    });
    if (!row) return null;
    if (typeof (row as any).archivedAt === "number") return null;
    return row;
  },
});

export const createOrgStrategyFromTemplate = mutation({
  args: {
    organizationId: v.string(),
    createdByUserId: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("strategies"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const name = String(args.name ?? DEFAULT_PLAN.name).trim() || DEFAULT_PLAN.name;
    const spec = {
      strategySummary: DEFAULT_PLAN.strategySummary,
      markets: [...DEFAULT_PLAN.markets],
      sessions: DEFAULT_PLAN.sessions.map((s) => ({ ...s })),
      risk: { ...DEFAULT_PLAN.risk },
      rules: DEFAULT_PLAN.rules.map((r) => ({ ...r })),
      kpis: { ...DEFAULT_PLAN.kpis },
    };
    const id = await ctx.db.insert("strategies", {
      organizationId: args.organizationId,
      ownerType: "org",
      ownerId: args.organizationId,
      kind: "plan",
      name,
      version: DEFAULT_PLAN.version,
      summary: spec.strategySummary,
      spec,
      createdByUserId: args.createdByUserId,
      archivedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const getOrgStrategyPolicy = query({
  args: { organizationId: v.string() },
  returns: v.object({
    allowedStrategyIds: v.array(v.id("strategies")),
    forcedStrategyId: v.union(v.id("strategies"), v.null()),
    updatedAt: v.union(v.number(), v.null()),
    updatedByUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("orgStrategyPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();
    return {
      allowedStrategyIds: Array.isArray(row?.allowedStrategyIds) ? row.allowedStrategyIds : [],
      forcedStrategyId: row?.forcedStrategyId ?? null,
      updatedAt: typeof row?.updatedAt === "number" ? row.updatedAt : null,
      updatedByUserId: typeof row?.updatedByUserId === "string" ? row.updatedByUserId : null,
    };
  },
});

export const setOrgStrategyPolicy = mutation({
  args: {
    organizationId: v.string(),
    updatedByUserId: v.string(),
    allowedStrategyIds: v.array(v.id("strategies")),
    forcedStrategyId: v.optional(v.union(v.id("strategies"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Enforce “1–2 strategies” constraint (mirrors prior plan policy).
    const uniqueAllowed: Array<Id<"strategies">> = [];
    for (const id of args.allowedStrategyIds) {
      if (!uniqueAllowed.some((x) => x === id)) uniqueAllowed.push(id);
    }
    const allowed = uniqueAllowed.slice(0, 2);

    const forced =
      args.forcedStrategyId === null || typeof args.forcedStrategyId === "undefined"
        ? null
        : args.forcedStrategyId;

    const effectiveAllowed =
      forced && !allowed.some((id) => id === forced) ? [forced] : allowed;

    const existing = await ctx.db
      .query("orgStrategyPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        allowedStrategyIds: effectiveAllowed,
        forcedStrategyId: forced ?? undefined,
        updatedAt: now,
        updatedByUserId: args.updatedByUserId,
      });
      return null;
    }

    await ctx.db.insert("orgStrategyPolicies", {
      organizationId: args.organizationId,
      allowedStrategyIds: effectiveAllowed,
      forcedStrategyId: forced ?? undefined,
      updatedAt: now,
      updatedByUserId: args.updatedByUserId,
    });
    return null;
  },
});

export const getMyOrgStrategy = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.union(strategyView, v.null()),
  handler: async (ctx, args) => {
    const policy = await ctx.db
      .query("orgStrategyPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();

    const forcedStrategyId = policy?.forcedStrategyId ?? null;
    const allowedStrategyIds = Array.isArray(policy?.allowedStrategyIds)
      ? policy.allowedStrategyIds
      : [];

    const resolve = async (strategyId: Id<"strategies">) => {
      const s = await ensureStrategy(ctx, strategyId, {
        organizationId: args.organizationId,
        ownerType: "org",
        ownerId: args.organizationId,
      });
      if (!s) return null;
      if (typeof (s as any).archivedAt === "number") return null;
      return s;
    };

    if (forcedStrategyId) return await resolve(forcedStrategyId);

    const assignment = await ctx.db
      .query("orgStrategyAssignments")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (assignment) {
      const assigned = await resolve(assignment.activeStrategyId);
      if (assigned) {
        if (allowedStrategyIds.length === 0) return assigned;
        if (allowedStrategyIds.some((id: Id<"strategies">) => id === assignment.activeStrategyId))
          return assigned;
      }
    }
    return null;
  },
});

export const setMyOrgStrategy = mutation({
  args: { organizationId: v.string(), userId: v.string(), strategyId: v.id("strategies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const s = await ensureStrategy(ctx, args.strategyId, {
      organizationId: args.organizationId,
      ownerType: "org",
      ownerId: args.organizationId,
    });
    if (!s) return null;
    if (typeof (s as any).archivedAt === "number") return null;

    const policy = await ctx.db
      .query("orgStrategyPolicies")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .unique();

    const forcedStrategyId = policy?.forcedStrategyId ?? null;
    const allowedStrategyIds = Array.isArray(policy?.allowedStrategyIds)
      ? policy.allowedStrategyIds
      : [];

    const effectiveStrategyId: Id<"strategies"> | null = forcedStrategyId
      ? forcedStrategyId
      : args.strategyId;
    if (!effectiveStrategyId) return null;

    if (
      allowedStrategyIds.length > 0 &&
      !allowedStrategyIds.some((id: Id<"strategies">) => id === effectiveStrategyId)
    ) {
      return null;
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("orgStrategyAssignments")
      .withIndex("by_org_and_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { activeStrategyId: effectiveStrategyId, updatedAt: now });
      return null;
    }

    await ctx.db.insert("orgStrategyAssignments", {
      organizationId: args.organizationId,
      userId: args.userId,
      activeStrategyId: effectiveStrategyId,
      updatedAt: now,
    });
    return null;
  },
});

