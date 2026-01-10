import { v } from "convex/values";
import { mutation } from "../server";
import { upsertGuildConnection } from "../guildConnections/mutations";

export const upsertOrgConfig = mutation({
  args: {
    organizationId: v.string(),
    enabled: v.boolean(),
    clientId: v.string(),
    clientSecretEncrypted: v.string(),
    botTokenEncrypted: v.string(),
    guildId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    const looksEncrypted = (value: string): boolean =>
      value.startsWith("enc_v1:");
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

    const patch = {
      enabled: args.enabled,
      // Legacy fields (kept for migration/back-compat)
      clientId: args.clientId.trim(),
      clientSecretEncrypted: args.clientSecretEncrypted,
      botTokenEncrypted: args.botTokenEncrypted,
      guildId,

      // New multi-guild + bot mode fields
      botMode: "custom" as const,
      customClientId: args.clientId.trim(),
      customClientSecretEncrypted: args.clientSecretEncrypted,
      customBotTokenEncrypted: args.botTokenEncrypted,
      connectedAt: now,
      lastValidatedAt: now,
      lastError: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      if (guildId) {
        await ctx.runMutation(upsertGuildConnection as any, {
          organizationId: args.organizationId,
          guildId,
          guildName: undefined,
          botModeAtConnect: "custom",
          connectedAt: now,
        });
      }
      return null;
    }

    await ctx.db.insert("orgConfigs", {
      organizationId: args.organizationId,
      ...patch,
    });
    if (guildId) {
      await ctx.runMutation(upsertGuildConnection as any, {
        organizationId: args.organizationId,
        guildId,
        guildName: undefined,
        botModeAtConnect: "custom",
        connectedAt: now,
      });
    }
    return null;
  },
});

/**
 * V2 org config upsert: supports botMode and does NOT require a single guildId.
 * Guild connections are managed separately in `guildConnections`.
 */
export const upsertOrgConfigV2 = mutation({
  args: {
    organizationId: v.string(),
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

    const existing = await ctx.db
      .query("orgConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    const patch = {
      enabled: args.enabled,
      botMode: args.botMode,
      customClientId:
        typeof args.customClientId === "string"
          ? args.customClientId.trim()
          : undefined,
      customClientSecretEncrypted: args.customClientSecretEncrypted,
      customBotTokenEncrypted: args.customBotTokenEncrypted,
      connectedAt: existing?.connectedAt ?? now,
      lastValidatedAt: now,
      lastError: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return null;
    }

    await ctx.db.insert("orgConfigs", {
      organizationId: args.organizationId,
      ...patch,
    });
    return null;
  },
});


