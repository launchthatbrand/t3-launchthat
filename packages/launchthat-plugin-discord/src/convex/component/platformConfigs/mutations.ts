import { v } from "convex/values";
import { mutation } from "../server";

export const upsertPlatformConfig = mutation({
  args: {
    enabled: v.boolean(),
    botMode: v.union(v.literal("global"), v.literal("custom")),
    customClientId: v.optional(v.string()),
    customClientSecretEncrypted: v.optional(v.string()),
    customBotTokenEncrypted: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const looksEncrypted = (value: string): boolean => value.startsWith("enc_v1:");

    if (args.botMode === "custom") {
      const clientId = (args.customClientId ?? "").trim();
      const clientSecretEncrypted = args.customClientSecretEncrypted ?? "";
      const botTokenEncrypted = args.customBotTokenEncrypted ?? "";

      if (!clientId) {
        throw new Error("customClientId is required when botMode=custom");
      }
      if (!looksEncrypted(clientSecretEncrypted)) {
        throw new Error(
          "customClientSecretEncrypted must be encrypted (enc_v1:...) when botMode=custom",
        );
      }
      if (!looksEncrypted(botTokenEncrypted)) {
        throw new Error(
          "customBotTokenEncrypted must be encrypted (enc_v1:...) when botMode=custom",
        );
      }
    }

    const existing = await ctx.db.query("platformConfigs").collect();
    const row = existing[0];
    const patch = {
      enabled: args.enabled,
      botMode: args.botMode,
      customClientId:
        typeof args.customClientId === "string"
          ? args.customClientId.trim()
          : undefined,
      customClientSecretEncrypted: args.customClientSecretEncrypted,
      customBotTokenEncrypted: args.customBotTokenEncrypted,
      connectedAt: row?.connectedAt ?? now,
      lastValidatedAt: now,
      lastError: undefined,
    };

    if (row) {
      await ctx.db.patch(row._id, patch);
      return null;
    }

    await ctx.db.insert("platformConfigs", patch);
    return null;
  },
});
