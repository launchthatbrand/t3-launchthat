import type {
  PluginDefinition,
  PluginPostTypeConfig,
} from "~/lib/plugins/types";
import { pluginDefinitions } from "./definitions";

interface PluginPostTypeMatch {
  plugin: PluginDefinition;
  postType: PluginPostTypeConfig;
}

const normalizeSlugKey = (value?: string | null) =>
  (value ?? "").replace(/^\/+|\/+$/g, "").toLowerCase();

const warnDuplicate = (kind: string, key: string) => {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.warn(
    `[frontendRouting] Duplicate ${kind} slug detected: "${key}". Routing should be unique per org; please fix plugin definitions.`,
  );
};

const singleSlugIndex: Map<string, PluginPostTypeMatch> = new Map();
const archiveSlugIndex: Map<string, PluginPostTypeMatch> = new Map();
const postTypeSlugIndex: Map<string, PluginPostTypeMatch> = new Map();

// Build lookup maps once at module init.
for (const plugin of pluginDefinitions) {
  const postTypes = Array.isArray(plugin.postTypes) ? plugin.postTypes : [];
  for (const postType of postTypes) {
    if (!postType || typeof postType !== "object") continue;

    if (typeof postType.slug === "string" && postType.slug) {
      const key = normalizeSlugKey(postType.slug);
      if (key) {
        if (postTypeSlugIndex.has(key)) warnDuplicate("postType", key);
        else postTypeSlugIndex.set(key, { plugin, postType });
      }
    }

    const singleSlug = postType.rewrite?.singleSlug;
    if (typeof singleSlug === "string" && singleSlug) {
      const key = normalizeSlugKey(singleSlug);
      if (key) {
        if (singleSlugIndex.has(key)) warnDuplicate("single", key);
        else singleSlugIndex.set(key, { plugin, postType });
      }
    }

    const archiveSlug = postType.rewrite?.archiveSlug;
    if (typeof archiveSlug === "string" && archiveSlug) {
      const key = normalizeSlugKey(archiveSlug);
      if (key) {
        if (archiveSlugIndex.has(key)) warnDuplicate("archive", key);
        else archiveSlugIndex.set(key, { plugin, postType });
      }
    }
  }
}

export const findPostTypeByArchiveSlug = (
  slug: string,
): PluginPostTypeMatch | null => {
  return archiveSlugIndex.get(normalizeSlugKey(slug)) ?? null;
};

export const findPostTypeBySingleSlug = (
  slug: string,
): PluginPostTypeMatch | null => {
  return singleSlugIndex.get(normalizeSlugKey(slug)) ?? null;
};

export const findPostTypeBySlug = (
  postTypeSlug: string | null | undefined,
): PluginPostTypeMatch | null => {
  if (!postTypeSlug) {
    return null;
  }
  return postTypeSlugIndex.get(normalizeSlugKey(postTypeSlug)) ?? null;
};
