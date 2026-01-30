import { v } from "convex/values";

import { internalMutation } from "../server";

/**
 * Migrate legacy single-guild config to the multi-guild model.
 *
 * - If `orgConfigs.guildId` exists, ensure a `guildConnections` row exists for it.
 * - If `orgConfigs.botMode`/custom fields are missing (legacy), set botMode=custom and map legacy secrets.
 *
 * Safe to call repeatedly (idempotent).
 */
export const migrateLegacyOrgConfig = internalMutation({
  args: { organizationId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("orgConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (!config) return null;

    const legacyGuildId =
      typeof (config as any).guildId === "string" ? ((config as any).guildId as string).trim() : "";

    // Ensure botMode/custom fields exist (legacy docs won't have them).
    const botMode =
      (config as any).botMode === "global" || (config as any).botMode === "custom"
        ? ((config as any).botMode as "global" | "custom")
        : ("custom" as const);

    const patch: Record<string, unknown> = {};

    if ((config as any).botMode !== botMode) {
      patch.botMode = botMode;
    }

    // Map legacy custom creds if present and custom fields not set.
    if (botMode === "custom") {
      if (!(config as any).customClientId && typeof (config as any).clientId === "string") {
        patch.customClientId = (config as any).clientId;
      }
      if (
        !(config as any).customClientSecretEncrypted &&
        typeof (config as any).clientSecretEncrypted === "string"
      ) {
        patch.customClientSecretEncrypted = (config as any).clientSecretEncrypted;
      }
      if (
        !(config as any).customBotTokenEncrypted &&
        typeof (config as any).botTokenEncrypted === "string"
      ) {
        patch.customBotTokenEncrypted = (config as any).botTokenEncrypted;
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(config._id, patch);
    }

    if (!legacyGuildId) return null;

    const existingConn = await ctx.db
      .query("guildConnections")
      .withIndex("by_organizationId_and_guildId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("guildId", legacyGuildId),
      )
      .unique();

    if (!existingConn) {
      await ctx.db.insert("guildConnections", {
        scope: "org",
        organizationId: args.organizationId,
        guildId: legacyGuildId,
        guildName: undefined,
        botModeAtConnect: botMode,
        connectedAt: typeof (config as any).connectedAt === "number" ? (config as any).connectedAt : Date.now(),
      });
    }

    return null;
  },
});



