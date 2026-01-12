import type { PluginDefinition } from "launchthat-plugin-core";

export const PLUGIN_ID = "logs" as const;

export type PluginId = typeof PLUGIN_ID;

export type CreatePluginDefinitionOptions = Record<string, never>;

const defaultOptions: CreatePluginDefinitionOptions = {};

export const createLogsPluginDefinition = (
  _options: CreatePluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Logs",
  description: "Unified organization-scoped logs across Portal and plugins.",
  longDescription:
    "Provides a shared, org-scoped log store and admin views for debugging and observability.",
  features: [],
  postTypes: [],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
});

export const logsPlugin: PluginDefinition = createLogsPluginDefinition();
