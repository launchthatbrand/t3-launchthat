import { v } from "convex/values";

import { mutation } from "../server";

const norm = (s: unknown): string => (typeof s === "string" ? s.trim() : "");

const computeNextRunAt = (args: {
  now: number;
  trigger: { type: "schedule" | "event"; config: unknown };
}): number | null => {
  if (args.trigger.type !== "schedule") return null;
  const cfg = args.trigger.config as any;
  const kind = typeof cfg?.kind === "string" ? cfg.kind : "interval";
  if (kind !== "interval") return null;
  const everyMinutesRaw = typeof cfg?.everyMinutes === "number" ? cfg.everyMinutes : 60;
  const everyMinutes = Math.max(1, Math.min(7 * 24 * 60, Math.floor(everyMinutesRaw)));
  const stepMs = everyMinutes * 60_000;
  const next = Math.floor((args.now + stepMs) / stepMs) * stepMs;
  return Number.isFinite(next) ? next : null;
};

export const createAutomation = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    name: v.string(),
    enabled: v.boolean(),
    trigger: v.object({
      type: v.union(v.literal("schedule"), v.literal("event")),
      config: v.any(),
    }),
    conditions: v.optional(v.any()),
    action: v.object({
      type: v.literal("send_message"),
      config: v.any(),
    }),
  },
  returns: v.id("discordAutomations"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const organizationId = norm(args.organizationId);
    const guildId = norm(args.guildId);
    const name = norm(args.name) || "Untitled automation";

    if (!organizationId) throw new Error("Missing organizationId");
    if (!guildId) throw new Error("Missing guildId");

    const nextRunAt = args.enabled ? computeNextRunAt({ now, trigger: args.trigger }) : null;

    return await ctx.db.insert("discordAutomations", {
      organizationId,
      guildId,
      name,
      enabled: Boolean(args.enabled),
      trigger: args.trigger,
      conditions: args.conditions,
      action: args.action,
      state: args.enabled
        ? {
            nextRunAt: typeof nextRunAt === "number" ? nextRunAt : undefined,
          }
        : undefined,
      nextRunAt: typeof nextRunAt === "number" ? nextRunAt : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAutomation = mutation({
  args: {
    organizationId: v.string(),
    automationId: v.id("discordAutomations"),
    name: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    trigger: v.optional(
      v.object({
        type: v.union(v.literal("schedule"), v.literal("event")),
        config: v.any(),
      }),
    ),
    conditions: v.optional(v.any()),
    action: v.optional(
      v.object({
        type: v.literal("send_message"),
        config: v.any(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.automationId);
    if (!row || row.organizationId !== args.organizationId) {
      throw new Error("Automation not found");
    }

    const now = Date.now();
    const nextEnabled = typeof args.enabled === "boolean" ? args.enabled : Boolean((row as any).enabled);
    const nextTrigger =
      args.trigger ??
      ((row as any).trigger as { type: "schedule" | "event"; config: unknown });
    const nextRunAt = nextEnabled ? computeNextRunAt({ now, trigger: nextTrigger }) : null;

    await ctx.db.patch(args.automationId, {
      name: typeof args.name === "string" ? args.name : (row as any).name,
      enabled: nextEnabled,
      trigger: args.trigger ?? (row as any).trigger,
      conditions: typeof args.conditions === "undefined" ? (row as any).conditions : args.conditions,
      action: args.action ?? (row as any).action,
      state: nextEnabled
        ? {
            ...(typeof (row as any).state === "object" && (row as any).state ? (row as any).state : {}),
            nextRunAt: typeof nextRunAt === "number" ? nextRunAt : undefined,
          }
        : undefined,
      nextRunAt: typeof nextRunAt === "number" ? nextRunAt : undefined,
      updatedAt: now,
    });
    return null;
  },
});

export const deleteAutomation = mutation({
  args: {
    organizationId: v.string(),
    automationId: v.id("discordAutomations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.automationId);
    if (!row || row.organizationId !== args.organizationId) return null;
    await ctx.db.delete(args.automationId);
    return null;
  },
});

export const markAutomationRun = mutation({
  args: {
    organizationId: v.string(),
    automationId: v.id("discordAutomations"),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.automationId);
    if (!row || row.organizationId !== args.organizationId) {
      throw new Error("Automation not found");
    }

    const prevState = (row as any).state;
    const state =
      prevState && typeof prevState === "object"
        ? {
            ...prevState,
            lastRunAt: typeof args.lastRunAt === "number" ? args.lastRunAt : prevState.lastRunAt,
            cursor: typeof args.cursor === "string" ? args.cursor : prevState.cursor,
            nextRunAt: typeof args.nextRunAt === "number" ? args.nextRunAt : prevState.nextRunAt,
          }
        : {
            lastRunAt: typeof args.lastRunAt === "number" ? args.lastRunAt : undefined,
            cursor: typeof args.cursor === "string" ? args.cursor : undefined,
            nextRunAt: typeof args.nextRunAt === "number" ? args.nextRunAt : undefined,
          };

    await ctx.db.patch(args.automationId, {
      state,
      nextRunAt: typeof args.nextRunAt === "number" ? args.nextRunAt : (row as any).nextRunAt,
      updatedAt: Date.now(),
    });
    return null;
  },
});

