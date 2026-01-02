import type { PluginDefinition } from "./types";
import { NotificationSettingsTab } from "~/components/notifications/NotificationSettingsTab";
import { FRONTEND_ACCOUNT_TABS_FILTER } from "~/lib/plugins/hookSlots";

interface AccountTabsFilterContext {
  organizationId?: string | null;
  enabledPluginIds: string[];
}

export const portalNotificationsPlugin: PluginDefinition = {
  id: "notifications",
  name: "Notifications",
  description: "In-app notification preferences for your account.",
  longDescription:
    "Lets users control notification preferences (currently in-app notifications only).",
  features: ["Account notifications settings"],
  postTypes: [],
  activation: {
    optionKey: "plugin.notifications.enabled",
    optionType: "site",
    defaultEnabled: true,
  },
  hooks: {
    filters: [
      {
        hook: FRONTEND_ACCOUNT_TABS_FILTER,
        callback: (value: unknown, ctx: unknown) => {
          const tabs = Array.isArray(value) ? (value as unknown[]) : [];
          const debugPlugins =
            typeof ctx === "object" &&
            ctx !== null &&
            "debugPlugins" in ctx &&
            (ctx as { debugPlugins?: unknown }).debugPlugins === true;
          const enabledPluginIds = Array.isArray(
            (ctx as Partial<AccountTabsFilterContext> | null | undefined)
              ?.enabledPluginIds,
          )
            ? ((ctx as Partial<AccountTabsFilterContext>).enabledPluginIds ??
              [])
            : [];

          if (debugPlugins) {
            console.log("[notifications][debugPlugins=1] filter invoked", {
              enabledPluginIds,
              tabsCount: tabs.length,
            });
          }

          if (!enabledPluginIds.includes("notifications")) {
            return tabs;
          }

          const next = [
            ...tabs,
            {
              id: "notifications",
              label: "Notifications",
              value: "notifications",
              order: 30,
              render: () => <NotificationSettingsTab />,
            },
          ];

          if (debugPlugins) {
            console.log("[notifications][debugPlugins=1] injected tab", {
              nextCount: next.length,
            });
          }

          return next;
        },
        priority: 10,
        acceptedArgs: 2,
      },
    ],
  },
};
