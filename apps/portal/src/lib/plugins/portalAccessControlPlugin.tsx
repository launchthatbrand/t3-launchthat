import type { PluginDefinition } from "./types";
import type { ContentAccessProvider } from "~/lib/access/contentAccessRegistry";
import type {
  ContentAccessRuleRecord,
  ContentAccessRuleSource,
} from "~/lib/access/contentAccessRuleSources";
import { parseContentAccessMetaValue } from "~/lib/access/contentAccessMeta";
import { loginRequiredAccessProvider } from "~/lib/access/providers/loginRequiredAccessProvider";
import { rolePermissionAccessProvider } from "~/lib/access/providers/rolePermissionAccessProvider";
import {
  FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER,
  FRONTEND_CONTENT_ACCESS_RULE_SOURCES_FILTER,
} from "./hookSlots";

const safeString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const summarizeRule = (
  rule: any,
  pluginIds: string[],
): { summary: string; pluginId?: string } => {
  const parts: string[] = [];
  const isPublic = Boolean(rule?.isPublic);
  if (isPublic) {
    parts.push("public");
  }

  const requiredRoleNames: string[] = Array.isArray(rule?.requiredRoleNames)
    ? rule.requiredRoleNames.filter((r: any) => typeof r === "string")
    : [];
  const requiredPermissionKeys: string[] = Array.isArray(
    rule?.requiredPermissionKeys,
  )
    ? rule.requiredPermissionKeys.filter((p: any) => typeof p === "string")
    : [];
  const requiredTags: string[] = Array.isArray(rule?.requiredTags?.tagIds)
    ? rule.requiredTags.tagIds.filter((t: any) => typeof t === "string")
    : [];
  const excludedTags: string[] = Array.isArray(rule?.excludedTags?.tagIds)
    ? rule.excludedTags.tagIds.filter((t: any) => typeof t === "string")
    : [];

  if (requiredRoleNames.length > 0) {
    parts.push(`roles: ${requiredRoleNames.join(", ")}`);
  }
  if (requiredPermissionKeys.length > 0) {
    parts.push(`permissions: ${requiredPermissionKeys.join(", ")}`);
  }
  if (requiredTags.length > 0) {
    parts.push(
      `requires tags (${rule?.requiredTags?.mode === "all" ? "all" : "some"}): ${requiredTags.join(", ")}`,
    );
  }
  if (excludedTags.length > 0) {
    parts.push(
      `excludes tags (${rule?.excludedTags?.mode === "all" ? "all" : "some"}): ${excludedTags.join(", ")}`,
    );
  }

  // Heuristic attribution for display grouping.
  const inferredPluginId =
    (requiredTags.length > 0 || excludedTags.length > 0) &&
    pluginIds.includes("crm")
      ? "crm"
      : requiredRoleNames.length > 0 || requiredPermissionKeys.length > 0
        ? "core"
        : "lms";

  return {
    summary: parts.join(" • ") || "restricted",
    pluginId: inferredPluginId,
  };
};

const lmsLockedCoursesRuleSource: ContentAccessRuleSource = {
  id: "lms.lockedCourses",
  pluginId: "lms",
  priority: 10,
  listRules: async (ctx) => {
    const rows: ContentAccessRuleRecord[] = [];
    const lmsMetaRows = (await ctx.query(
      ctx.api.plugins.lms.posts.queries.listPostsWithMetaKey,
      {
        key: "lms_course_access_mode",
        organizationId: ctx.organizationId
          ? String(ctx.organizationId)
          : undefined,
      },
    )) as Array<{
      postId: string;
      postTypeSlug: string;
      title?: string;
      value?: unknown;
    }>;

    for (const row of Array.isArray(lmsMetaRows) ? lmsMetaRows : []) {
      const postTypeSlug = safeString((row as any).postTypeSlug);
      if (postTypeSlug !== "courses") continue;
      const id = safeString((row as any).postId);
      if (!id) continue;
      const accessMode = safeString((row as any).value) ?? "open";
      if (accessMode === "open") continue;

      const title = safeString((row as any).title) ?? "Untitled course";
      rows.push({
        id: `lms:course:${id}:accessMode`,
        resource: {
          contentType: "course",
          contentId: id,
          postTypeSlug: "courses",
          title,
          href: `/admin/edit?post_type=courses&post_id=${encodeURIComponent(id)}`,
        },
        ruleSummary: `course accessMode=${accessMode}`,
        source: { sourceId: "lms.lockedCourses", pluginId: "lms" },
      });
    }

    return rows;
  },
};

const contentAccessRulesRuleSource: ContentAccessRuleSource = {
  id: "contentAccess.rules",
  priority: 20,
  listRules: async (ctx) => {
    const rows: ContentAccessRuleRecord[] = [];
    const orgArg = ctx.organizationId
      ? { organizationId: ctx.organizationId }
      : {};

    const coreRows = (await ctx.query(
      ctx.api.core.posts.queries.listPostsWithMetaKey,
      {
        key: "content_access",
        ...orgArg,
      },
    )) as Array<{
      postId: string;
      postTypeSlug: string;
      title?: string;
      value?: unknown;
    }>;

    for (const row of Array.isArray(coreRows) ? coreRows : []) {
      const postId = safeString((row as any).postId);
      const postTypeSlug = safeString((row as any).postTypeSlug) ?? undefined;
      if (!postId) continue;

      const parsed = parseContentAccessMetaValue((row as any).value);
      if (!parsed) continue;

      const { summary, pluginId } = summarizeRule(parsed, ctx.enabledPluginIds);
      rows.push({
        id: `rule:post:${postId}`,
        resource: {
          contentType: "post",
          contentId: postId,
          postTypeSlug,
          title: safeString((row as any).title) ?? undefined,
          href: postTypeSlug
            ? `/admin/edit?post_type=${encodeURIComponent(postTypeSlug)}&post_id=${encodeURIComponent(postId)}`
            : `/admin/edit?post_id=${encodeURIComponent(postId)}`,
        },
        ruleSummary: summary,
        source: { sourceId: "contentAccess.rules", pluginId },
      });
    }

    if (ctx.enabledPluginIds.includes("lms")) {
      const lmsRows = (await ctx.query(
        ctx.api.plugins.lms.posts.queries.listPostsWithMetaKey,
        {
          key: "content_access",
          organizationId: ctx.organizationId
            ? String(ctx.organizationId)
            : undefined,
        },
      )) as Array<{
        postId: string;
        postTypeSlug: string;
        title?: string;
        value?: unknown;
      }>;

      for (const row of Array.isArray(lmsRows) ? lmsRows : []) {
        const postId = safeString((row as any).postId);
        const postTypeSlug = safeString((row as any).postTypeSlug) ?? undefined;
        if (!postId) continue;

        const parsed = parseContentAccessMetaValue((row as any).value);
        if (!parsed) continue;

        const { summary, pluginId } = summarizeRule(
          parsed,
          ctx.enabledPluginIds,
        );
        rows.push({
          id: `rule:lms:post:${postId}`,
          resource: {
            contentType: "post",
            contentId: postId,
            postTypeSlug,
            title: safeString((row as any).title) ?? undefined,
            href: postTypeSlug
              ? `/admin/edit?post_type=${encodeURIComponent(postTypeSlug)}&post_id=${encodeURIComponent(postId)}`
              : `/admin/edit?post_id=${encodeURIComponent(postId)}`,
          },
          ruleSummary: summary,
          source: { sourceId: "contentAccess.rules", pluginId },
        });
      }
    }

    return rows;
  },
};

export const portalAccessControlPlugin: PluginDefinition = {
  id: "portal-access-control",
  name: "Portal Access Control",
  description: "Portal-wide access control providers and rule visibility.",
  longDescription:
    "Registers core and plugin-aware access control providers and rule sources for the content access settings page.",
  features: ["Content access providers", "Content access rule sources"],
  postTypes: [],
  hooks: {
    filters: [
      {
        hook: FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER,
        callback: (value: unknown) => {
          const list = Array.isArray(value)
            ? ([
                ...(value as ContentAccessProvider[]),
              ] as ContentAccessProvider[])
            : ([] as ContentAccessProvider[]);
          list.push(loginRequiredAccessProvider);
          list.push(rolePermissionAccessProvider);
          return list;
        },
        priority: 5,
        acceptedArgs: 2,
      },
      {
        hook: FRONTEND_CONTENT_ACCESS_RULE_SOURCES_FILTER,
        callback: (value: unknown) => {
          const list = Array.isArray(value)
            ? ([
                ...(value as ContentAccessRuleSource[]),
              ] as ContentAccessRuleSource[])
            : ([] as ContentAccessRuleSource[]);
          list.push(lmsLockedCoursesRuleSource);
          list.push(contentAccessRulesRuleSource);
          return list;
        },
        priority: 5,
        acceptedArgs: 2,
      },
    ],
  },
};
