import { v } from "convex/values";
import { query } from "../server";

export const getPlatformConfigSecrets = query({
  args: {},
  returns: v.union(
    v.object({
      enabled: v.boolean(),
      botMode: v.union(v.literal("global"), v.literal("custom")),
      customClientId: v.optional(v.string()),
      customClientSecretEncrypted: v.optional(v.string()),
      customBotTokenEncrypted: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("platformConfigs").collect();
    const config = rows
      .slice()
      .sort((a: any, b: any) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
    if (!config) return null;
    return {
      enabled: config.enabled,
      botMode: config.botMode === "custom" ? ("custom" as const) : ("global" as const),
      customClientId: (config as any).customClientId,
      customClientSecretEncrypted: (config as any).customClientSecretEncrypted,
      customBotTokenEncrypted: (config as any).customBotTokenEncrypted,
    };
  },
});
