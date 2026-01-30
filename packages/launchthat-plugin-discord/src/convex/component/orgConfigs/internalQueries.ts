import { v } from "convex/values";
import { query } from "../server";

/**
 * Server-only access to encrypted secrets. In the parent app, component functions are not
 * exposed to clients directly (they are referenced via `components.*`), so this is safe.
 */
export const getOrgConfigSecrets = query({
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
      // Legacy fields (may be absent after migration)
      clientId: v.optional(v.string()),
      clientSecretEncrypted: v.optional(v.string()),
      botTokenEncrypted: v.optional(v.string()),
      guildId: v.optional(v.string()),
      // Custom bot creds (only when botMode=custom)
      customClientId: v.optional(v.string()),
      customClientSecretEncrypted: v.optional(v.string()),
      customBotTokenEncrypted: v.optional(v.string()),
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
    return {
      scope: config.scope === "platform" ? ("platform" as const) : ("org" as const),
      organizationId: config.organizationId,
      enabled: config.enabled,
      botMode: config.botMode === "custom" ? ("custom" as const) : ("global" as const),
      clientId: config.clientId,
      clientSecretEncrypted: config.clientSecretEncrypted,
      botTokenEncrypted: config.botTokenEncrypted,
      guildId: config.guildId,
      customClientId: (config as any).customClientId,
      customClientSecretEncrypted: (config as any).customClientSecretEncrypted,
      customBotTokenEncrypted: (config as any).customBotTokenEncrypted,
    };
  },
});


