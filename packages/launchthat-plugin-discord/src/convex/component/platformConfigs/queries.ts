import { query } from "../server";
import { v } from "convex/values";

export const getPlatformConfig = query({
  args: {},
  returns: v.union(
    v.object({
      enabled: v.boolean(),
      botMode: v.union(v.literal("global"), v.literal("custom")),
      customClientId: v.optional(v.string()),
      connectedAt: v.number(),
      lastValidatedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      hasClientSecret: v.boolean(),
      hasBotToken: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const configs = await ctx.db.query("platformConfigs").collect();
    const config = configs
      .slice()
      .sort((a: any, b: any) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
    if (!config) return null;

    const botMode =
      config.botMode === "custom" ? ("custom" as const) : ("global" as const);

    return {
      enabled: config.enabled,
      botMode,
      customClientId:
        typeof (config as any).customClientId === "string"
          ? ((config as any).customClientId as string)
          : undefined,
      connectedAt: config.connectedAt,
      lastValidatedAt: config.lastValidatedAt,
      lastError: config.lastError,
      hasClientSecret: Boolean(
        (config as any).customClientSecretEncrypted,
      ),
      hasBotToken: Boolean((config as any).customBotTokenEncrypted),
    };
  },
});
