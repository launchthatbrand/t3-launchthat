import React from "react";

import type { PluginDefinition } from "./types";
import { TraderLaunchpadPluginSettingsPage } from "~/components/traderlaunchpad/TraderLaunchpadPluginSettingsPage";
import { TraderLaunchpadTradeIdeasAdminPage } from "~/components/traderlaunchpad/TraderLaunchpadTradeIdeasAdminPage";
import { TraderLaunchpadAccountTab } from "~/components/traderlaunchpad/TraderLaunchpadAccountTab";
import { FRONTEND_ACCOUNT_TABS_FILTER } from "~/lib/plugins/hookSlots";

export const enhanceTraderlaunchpadPluginDefinition = (
  base: PluginDefinition,
): PluginDefinition => {
  const baseSettingsPages = Array.isArray(base.settingsPages)
    ? base.settingsPages
    : [];

  const baseHooksFilters = Array.isArray(base.hooks?.filters)
    ? base.hooks?.filters
    : [];

  return {
    ...base,
    settingsPages: [
      ...baseSettingsPages,
      ...(baseSettingsPages.some((p) => p.slug === "settings")
        ? []
        : [
            {
              id: "traderlaunchpad.settings",
              slug: "settings",
              label: "Settings",
              icon: "Settings",
              order: 1000,
              render: (props) => <TraderLaunchpadPluginSettingsPage {...props} />,
            },
          ]),
      ...(baseSettingsPages.some((p) => p.slug === "tradeideas")
        ? []
        : [
            {
              id: "traderlaunchpad.tradeideas",
              slug: "tradeideas",
              label: "Trade Ideas",
              icon: "TrendingUp",
              order: 1001,
              render: (props) => (
                <TraderLaunchpadTradeIdeasAdminPage {...props} />
              ),
            },
          ]),
    ],
    hooks: {
      ...(base.hooks ?? {}),
      filters: [
        ...baseHooksFilters,
        {
          hook: FRONTEND_ACCOUNT_TABS_FILTER,
          callback: (value: unknown, ctx: unknown) => {
            const tabs = Array.isArray(value) ? (value as unknown[]) : [];
            const enabledPluginIds = Array.isArray(
              (ctx as { enabledPluginIds?: unknown } | null | undefined)
                ?.enabledPluginIds,
            )
              ? (((ctx as any).enabledPluginIds ?? []) as string[])
              : [];

            if (!enabledPluginIds.includes(base.id)) return tabs;

            return [
              ...tabs,
              {
                id: "traderlaunchpad",
                label: "Trading",
                value: "traderlaunchpad",
                order: 35,
                render: () => <TraderLaunchpadAccountTab />,
              },
            ];
          },
          priority: 10,
          acceptedArgs: 2,
        },
      ],
    },
  };
};


