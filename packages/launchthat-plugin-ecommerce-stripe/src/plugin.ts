import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";
import { registerPaymentMethod } from "launchthat-plugin-ecommerce";

import { StripeSettingsPage } from "./admin/StripeSettingsPage";

export const PLUGIN_ID = "ecommerce-stripe" as const;
export type PluginId = typeof PLUGIN_ID;

export type CreateEcommerceStripePluginDefinitionOptions = Record<
  string,
  never
>;

const defaultOptions: CreateEcommerceStripePluginDefinitionOptions = {};

registerPaymentMethod({
  id: "stripe",
  label: "Stripe",
  description: "Cards and wallets via Stripe.",
  config: {
    pluginActiveOptionKey: `plugin_${PLUGIN_ID}_enabled`,
    paymentEnabledOptionKey: `plugin.ecommerce.paymentMethods.stripe.enabled`,
    configOptionKey: "plugin.ecommerce.stripe.settings",
  },
  renderSettings: (props) => createElement(StripeSettingsPage, props as any),
  isConfigured: (configValue) => {
    const v =
      configValue &&
      typeof configValue === "object" &&
      !Array.isArray(configValue)
        ? (configValue as Record<string, unknown>)
        : {};
    const publishableKey =
      typeof v.publishableKey === "string" ? v.publishableKey.trim() : "";
    const secretKey = typeof v.secretKey === "string" ? v.secretKey.trim() : "";
    return publishableKey.length > 0 && secretKey.length > 0;
  },
});

export const createEcommerceStripePluginDefinition = (
  _options: CreateEcommerceStripePluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Ecommerce Stripe",
  description: "Stripe payment processor integration for Ecommerce",
  longDescription: "Stripe payment processor integration for Ecommerce",
  features: [],
  postTypes: [],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
});

export const ecommerceStripePlugin: PluginDefinition =
  createEcommerceStripePluginDefinition();
