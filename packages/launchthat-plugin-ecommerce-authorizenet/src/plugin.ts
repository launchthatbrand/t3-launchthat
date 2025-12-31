import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";
import { registerPaymentMethod } from "launchthat-plugin-ecommerce";

import { AuthorizeNetSettingsPage } from "./admin/AuthorizeNetSettingsPage";
import { AuthorizeNetCheckoutForm } from "./frontend/AuthorizeNetCheckoutForm";

export const PLUGIN_ID = "ecommerce-authorizenet" as const;
export type PluginId = typeof PLUGIN_ID;

export type CreateEcommerceAuthorizeNetPluginDefinitionOptions = Record<
  string,
  never
>;

const defaultOptions: CreateEcommerceAuthorizeNetPluginDefinitionOptions = {};

registerPaymentMethod({
  id: "authorizenet",
  label: "Authorize.Net",
  description: "Cards via Authorize.Net.",
  config: {
    pluginActiveOptionKey: `plugin_${PLUGIN_ID}_enabled`,
    paymentEnabledOptionKey: `plugin.ecommerce.paymentMethods.authorizenet.enabled`,
    configOptionKey: "plugin.ecommerce.authorizenet.settings",
  },
  renderSettings: (props) =>
    createElement(AuthorizeNetSettingsPage, props as any),
  renderCheckoutForm: ({ configValue, onPaymentDataChange }) =>
    createElement(AuthorizeNetCheckoutForm, {
      configValue,
      onPaymentDataChange,
    }),
  isConfigured: (configValue) => {
    const v =
      configValue &&
      typeof configValue === "object" &&
      !Array.isArray(configValue)
        ? (configValue as Record<string, unknown>)
        : {};
    const apiLoginId =
      typeof v.apiLoginId === "string" ? v.apiLoginId.trim() : "";
    const clientKey = typeof v.clientKey === "string" ? v.clientKey.trim() : "";
    const transactionKey =
      typeof v.transactionKey === "string" ? v.transactionKey.trim() : "";
    return (
      apiLoginId.length > 0 && clientKey.length > 0 && transactionKey.length > 0
    );
  },
});

export const createEcommerceAuthorizeNetPluginDefinition = (
  _options: CreateEcommerceAuthorizeNetPluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Ecommerce Authorize.Net",
  description: "Authorize.Net payment processor integration for Ecommerce",
  longDescription: "Authorize.Net payment processor integration for Ecommerce",
  features: [],
  postTypes: [],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
});

export const ecommerceAuthorizenetPlugin: PluginDefinition =
  createEcommerceAuthorizeNetPluginDefinition();
