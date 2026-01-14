import type { PluginDefinition } from "launchthat-plugin-core";

export const PLUGIN_ID = "traderlaunchpad" as const;
export type PluginId = typeof PLUGIN_ID;

export interface CreateTraderLaunchpadPluginDefinitionOptions {}

const defaultOptions: CreateTraderLaunchpadPluginDefinitionOptions = {};

export const createTraderLaunchpadPluginDefinition = (
  _options: CreateTraderLaunchpadPluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Trader Launchpad",
  description: "Trading journal + TradeLocker import + Discord trade feed.",
  longDescription:
    "Adds per-user TradeLocker connections, trade idea grouping (until flat), and Discord trade feeds (mentors vs members).",
  features: [
    "Per-user TradeLocker connect",
    "Raw order/execution import",
    "Trade ideas (roundtrip)",
    "Discord trade feed",
  ],
  postTypes: [],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
  adminMenus: [
    {
      label: "Trader Launchpad",
      slug: "traderlaunchpad",
      icon: "Rocket",
      position: 45,
      group: "integrations",
    },
  ],
  // Settings UI is implemented in the Portal app rather than in this package, since it is
  // org-scoped + user-scoped and depends on portal auth/session context.
});

export const traderlaunchpadPlugin: PluginDefinition =
  createTraderLaunchpadPluginDefinition();
