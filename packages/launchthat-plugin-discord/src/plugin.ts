import type { PluginDefinition } from "launchthat-plugin-core";

export const PLUGIN_ID = "discord" as const;
export type PluginId = typeof PLUGIN_ID;

export interface CreateDiscordPluginDefinitionOptions {}

const defaultOptions: CreateDiscordPluginDefinitionOptions = {};

export const createDiscordPluginDefinition = (
  _options: CreateDiscordPluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Discord",
  description: "Discord bot integration (roles, rules, and org settings).",
  longDescription:
    "Adds per-organization Discord bot settings and rule-based role sync on purchases and tags.",
  features: ["Org bot settings", "Product role rules", "Role sync jobs"],
  postTypes: [],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
  adminMenus: [
    {
      label: "Discord",
      slug: "discord",
      icon: "MessageCircle",
      position: 45,
      group: "integrations",
    },
  ],
  // Settings UI is implemented in the Portal app (org-scoped) rather than in this package,
  // since bot credentials must be scoped per organization.
});

export const discordPlugin: PluginDefinition = createDiscordPluginDefinition();