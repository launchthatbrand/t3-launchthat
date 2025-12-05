import type { ComponentType, ReactNode } from "react";

import { pluginDefinitions } from "./definitions";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

const frontendProviderRegistry: Record<string, ProviderComponent> =
  pluginDefinitions.reduce<Record<string, ProviderComponent>>(
    (registry, plugin) => {
      if (plugin.providers) {
        Object.assign(registry, plugin.providers);
      }
      return registry;
    },
    {},
  );

export function wrapWithFrontendProviders(
  children: ReactNode,
  providerIds?: string[],
) {
  if (!providerIds || providerIds.length === 0) {
    return children;
  }

  return providerIds.reduceRight((acc, providerId) => {
    const Provider = frontendProviderRegistry[providerId];
    if (!Provider) {
      return acc;
    }
    return <Provider>{acc}</Provider>;
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
