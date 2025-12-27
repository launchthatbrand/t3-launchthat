import type { ReactElement, ReactNode } from "react";
import type {
  PluginFrontendFilterDefinition,
  PluginFrontendSingleSlotDefinition,
  PluginPostArchiveViewConfig,
  PluginPostSingleViewConfig,
  PluginPostTypeFieldDefinition,
  PluginSingleViewSlotDefinition,
} from "./types";
import type { ProviderContext } from "launchthat-plugin-core";
import { applyFilters } from "@acme/admin-runtime/hooks";
import { PortalConvexProvider } from "~/providers/ConvexClientProvider";
import { pluginDefinitions } from "./definitions";
import { wrapWithFrontendProviders } from "./frontendProviders";
import { FRONTEND_SINGLE_SLOTS_FILTER } from "./hookSlots";

import "~/lib/plugins/installHooks";

export interface PluginSingleViewInstance {
  pluginId: string;
  pluginName: string;
  config: PluginPostSingleViewConfig;
}

export interface PluginArchiveViewInstance {
  pluginId: string;
  pluginName: string;
  config: PluginPostArchiveViewConfig;
}

export interface PluginSingleViewSlotRegistration {
  pluginId: string;
  pluginName: string;
  slot: PluginSingleViewSlotDefinition;
}

export interface PluginFrontendSingleSlotRegistration {
  pluginId: string;
  pluginName: string;
  slot: PluginFrontendSingleSlotDefinition;
}

export interface PluginFrontendFilterRegistration {
  pluginId: string;
  pluginName: string;
  filter: PluginFrontendFilterDefinition;
}

export interface PluginFieldDefinitionRegistration {
  pluginId: string;
  pluginName: string;
  field: PluginPostTypeFieldDefinition;
}

export function getPluginSingleViewForSlug(
  slug: string,
): PluginSingleViewInstance | null {
  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    if (postType?.singleView) {
      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        config: postType.singleView,
      };
    }
  }
  return null;
}

export function getPluginArchiveViewForSlug(
  slug: string,
): PluginArchiveViewInstance | null {
  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    if (postType?.adminArchiveView) {
      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        config: postType.adminArchiveView,
      };
    }
  }
  return null;
}

export function getPluginSingleViewSlotsForSlug(
  slug: string,
): PluginSingleViewSlotRegistration[] {
  const registrations: PluginSingleViewSlotRegistration[] = [];

  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    if (!postType?.singleViewSlots?.length) {
      continue;
    }
    for (const slot of postType.singleViewSlots) {
      registrations.push({
        pluginId: plugin.id,
        pluginName: plugin.name,
        slot,
      });
    }
  }

  return registrations;
}

export function getPluginFrontendSingleSlotsForSlug(
  slug: string,
): PluginFrontendSingleSlotRegistration[] {
  const registrations: PluginFrontendSingleSlotRegistration[] = [];

  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    if (!postType?.frontend?.singleSlots?.length) {
      continue;
    }
    for (const slot of postType.frontend.singleSlots) {
      registrations.push({
        pluginId: plugin.id,
        pluginName: plugin.name,
        slot,
      });
    }
  }

  return registrations;
}

export function getFrontendSingleSlotsForSlug(
  slug: string,
): PluginFrontendSingleSlotRegistration[] {
  const base = getPluginFrontendSingleSlotsForSlug(slug);
  const filtered: unknown = applyFilters(FRONTEND_SINGLE_SLOTS_FILTER, base, {
    postTypeSlug: slug,
  });
  return Array.isArray(filtered)
    ? (filtered as PluginFrontendSingleSlotRegistration[])
    : base;
}

export function getPluginFrontendFiltersForSlug(
  slug: string,
): PluginFrontendFilterRegistration[] {
  const registrations: PluginFrontendFilterRegistration[] = [];

  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    if (!postType?.frontend?.filters?.length) {
      continue;
    }
    for (const filter of postType.frontend.filters) {
      registrations.push({
        pluginId: plugin.id,
        pluginName: plugin.name,
        filter,
      });
    }
  }

  return registrations;
}

export function getPluginFieldDefinitionsForSlug(
  slug: string,
): PluginFieldDefinitionRegistration[] {
  const registrations: PluginFieldDefinitionRegistration[] = [];

  for (const plugin of pluginDefinitions) {
    const fieldGroups = plugin.fieldRegistrations?.filter(
      (registration) => registration.postTypeSlug === slug,
    );
    if (!fieldGroups?.length) {
      continue;
    }
    for (const group of fieldGroups) {
      for (const field of group.fields) {
        registrations.push({
          pluginId: plugin.id,
          pluginName: plugin.name,
          field,
        });
      }
    }
  }

  return registrations;
}

export function wrapWithPluginProviders(
  node: ReactNode,
  pluginId?: string | null,
  ctx?: Omit<ProviderContext, "routeKind" | "pluginId"> & {
    routeKind: ProviderContext["routeKind"];
  },
): ReactNode {
  if (!pluginId || !node) {
    return node;
  }

  let wrapped: ReactNode = node;

  wrapped = <PortalConvexProvider>{wrapped}</PortalConvexProvider>;

  const plugin = pluginDefinitions.find((p) => p.id === pluginId);
  const providerIds = plugin?.providers
    ? Object.keys(plugin.providers).sort()
    : undefined;
  wrapped = wrapWithFrontendProviders(wrapped, providerIds, {
    routeKind: ctx?.routeKind ?? "frontend",
    pluginId,
    organizationId: ctx?.organizationId ?? null,
    postTypeSlug: ctx?.postTypeSlug ?? null,
    post: ctx?.post,
    postMeta: ctx?.postMeta,
  });

  return wrapped;
}
