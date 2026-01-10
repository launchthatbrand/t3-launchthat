import { v } from "convex/values";

import { query } from "../server";

export const getOrgConfig = query({
  args: { organizationId: v.string() },
  returns: v.union(
    v.object({
      organizationId: v.string(),
      enabled: v.boolean(),
      botMode: v.union(v.literal("global"), v.literal("custom")),
      customClientId: v.optional(v.string()),
      connectedAt: v.number(),
      lastValidatedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      // Redactions (never return secrets)
      hasClientSecret: v.boolean(),
      hasBotToken: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("orgConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();
    if (!config) return null;

    const botMode =
      config.botMode === "custom" ? ("custom" as const) : ("global" as const);

    return {
      organizationId: config.organizationId,
      enabled: config.enabled,
      botMode,
      customClientId:
        typeof (config as any).customClientId === "string"
          ? ((config as any).customClientId as string)
          : undefined,
      connectedAt: config.connectedAt,
      lastValidatedAt: config.lastValidatedAt,
      lastError: config.lastError,
      hasClientSecret: Boolean((config as any).customClientSecretEncrypted ?? (config as any).clientSecretEncrypted),
      hasBotToken: Boolean((config as any).customBotTokenEncrypted ?? (config as any).botTokenEncrypted),
    };
  },
});
