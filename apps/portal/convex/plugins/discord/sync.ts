// @ts-nocheck
"use node";

import { v } from "convex/values";
import { resolveOrgBotToken } from "launchthat-plugin-discord/runtime/credentials";
import { discordApi } from "launchthat-plugin-discord/runtime/discordApi";

import { api, components } from "../../_generated/api";
import { internalAction } from "../../_generated/server";

const CRM_PLUGIN_ENABLED_KEY = "plugin_crm_enabled";

export const processPendingJobs = internalAction({
  args: { limit: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const keyMaterial = process.env.DISCORD_SECRETS_KEY;
    const globalBotToken = process.env.DISCORD_GLOBAL_BOT_TOKEN;

    const pending = await ctx.runQuery(
      components.launchthat_discord.syncJobs.queries.listPendingJobs as any,
      { limit: args.limit ?? 10 },
    );

    for (const job of pending ?? []) {
      const jobId = String(job._id ?? "");
      if (!jobId) continue;

      try {
        await ctx.runMutation(
          components.launchthat_discord.syncJobs.mutations.setJobStatus as any,
          { jobId, status: "processing", attempts: Number(job.attempts ?? 0) },
        );

        const organizationId = String(job.organizationId ?? "");
        const userId = String(job.userId ?? "");
        if (!organizationId || !userId) {
          throw new Error("Missing organizationId or userId");
        }

        const orgSecrets = await ctx.runQuery(
          components.launchthat_discord.orgConfigs.internalQueries
            .getOrgConfigSecrets as any,
          { organizationId },
        );
        if (!orgSecrets || !orgSecrets.enabled) {
          await ctx.runMutation(
            components.launchthat_discord.syncJobs.mutations.deleteJob as any,
            { jobId },
          );
          continue;
        }

        const guildConnections = (await ctx.runQuery(
          components.launchthat_discord.guildConnections.queries
            .listGuildConnectionsForOrg as any,
          { organizationId },
        )) as
          | Array<{ guildId: string; botModeAtConnect: "global" | "custom" }>
          | undefined;

        const legacyGuildId =
          typeof orgSecrets.guildId === "string" ? orgSecrets.guildId : "";
        const effectiveConnections =
          Array.isArray(guildConnections) && guildConnections.length > 0
            ? guildConnections
            : legacyGuildId
              ? [
                  {
                    guildId: legacyGuildId,
                    botModeAtConnect: orgSecrets.botMode ?? "global",
                  },
                ]
              : [];

        if (effectiveConnections.length === 0) {
          // Nothing to do; org has Discord enabled but no guilds connected yet.
          await ctx.runMutation(
            components.launchthat_discord.syncJobs.mutations.deleteJob as any,
            { jobId },
          );
          continue;
        }

        const link = await ctx.runQuery(
          components.launchthat_discord.userLinks.queries.getUserLink as any,
          { organizationId, userId },
        );
        if (!link?.discordUserId) {
          // Not linked yet; treat as no-op.
          await ctx.runMutation(
            components.launchthat_discord.syncJobs.mutations.deleteJob as any,
            { jobId },
          );
          continue;
        }
        const discordUserId = String(link.discordUserId);

        const payload = (job.payload ?? {}) as any;
        const purchasedProductIds: string[] = Array.isArray(
          payload.purchasedProductIds,
        )
          ? payload.purchasedProductIds
              .map((p: any) => String(p))
              .filter(Boolean)
          : [];
        const marketingTagIdsFromPayload: string[] = Array.isArray(
          payload.marketingTagIds,
        )
          ? payload.marketingTagIds.map((t: any) => String(t)).filter(Boolean)
          : [];

        // Desired roles from product rules, grouped by guildId.
        // Also support legacy rules without guildId by treating them as "*" (apply to all guilds).
        const productDesiredByGuild: Map<string, Set<string>> = new Map();
        for (const productId of purchasedProductIds) {
          const rules = await ctx.runQuery(
            components.launchthat_discord.roleRules.queries
              .listRoleRulesForProduct as any,
            { organizationId, productId },
          );
          for (const r of rules ?? []) {
            if (!r?.enabled) continue;
            const roleId = typeof r.roleId === "string" ? r.roleId.trim() : "";
            if (!roleId) continue;
            const guildId =
              typeof r.guildId === "string" && r.guildId.trim()
                ? r.guildId.trim()
                : "*";
            if (!productDesiredByGuild.has(guildId))
              productDesiredByGuild.set(guildId, new Set());
            productDesiredByGuild.get(guildId)!.add(roleId);
          }
        }

        // Desired roles from marketing tags (only if CRM plugin enabled).
        const desiredFromTagsByGuild: Map<string, Set<string>> = new Map();
        let effectiveMarketingTagIds: string[] = marketingTagIdsFromPayload;
        try {
          const option = await ctx.runQuery(api.core.options.get as any, {
            metaKey: CRM_PLUGIN_ENABLED_KEY,
            type: "site",
            orgId: /^[a-z0-9]{32}$/i.test(organizationId)
              ? organizationId
              : undefined,
          });
          const enabled = Boolean(option?.metaValue);
          if (enabled && effectiveMarketingTagIds.length === 0) {
            const tags = await ctx.runQuery(
              components.launchthat_crm.marketingTags.queries
                .getUserMarketingTags as any,
              { organizationId, userId },
            );
            const ids = Array.isArray(tags)
              ? tags
                  .map((t: any) => String(t?._id ?? t?.id ?? ""))
                  .filter(Boolean)
              : [];
            effectiveMarketingTagIds = ids;
          }
        } catch {
          // Ignore CRM lookups; tag roles are optional.
        }
        if (effectiveMarketingTagIds.length > 0) {
          const rules = await ctx.runQuery(
            components.launchthat_discord.roleRules.queries
              .listRoleRulesForMarketingTags as any,
            { organizationId, marketingTagIds: effectiveMarketingTagIds },
          );
          for (const r of rules ?? []) {
            if (!r?.enabled) continue;
            const roleId = typeof r.roleId === "string" ? r.roleId.trim() : "";
            if (!roleId) continue;
            const guildId =
              typeof r.guildId === "string" && r.guildId.trim()
                ? r.guildId.trim()
                : "*";
            if (!desiredFromTagsByGuild.has(guildId)) {
              desiredFromTagsByGuild.set(guildId, new Set());
            }
            desiredFromTagsByGuild.get(guildId)!.add(roleId);
          }
        }

        // Managed roles set (TAG-ONLY): only remove roles that are managed by marketing-tag rules, grouped by guild.
        const managedTagRoleIdsByGuild: Map<string, Set<string>> = new Map();
        const tagManagedRows = await ctx.runQuery(
          components.launchthat_discord.roleRules.queries
            .listRoleRulesForOrgKind as any,
          { organizationId, kind: "marketingTag" },
        );
        for (const row of tagManagedRows ?? []) {
          const roleId =
            typeof row?.roleId === "string" ? row.roleId.trim() : "";
          if (!roleId) continue;
          const guildId =
            typeof row?.guildId === "string" && row.guildId.trim()
              ? row.guildId.trim()
              : "*";
          if (!managedTagRoleIdsByGuild.has(guildId)) {
            managedTagRoleIdsByGuild.set(guildId, new Set());
          }
          managedTagRoleIdsByGuild.get(guildId)!.add(roleId);
        }

        for (const conn of effectiveConnections) {
          const guildId = String(conn.guildId ?? "").trim();
          if (!guildId) continue;

          const botToken = resolveOrgBotToken({
            botMode: conn.botModeAtConnect === "custom" ? "custom" : "global",
            globalBotToken: globalBotToken ?? undefined,
            secretsKey: keyMaterial ?? undefined,
            customBotTokenEncrypted: orgSecrets.customBotTokenEncrypted,
            botTokenEncrypted: orgSecrets.botTokenEncrypted,
          });

          const memberRes = await discordApi(
            "GET",
            `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
            botToken,
          );
          if (!memberRes.ok) {
            // If user isn't in this guild, just skip. (Optional: invite/join flow happens elsewhere.)
            continue;
          }

          const currentRoleIds = new Set<string>(
            Array.isArray(memberRes.json?.roles)
              ? memberRes.json.roles.map((r: any) => String(r)).filter(Boolean)
              : [],
          );

          const desiredFromProducts = new Set<string>([
            ...(productDesiredByGuild.get(guildId) ?? []),
            ...(productDesiredByGuild.get("*") ?? []),
          ]);
          const desiredFromTags = new Set<string>([
            ...(desiredFromTagsByGuild.get(guildId) ?? []),
            ...(desiredFromTagsByGuild.get("*") ?? []),
          ]);

          const desiredUnion = new Set<string>([
            ...desiredFromProducts,
            ...desiredFromTags,
          ]);

          const managedTagRoleIds = new Set<string>([
            ...(managedTagRoleIdsByGuild.get(guildId) ?? []),
            ...(managedTagRoleIdsByGuild.get("*") ?? []),
          ]);

          const toAdd = Array.from(desiredUnion).filter(
            (r) => !currentRoleIds.has(r),
          );
          const toRemove = Array.from(currentRoleIds).filter(
            (r) => managedTagRoleIds.has(r) && !desiredFromTags.has(r),
          );

          for (const roleId of toAdd) {
            const res = await discordApi(
              "PUT",
              `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
              botToken,
            );
            if (!res.ok && res.status !== 204) {
              throw new Error(
                `Discord add role failed (${res.status}): ${res.text}`,
              );
            }
          }

          for (const roleId of toRemove) {
            const res = await discordApi(
              "DELETE",
              `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
              botToken,
            );
            if (!res.ok && res.status !== 204) {
              throw new Error(
                `Discord remove role failed (${res.status}): ${res.text}`,
              );
            }
          }
        }

        await ctx.runMutation(
          components.launchthat_discord.syncJobs.mutations.deleteJob as any,
          { jobId },
        );
      } catch (err: any) {
        const attempts = Number(job.attempts ?? 0) + 1;
        await ctx.runMutation(
          components.launchthat_discord.syncJobs.mutations.setJobStatus as any,
          {
            jobId,
            status: attempts >= 5 ? "failed" : "pending",
            attempts,
            lastError: err?.message ? String(err.message) : "Unknown error",
          },
        );
      }
    }

    return null;
  },
});
