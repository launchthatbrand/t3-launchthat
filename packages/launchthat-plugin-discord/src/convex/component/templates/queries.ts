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

export const renderTradeIdeaMessage = query({
  args: {
    organizationId: v.string(),
    guildId: v.optional(v.string()),
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
    const guildId = args.guildId ?? undefined;
    let templateRow = await ctx.db
      .query("messageTemplates")
      .withIndex("by_organizationId_and_guildId_and_kind", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("guildId", guildId)
          .eq("kind", "tradeidea"),
      )
      .unique();

    if (!templateRow && guildId) {
      templateRow = await ctx.db
        .query("messageTemplates")
        .withIndex("by_organizationId_and_guildId_and_kind", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("guildId", undefined)
            .eq("kind", "tradeidea"),
        )
        .unique();
    }

    const template =
      typeof templateRow?.template === "string"
        ? templateRow.template
        : defaultTradeIdeaTemplate;

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
    kind: v.union(v.literal("tradeidea")),
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
      .withIndex("by_organizationId_and_guildId_and_kind", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("guildId", guildId)
          .eq("kind", args.kind),
      )
      .unique();

    if (!templateRow && guildId) {
      templateRow = await ctx.db
        .query("messageTemplates")
        .withIndex("by_organizationId_and_guildId_and_kind", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("guildId", undefined)
            .eq("kind", args.kind),
        )
        .unique();
    }

    if (!templateRow) return null;

    return {
      template: templateRow.template,
      updatedAt: templateRow.updatedAt,
    };
  },
});
