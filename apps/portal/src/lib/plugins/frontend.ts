import type {
  PluginDefinition,
  PluginPostTypeConfig,
} from "~/lib/plugins/types";
import { pluginDefinitions } from "./definitions";

interface PluginPostTypeMatch {
  plugin: PluginDefinition;
  postType: PluginPostTypeConfig;
}

const slugEquals = (a?: string | null, b?: string | null) =>
  (a ?? "").replace(/^\/+|\/+$/g, "") === (b ?? "").replace(/^\/+|\/+$/g, "");

export const findPostTypeByArchiveSlug = (
  slug: string,
): PluginPostTypeMatch | null => {
  for (const plugin of pluginDefinitions) {
    const postTypes = Array.isArray(plugin.postTypes) ? plugin.postTypes : [];
    for (const postType of postTypes) {
      if (
        postType.rewrite?.archiveSlug &&
        slugEquals(postType.rewrite.archiveSlug, slug)
      ) {
        return { plugin, postType };
      }
    }
  }
  return null;
};

export const findPostTypeBySingleSlug = (
  slug: string,
): PluginPostTypeMatch | null => {
  for (const plugin of pluginDefinitions) {
    const postTypes = Array.isArray(plugin.postTypes) ? plugin.postTypes : [];
    for (const postType of postTypes) {
      if (
        postType.rewrite?.singleSlug &&
        slugEquals(postType.rewrite.singleSlug, slug)
      ) {
        return { plugin, postType };
      }
    }
  }
  return null;
};

export const findPostTypeBySlug = (
  postTypeSlug: string | null | undefined,
): PluginPostTypeMatch | null => {
  if (!postTypeSlug) {
    return null;
  }
  for (const plugin of pluginDefinitions) {
    const postTypes = Array.isArray(plugin.postTypes) ? plugin.postTypes : [];
    for (const postType of postTypes) {
      if (postType.slug === postTypeSlug) {
        return { plugin, postType };
      }
    }
  }
  return null;
};
