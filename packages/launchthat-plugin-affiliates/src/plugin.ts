import type { PluginDefinition } from "launchthat-plugin-core"; export const
PLUGIN_ID = "affiliates" as const; export type PluginId = typeof PLUGIN_ID; export
type CreatePluginDefinitionOptions = { // Extend this options type as your
plugin grows. }; const defaultOptions: CreatePluginDefinitionOptions = {};
export const createAffiliatesPluginDefinition = ( _options:
CreatePluginDefinitionOptions = defaultOptions, ): PluginDefinition => ({ id:
PLUGIN_ID, name: "Affiliates", description: "",
longDescription: "", features: [], postTypes: [], activation: {
optionKey: `plugin_${PLUGIN_ID}_enabled`, optionType: "site", defaultEnabled:
false, }, }); export const
affiliatesPlugin: PluginDefinition = createAffiliatesPluginDefinition();