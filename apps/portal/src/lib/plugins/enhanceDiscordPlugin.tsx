import React, { Suspense } from "react";

import type { PluginDefinition } from "./types";
import { ADMIN_ECOMMERCE_PRODUCT_DETAILS_SECTIONS_FILTER } from "./hookSlots";
import { DiscordPluginSettingsPage } from "~/components/discord/DiscordPluginSettingsPage";
import { DiscordServerConfigPage } from "~/components/discord/DiscordServerConfigPage";

const DiscordProductRoleRulesSection = React.lazy(async () => {
  const mod = await import("../../components/discord/DiscordProductRoleRulesSection");
  return { default: mod.DiscordProductRoleRulesSection };
});

export const enhanceDiscordPluginDefinition = (
  base: PluginDefinition,
): PluginDefinition => {
  const baseBootstrap = base.admin?.bootstrap;
  const baseSettingsPages = Array.isArray(base.settingsPages)
    ? base.settingsPages
    : [];

  return {
    ...base,
    settingsPages: [
      // Keep any existing plugin pages (if added later).
      ...baseSettingsPages,
      // Ensure a settings page exists so Discord shows up as a top-level plugin item in the admin sidebar.
      ...(baseSettingsPages.some((p) => p.slug === "settings")
        ? []
        : [
            {
              id: "discord.settings",
              slug: "settings",
              label: "Settings",
              icon: "Settings",
              order: 1000,
              render: (props) => <DiscordPluginSettingsPage {...props} />,
            },
          ]),
      ...(baseSettingsPages.some((p) => p.slug === "serverconfig")
        ? []
        : [
            {
              id: "discord.serverconfig",
              slug: "serverconfig",
              label: "Servers",
              icon: "Server",
              order: 1001,
              render: (props) => <DiscordServerConfigPage {...props} />,
            },
          ]),
    ],
    admin: {
      ...(base.admin ?? {}),
      bootstrap: () => {
        if (typeof baseBootstrap === "function") {
          baseBootstrap();
        }

        const g = globalThis as unknown as {
          __portal_discord_ecommerce_product_sections_registered?: boolean;
        };
        if (g.__portal_discord_ecommerce_product_sections_registered) {
          return;
        }
        g.__portal_discord_ecommerce_product_sections_registered = true;

        void import("@acme/admin-runtime/hooks").then((hooks) => {
          if (typeof hooks.addFilter !== "function") return;

          hooks.addFilter(
            String(ADMIN_ECOMMERCE_PRODUCT_DETAILS_SECTIONS_FILTER),
            (value: unknown, ctx: unknown) => {
              const list = Array.isArray(value)
                ? ([...(value as React.ReactNode[])] as React.ReactNode[])
                : ([] as React.ReactNode[]);

              const c = (ctx ?? {}) as {
                postId?: string | null;
                organizationId?: string | null;
                canEdit?: boolean;
              };
              const postId = typeof c.postId === "string" ? c.postId : null;
              const organizationId =
                typeof c.organizationId === "string" ? c.organizationId : null;
              if (!postId || !organizationId) {
                return list;
              }

              list.push(
                <Suspense key="discord:product-role-rules" fallback={null}>
                  <DiscordProductRoleRulesSection
                    organizationId={organizationId}
                    productId={postId}
                    canEdit={Boolean(c.canEdit)}
                  />
                </Suspense>,
              );

              return list;
            },
            10,
            2,
          );
        });
      },
    },
  };
};


