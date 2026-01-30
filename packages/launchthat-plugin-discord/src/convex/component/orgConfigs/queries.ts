import { v } from "convex/values";

import { query } from "../server";

export const getOrgConfig = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      scope: v.union(v.literal("org"), v.literal("platform")),
      organizationId: v.optional(v.string()),
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
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return null;

    const config = await ctx.db
      .query("orgConfigs")
      .withIndex("by_scope_and_organizationId", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId),
      )
      .unique();
    if (!config) return null;

    const botMode =
      config.botMode === "custom" ? ("custom" as const) : ("global" as const);

    return {
      scope: config.scope === "platform" ? ("platform" as const) : ("org" as const),
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
