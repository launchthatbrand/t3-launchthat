import type { ReactElement, ReactNode } from "react";
import { PortalSocialFeedProvider } from "@/src/providers/SocialFeedProvider";

import type {
  PluginPostArchiveViewConfig,
  PluginPostSingleViewConfig,
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
