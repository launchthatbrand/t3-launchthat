export type EcommercePaymentMethodId = string;

export type EcommercePaymentMethodConfig = {
  // Option metaKey that stores whether the *payment plugin* is activated.
  // This should match the plugin definition's activation.optionKey.
  pluginActiveOptionKey: string;

  // Option metaKey that stores whether the payment method is enabled inside Ecommerce.
  paymentEnabledOptionKey: string;

  // Option metaKey that stores the payment plugin's configuration object.
  // Example: "plugin.ecommerce.stripe.settings"
  configOptionKey: string;
};

export type EcommercePaymentMethodDefinition = {
  id: EcommercePaymentMethodId;
  label: string;
  description?: string;
  config: EcommercePaymentMethodConfig;
  renderSettings?: (props: unknown) => unknown;

  // Determines if the config is complete enough to be used at checkout.
  isConfigured: (configValue: unknown) => boolean;

  // Optional checkout UI for collecting payment details (e.g. card details).
  // The returned value should be a ReactNode in practice, but is typed as unknown
  // to avoid pulling React types into the registry module.
  renderCheckoutForm?: (args: {
    organizationId?: string;
    configValue: unknown;
    onPaymentDataChange?: (paymentData: unknown | null) => void;
    testMode?: boolean;
    testPrefill?: Record<string, unknown> | null;
  }) => unknown;
};

const paymentMethodsById: Map<
  EcommercePaymentMethodId,
  EcommercePaymentMethodDefinition
> = new Map();

export const registerPaymentMethod = (
  method: EcommercePaymentMethodDefinition,
): void => {
  if (!method.id) {
    throw new Error("registerPaymentMethod: method.id is required");
  }
  if (paymentMethodsById.has(method.id)) {
    // No-op to avoid duplicate registrations in dev/hmr.
    return;
  }
  paymentMethodsById.set(method.id, method);
};

export const getPaymentMethods =
  (): Array<EcommercePaymentMethodDefinition> => {
    return Array.from(paymentMethodsById.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  };

export const getPaymentMethod = (
  id: EcommercePaymentMethodId,
): EcommercePaymentMethodDefinition | undefined => {
  return paymentMethodsById.get(id);
};
