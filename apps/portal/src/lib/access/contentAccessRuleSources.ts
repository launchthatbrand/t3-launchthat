import { applyFilters } from "@acme/admin-runtime/hooks";

import { FRONTEND_CONTENT_ACCESS_RULE_SOURCES_FILTER } from "~/lib/plugins/hookSlots";

export interface ContentAccessRuleRecord {
  id: string;
  resource: {
    contentType: string;
    contentId: string;
    postTypeSlug?: string;
    title?: string;
    href?: string;
  };
  ruleSummary: string;
  source: {
    sourceId: string;
    pluginId?: string;
  };
}

export interface ContentAccessRuleSourceContext {
  organizationId: string | null;
  enabledPluginIds: string[];
  // Generic query function for both server (fetchQuery) and client (convex.query).
  query: (fn: unknown, args: unknown) => Promise<unknown>;
  api: unknown;
}

export interface ContentAccessRuleSource {
  id: string;
  pluginId?: string;
  priority?: number;
  listRules: (
    ctx: ContentAccessRuleSourceContext,
  ) => Promise<ContentAccessRuleRecord[]>;
}

const isSourceEnabled = (
  source: ContentAccessRuleSource,
  enabledPluginIds: string[],
): boolean => {
  if (!source.pluginId) return true;
  return enabledPluginIds.includes(source.pluginId);
};

export async function listContentAccessRules(
  ctx: ContentAccessRuleSourceContext,
): Promise<ContentAccessRuleRecord[]> {
  const raw = applyFilters(FRONTEND_CONTENT_ACCESS_RULE_SOURCES_FILTER, [], {
    organizationId: ctx.organizationId,
    enabledPluginIds: ctx.enabledPluginIds,
  });

  const sources: ContentAccessRuleSource[] = Array.isArray(raw)
    ? (raw as ContentAccessRuleSource[])
    : [];

  const sorted = [...sources].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
  );

  const results: ContentAccessRuleRecord[] = [];
  for (const source of sorted) {
    if (!isSourceEnabled(source, ctx.enabledPluginIds)) continue;
    try {
      const rows = await source.listRules(ctx);
      if (Array.isArray(rows)) {
        results.push(...rows);
      }
    } catch (error) {
      // Don't break the entire settings page if one plugin misbehaves.
      console.error("[contentAccess] rule source failed", {
        sourceId: source.id,
        pluginId: source.pluginId,
        error,
      });
    }
  }

  return results;
}
