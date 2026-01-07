import type {
  PluginProviderEntry,
  ProviderContext,
  ProviderSpec,
} from "launchthat-plugin-core";
import type { ReactNode } from "react";

import { pluginDefinitions } from "./definitions";

type ProviderComponent = (
  props: { children: ReactNode } & Record<string, unknown>,
) => ReactNode;

interface NormalizedProviderSpec {
  Provider: ProviderComponent;
  getProps?: (ctx: ProviderContext) => Record<string, unknown>;
}

const isProviderSpec = (value: PluginProviderEntry): value is ProviderSpec => {
  return (
    typeof value === "object" &&
    value !== null &&
    "Provider" in value &&
    typeof (value as { Provider?: unknown }).Provider === "function"
  );
};

const frontendProviderRegistry: Record<string, NormalizedProviderSpec> =
  pluginDefinitions.reduce<Record<string, NormalizedProviderSpec>>(
    (registry, plugin) => {
      if (!plugin.providers) {
        return registry;
      }
      for (const [providerId, entry] of Object.entries(plugin.providers)) {
        if (isProviderSpec(entry)) {
          registry[providerId] = {
            Provider: entry.Provider as unknown as ProviderComponent,
            getProps: entry.getProps as unknown as
              | ((ctx: ProviderContext) => Record<string, unknown>)
              | undefined,
          };
        } else if (typeof entry === "function") {
          registry[providerId] = {
            Provider: entry as unknown as ProviderComponent,
          };
        }
      }
      return registry;
    },
    {},
  );

export function wrapWithFrontendProviders(
  children: ReactNode,
  providerIds?: string[],
  ctx?: ProviderContext,
) {
  if (!providerIds || providerIds.length === 0) {
    return children;
  }

  return providerIds.reduceRight((acc, providerId) => {
    const spec = frontendProviderRegistry[providerId];
    if (!spec) {
      return acc;
    }
    const Provider = spec.Provider;
    const computedProps = spec.getProps && ctx ? spec.getProps(ctx) : undefined;
    return computedProps ? (
      <Provider {...computedProps}>{acc}</Provider>
    ) : (
      <Provider>{acc}</Provider>
    );
  }, children);
}

export function getFrontendProvidersForPostType(
  slug?: string | null,
): string[] | undefined {
  if (!slug) {
    return undefined;
  }
  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    const providers: unknown = postType?.frontend?.providers;

    if (Array.isArray(providers)) {
      const typedProviders = providers.filter(
        (provider): provider is string => typeof provider === "string",
      );

      if (typedProviders.length > 0) {
        return typedProviders;
      }
    }
  }
  return undefined;
}
