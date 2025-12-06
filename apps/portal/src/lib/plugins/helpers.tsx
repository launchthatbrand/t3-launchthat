import type { ReactElement, ReactNode } from "react";
import { PortalSocialFeedProvider } from "@/src/providers/SocialFeedProvider";

import type {
  PluginFrontendFilterDefinition,
  PluginFrontendSingleSlotDefinition,
  PluginPostArchiveViewConfig,
  PluginPostSingleViewConfig,
  PluginSingleViewSlotDefinition,
} from "./types";
import { PortalConvexProvider } from "~/providers/ConvexClientProvider";
import { pluginDefinitions } from "./definitions";

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

export function wrapWithPluginProviders(
  node: ReactNode,
  pluginId?: string | null,
): ReactNode {
  if (!pluginId || !node) {
    return node;
  }

  let wrapped: ReactNode = node;

  wrapped = <PortalConvexProvider>{wrapped}</PortalConvexProvider>;

  if (pluginId === "socialfeed") {
    wrapped = <PortalSocialFeedProvider>{wrapped}</PortalSocialFeedProvider>;
  }

  return wrapped;
}
