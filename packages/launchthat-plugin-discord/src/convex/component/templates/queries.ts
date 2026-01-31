import { v } from "convex/values";

import { query } from "../server";

const defaultTradeIdeaTemplate = [
  "**{{symbol}}** — **{{direction}}** — **{{status}}**",
  "Qty: `{{netQty}}`{{avgEntryPrice}}",
  "{{realizedPnl}}",
  "{{fees}}",
  "{{openedAt}}",
  "{{closedAt}}",
]
  .filter(Boolean)
  .join("\n");

const applyTemplate = (template: string, values: Record<string, string>) => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
};

const formatOptionalLine = (label: string, value: string | null) => {
  if (!value) return "";
  return `${label}: \`${value}\``;
};

const normalizeTemplateRow = (row: any, scope: "org" | "guild") => {
  return {
    _id: row._id,
    name: typeof row.name === "string" ? row.name : undefined,
    description: typeof row.description === "string" ? row.description : undefined,
    kind: String(row.kind ?? ""),
    template: String(row.template ?? ""),
    templateJson: typeof row.templateJson === "string" ? row.templateJson : undefined,
    guildId: typeof row.guildId === "string" ? row.guildId : undefined,
    updatedAt: Number(row.updatedAt ?? 0),
    createdAt:
      typeof row.createdAt === "number" ? row.createdAt : undefined,
    scope,
  };
};

export const listTemplates = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("messageTemplates"),
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      kind: v.string(),
      template: v.string(),
      templateJson: v.optional(v.string()),
      guildId: v.optional(v.string()),
      updatedAt: v.number(),
      createdAt: v.optional(v.number()),
      scope: v.union(v.literal("org"), v.literal("guild")),
    }),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return [];
    const orgRows = await ctx.db
      .query("messageTemplates")
      .withIndex(
        scope === "org"
          ? "by_organizationId_and_guildId_and_kind_and_updatedAt"
          : "by_scope_and_guildId_and_kind_and_updatedAt",
        (q: any) =>
          scope === "org"
            ? q.eq("organizationId", organizationId).eq("guildId", undefined).eq("kind", args.kind)
            : q.eq("scope", scope).eq("guildId", undefined).eq("kind", args.kind),
      )
      .order("desc")
      .collect();

    const results = orgRows.map((row) => normalizeTemplateRow(row, "org"));

    if (args.guildId) {
      const guildRows = await ctx.db
        .query("messageTemplates")
        .withIndex(
          scope === "org"
            ? "by_organizationId_and_guildId_and_kind_and_updatedAt"
            : "by_scope_and_guildId_and_kind_and_updatedAt",
          (q: any) =>
            scope === "org"
              ? q.eq("organizationId", organizationId).eq("guildId", args.guildId).eq("kind", args.kind)
              : q.eq("scope", scope).eq("guildId", args.guildId).eq("kind", args.kind),
        )
        .order("desc")
        .collect();
      results.unshift(
        ...guildRows.map((row) => normalizeTemplateRow(row, "guild")),
      );
    }

    return results;
  },
});

export const getTemplateById = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    templateId: v.id("messageTemplates"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("messageTemplates"),
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      kind: v.string(),
      template: v.string(),
      templateJson: v.optional(v.string()),
      guildId: v.optional(v.string()),
      updatedAt: v.number(),
      createdAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.templateId);
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (!row || row.scope !== scope) return null;
    if (scope === "org" && row.organizationId !== organizationId) return null;
    return {
      _id: row._id,
      name: typeof row.name === "string" ? row.name : undefined,
      description: typeof row.description === "string" ? row.description : undefined,
      kind: String(row.kind ?? ""),
      template: String(row.template ?? ""),
      templateJson: typeof row.templateJson === "string" ? row.templateJson : undefined,
      guildId: typeof row.guildId === "string" ? row.guildId : undefined,
      updatedAt: Number(row.updatedAt ?? 0),
      createdAt:
        typeof row.createdAt === "number" ? row.createdAt : undefined,
    };
  },
});

const resolveTemplateContent = async (ctx: any, args: any) => {
  if (args.templateId) {
    const row = await ctx.db.get(args.templateId);
    if (row && row.scope === args.scope) {
      if (args.scope === "org" && row.organizationId !== args.organizationId) {
        return null;
      }
      return String(row.template ?? "");
    }
  }

  if (args.guildId) {
    const guildRow = await ctx.db
      .query("messageTemplates")
      .withIndex(
        args.scope === "org"
          ? "by_organizationId_and_guildId_and_kind_and_updatedAt"
          : "by_scope_and_guildId_and_kind_and_updatedAt",
        (q: any) =>
          args.scope === "org"
            ? q.eq("organizationId", args.organizationId).eq("guildId", args.guildId).eq("kind", "tradeidea")
            : q.eq("scope", args.scope).eq("guildId", args.guildId).eq("kind", "tradeidea"),
      )
      .order("desc")
      .first();
    if (guildRow?.template) {
      return String(guildRow.template);
    }
  }

  const orgRow = await ctx.db
    .query("messageTemplates")
    .withIndex(
      args.scope === "org"
        ? "by_organizationId_and_guildId_and_kind_and_updatedAt"
        : "by_scope_and_guildId_and_kind_and_updatedAt",
      (q: any) =>
        args.scope === "org"
          ? q.eq("organizationId", args.organizationId).eq("guildId", undefined).eq("kind", "tradeidea")
          : q.eq("scope", args.scope).eq("guildId", undefined).eq("kind", "tradeidea"),
    )
    .order("desc")
    .first();

  if (orgRow?.template) {
    return String(orgRow.template);
  }

  return defaultTradeIdeaTemplate;
};

export const renderTradeIdeaMessage = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    templateId: v.optional(v.id("messageTemplates")),
    symbol: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    direction: v.union(v.literal("long"), v.literal("short")),
    netQty: v.number(),
    avgEntryPrice: v.optional(v.number()),
    realizedPnl: v.optional(v.number()),
    fees: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
  },
  returns: v.object({ content: v.string() }),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    const template =
      (await resolveTemplateContent(ctx, {
      scope,
      organizationId,
      guildId: args.guildId ?? undefined,
      templateId: args.templateId,
      })) ?? defaultTradeIdeaTemplate;

    const avg =
      typeof args.avgEntryPrice === "number"
        ? String(args.avgEntryPrice)
        : null;
    const realized =
      typeof args.realizedPnl === "number" ? String(args.realizedPnl) : null;
    const fee = typeof args.fees === "number" ? String(args.fees) : null;
    const openedAt =
      typeof args.openedAt === "number"
        ? `<t:${Math.floor(args.openedAt / 1000)}:f>`
        : null;
    const closedAt =
      typeof args.closedAt === "number"
        ? `<t:${Math.floor(args.closedAt / 1000)}:f>`
        : null;

    const content = applyTemplate(template, {
      symbol: args.symbol,
      direction: args.direction === "short" ? "Short" : "Long",
      status: args.status === "closed" ? "Closed" : "Open",
      netQty: String(args.netQty),
      avgEntryPrice: avg ? ` • Avg: \`${avg}\`` : "",
      realizedPnl: formatOptionalLine("Realized PnL", realized),
      fees: formatOptionalLine("Fees", fee),
      openedAt: openedAt ? `Opened: ${openedAt}` : "",
      closedAt: closedAt ? `Closed: ${closedAt}` : "",
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");

    return { content };
  },
});

export const getTemplate = query({
  args: {
    organizationId: v.string(),
    guildId: v.optional(v.string()),
    kind: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      template: v.string(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const guildId = args.guildId ?? undefined;
    let templateRow = await ctx.db
      .query("messageTemplates")
      .withIndex("by_organizationId_and_guildId_and_kind_and_updatedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("guildId", guildId)
          .eq("kind", args.kind),
      )
      .order("desc")
      .first();

    if (!templateRow && guildId) {
      templateRow = await ctx.db
        .query("messageTemplates")
        .withIndex(
          "by_organizationId_and_guildId_and_kind_and_updatedAt",
          (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("guildId", undefined)
              .eq("kind", args.kind),
        )
        .order("desc")
        .first();
    }

    if (!templateRow) return null;

    return {
      template: templateRow.template,
      updatedAt: templateRow.updatedAt,
    };
  },
});
