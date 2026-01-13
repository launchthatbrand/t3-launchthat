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
  description: "Trader Launchpad integration.",
  longDescription: "Adds per-organization Trader Launchpad integration.",
  features: ["Trader Launchpad integration"],
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
  // Settings UI is implemented in the Portal app (org-scoped) rather than in this package,
  // since bot credentials must be scoped per organization.
});

export const traderlaunchpadPlugin: PluginDefinition =
  createTraderLaunchpadPluginDefinition();
