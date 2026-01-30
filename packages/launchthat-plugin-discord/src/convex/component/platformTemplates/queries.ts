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

const normalizeTemplateRow = (row: any, scope: "platform" | "guild") => {
  return {
    _id: row._id,
    name: typeof row.name === "string" ? row.name : undefined,
    description: typeof row.description === "string" ? row.description : undefined,
    kind: String(row.kind ?? ""),
    template: String(row.template ?? ""),
    templateJson: typeof row.templateJson === "string" ? row.templateJson : undefined,
    guildId: typeof row.guildId === "string" ? row.guildId : undefined,
    updatedAt: Number(row.updatedAt ?? 0),
    createdAt: typeof row.createdAt === "number" ? row.createdAt : undefined,
    scope,
  };
};

export const listTemplates = query({
  args: {
    guildId: v.optional(v.string()),
    kind: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("platformMessageTemplates"),
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      kind: v.string(),
      template: v.string(),
      templateJson: v.optional(v.string()),
      guildId: v.optional(v.string()),
      updatedAt: v.number(),
      createdAt: v.optional(v.number()),
      scope: v.union(v.literal("platform"), v.literal("guild")),
    }),
  ),
  handler: async (ctx, args) => {
    const platformRows = await ctx.db
      .query("platformMessageTemplates")
      .withIndex("by_kind_and_updatedAt", (q: any) => q.eq("kind", args.kind))
      .order("desc")
      .collect();

    const results = platformRows.map((row) =>
      normalizeTemplateRow(row, "platform"),
    );

    if (args.guildId) {
      const guildRows = await ctx.db
        .query("platformMessageTemplates")
        .withIndex("by_guildId_and_kind_and_updatedAt", (q: any) =>
          q.eq("guildId", args.guildId).eq("kind", args.kind),
        )
        .order("desc")
        .collect();
      results.unshift(...guildRows.map((row) => normalizeTemplateRow(row, "guild")));
    }

    return results;
  },
});

export const getTemplateById = query({
  args: {
    templateId: v.id("platformMessageTemplates"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("platformMessageTemplates"),
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
    if (!row) return null;
    return {
      _id: row._id,
      name: typeof row.name === "string" ? row.name : undefined,
      description: typeof row.description === "string" ? row.description : undefined,
      kind: String(row.kind ?? ""),
      template: String(row.template ?? ""),
      templateJson: typeof row.templateJson === "string" ? row.templateJson : undefined,
      guildId: typeof row.guildId === "string" ? row.guildId : undefined,
      updatedAt: Number(row.updatedAt ?? 0),
      createdAt: typeof row.createdAt === "number" ? row.createdAt : undefined,
    };
  },
});

const resolveTemplateContent = async (ctx: any, args: any) => {
  if (args.templateId) {
    const row = await ctx.db.get(args.templateId);
    if (row) {
      return String(row.template ?? "");
    }
  }

  if (args.guildId) {
    const guildRow = await ctx.db
      .query("platformMessageTemplates")
      .withIndex("by_guildId_and_kind_and_updatedAt", (q: any) =>
        q.eq("guildId", args.guildId).eq("kind", "tradeidea"),
      )
      .order("desc")
      .first();
    if (guildRow?.template) {
      return String(guildRow.template);
    }
  }

  const platformRow = await ctx.db
    .query("platformMessageTemplates")
    .withIndex("by_kind_and_updatedAt", (q: any) => q.eq("kind", "tradeidea"))
    .order("desc")
    .first();

  if (platformRow?.template) {
    return String(platformRow.template);
  }

  return defaultTradeIdeaTemplate;
};

export const renderTradeIdeaMessage = query({
  args: {
    guildId: v.optional(v.string()),
    templateId: v.optional(v.id("platformMessageTemplates")),
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
    const template = await resolveTemplateContent(ctx, {
      guildId: args.guildId ?? undefined,
      templateId: args.templateId,
    });

    const avg =
      typeof args.avgEntryPrice === "number"
        ? String(args.avgEntryPrice)
        : null;
    const realized =
      typeof args.realizedPnl === "number" ? String(args.realizedPnl) : null;
    const fees = typeof args.fees === "number" ? String(args.fees) : null;
    const openedAt =
      typeof args.openedAt === "number" ? new Date(args.openedAt).toISOString() : null;
    const closedAt =
      typeof args.closedAt === "number" ? new Date(args.closedAt).toISOString() : null;

    const content = applyTemplate(template, {
      symbol: args.symbol,
      direction: args.direction,
      status: args.status,
      netQty: String(args.netQty),
      avgEntryPrice: avg ? ` (${avg})` : "",
      realizedPnl: formatOptionalLine("Realized PnL", realized),
      fees: formatOptionalLine("Fees", fees),
      openedAt: formatOptionalLine("Opened", openedAt),
      closedAt: formatOptionalLine("Closed", closedAt),
    });

    return { content };
  },
});

export const getTemplate = query({
  args: {
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
      .query("platformMessageTemplates")
      .withIndex("by_guildId_and_kind_and_updatedAt", (q: any) =>
        q.eq("guildId", guildId).eq("kind", args.kind),
      )
      .order("desc")
      .first();

    if (!templateRow && guildId) {
      templateRow = await ctx.db
        .query("platformMessageTemplates")
        .withIndex("by_kind_and_updatedAt", (q: any) =>
          q.eq("kind", args.kind),
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
