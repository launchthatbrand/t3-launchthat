import type { PluginDefinition } from "launchthat-plugin-core";

export const PLUGIN_ID = "pricedata" as const;
export type PluginId = typeof PLUGIN_ID;

export interface CreatePriceDataPluginDefinitionOptions {}

const defaultOptions: CreatePriceDataPluginDefinitionOptions = {};

export const createPriceDataPluginDefinition = (
  _options: CreatePriceDataPluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Price Data Cache",
  description:
    "Provider-agnostic broker price data cache (candles) for charts and strategy tooling.",
  longDescription:
    "Stores normalized OHLCV bars keyed by source (broker/server) + instrument + resolution, enabling shared cached charts across users.",
  features: [
    "Source registry (broker/server)",
    "Instrument mapping cache",
    "OHLCV bar chunk cache",
  ],
  postTypes: [],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
});

export const priceDataPlugin: PluginDefinition = createPriceDataPluginDefinition();

