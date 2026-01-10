import { v } from "convex/values";
import { internalMutation } from "../server";
import { upsertGuildConnection } from "../guildConnections/mutations";

export const upsertOrgConfigInternal = internalMutation({
  args: {
    organizationId: v.string(),
    enabled: v.boolean(),
    clientId: v.string(),
    clientSecretEncrypted: v.string(),
    botTokenEncrypted: v.string(),
    guildId: v.string(),
    connectedAt: v.number(),
    lastValidatedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const looksEncrypted = (value: string): boolean => value.startsWith("enc_v1:");
    if (!looksEncrypted(args.clientSecretEncrypted)) {
      throw new Error("clientSecretEncrypted must be encrypted (enc_v1:...)");
    }
    if (!looksEncrypted(args.botTokenEncrypted)) {
      throw new Error("botTokenEncrypted must be encrypted (enc_v1:...)");
    }
    const guildId = args.guildId.trim();
    const existing = await ctx.db
      .query("orgConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        clientId: args.clientId,
        clientSecretEncrypted: args.clientSecretEncrypted,
        botTokenEncrypted: args.botTokenEncrypted,
        guildId,
        botMode: "custom" as const,
        customClientId: args.clientId,
        customClientSecretEncrypted: args.clientSecretEncrypted,
        customBotTokenEncrypted: args.botTokenEncrypted,
        connectedAt: args.connectedAt,
        lastValidatedAt: args.lastValidatedAt,
        lastError: args.lastError,
      });
      if (guildId) {
        await ctx.runMutation(upsertGuildConnection as any, {
          organizationId: args.organizationId,
          guildId,
          guildName: undefined,
          botModeAtConnect: "custom",
          connectedAt: args.connectedAt,
        });
      }
      return null;
    }

    await ctx.db.insert("orgConfigs", {
      organizationId: args.organizationId,
      enabled: args.enabled,
      clientId: args.clientId,
      clientSecretEncrypted: args.clientSecretEncrypted,
      botTokenEncrypted: args.botTokenEncrypted,
      guildId,
      botMode: "custom" as const,
      customClientId: args.clientId,
      customClientSecretEncrypted: args.clientSecretEncrypted,
      customBotTokenEncrypted: args.botTokenEncrypted,
      connectedAt: args.connectedAt,
      lastValidatedAt: args.lastValidatedAt,
      lastError: args.lastError,
    });
    if (guildId) {
      await ctx.runMutation(upsertGuildConnection as any, {
        organizationId: args.organizationId,
        guildId,
        guildName: undefined,
        botModeAtConnect: "custom",
        connectedAt: args.connectedAt,
      });
    }
    return null;
  },
});


