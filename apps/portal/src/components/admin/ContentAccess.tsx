import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, X } from "lucide-react";

import { applyFilters } from "@acme/admin-runtime/hooks";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui/toast";

import type { ContentAccessAdminSection } from "~/lib/access/contentAccessAdminSections";
import type { NormalizedContentAccessRules } from "~/lib/access/contentAccessMeta";
import { useTenant } from "~/context/TenantContext";
import {
  isEffectivelyEmptyContentAccessRules,
  normalizeContentAccessRules,
  parseContentAccessMetaValue,
  serializeContentAccessRules,
} from "~/lib/access/contentAccessMeta";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { ADMIN_CONTENT_ACCESS_SECTIONS_FILTER } from "~/lib/plugins/hookSlots";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

export type AccessRule = NormalizedContentAccessRules;

// Avoid importing Convex generated API as a typed ESM import here; it can trigger
// TS "excessively deep" instantiation in some client modules. We only need the
// runtime function references.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const apiAny: any = require("@/convex/_generated/api").api;

interface ContentAccessProps {
  contentType:
    | "course"
    | "lesson"
    | "topic"
    | "download"
    | "product"
    | "quiz"
    | "post";
  contentId: string;
  postTypeSlug: string;
  title?: string;
}

export const ContentAccess: React.FC<ContentAccessProps> = ({
  contentType,
  contentId,
  postTypeSlug,
  title,
}) => {
  const tenant = useTenant();
  const tenantOrgId = getTenantOrganizationId(tenant);
  const portalAwareOrgId = tenantOrgId ?? tenant?._id;

  // State for access rules
  const [accessRules, setAccessRules] = useState<AccessRule>({
    ...normalizeContentAccessRules(null),
  });
  const [isDirty, setIsDirty] = useState(false);

  const setAccessRulesDirty = (
    updater: React.SetStateAction<AccessRule>,
  ): void => {
    setIsDirty(true);
    setAccessRules(updater);
  };

  const pluginOptions = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.core.options.getByType,
    portalAwareOrgId ? { orgId: portalAwareOrgId, type: "site" } : "skip",
  ) as unknown as Array<{ metaKey: string; metaValue?: unknown }> | undefined;

  const enabledPluginIds = useMemo(() => {
    const optionMap = new Map<string, boolean>(
      Array.isArray(pluginOptions)
        ? pluginOptions.map((o) => [o.metaKey, Boolean(o.metaValue)])
        : [],
    );
    return pluginDefinitions
      .filter((plugin) => {
        if (!plugin.activation) return true;
        const stored = optionMap.get(plugin.activation.optionKey);
        if (stored === undefined) {
          return plugin.activation.defaultEnabled ?? false;
        }
        return stored;
      })
      .map((p) => p.id);
  }, [pluginOptions]);

  const postType = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.core.postTypes.queries.getBySlug,
    {
      slug: postTypeSlug,
      ...(portalAwareOrgId ? { organizationId: portalAwareOrgId } : {}),
    },
  ) as unknown as
    | { storageKind?: string; storageTables?: string[] }
    | null
    | undefined;
  const isLmsComponent =
    postType?.storageKind === "component" &&
    (postType?.storageTables ?? []).some((t) =>
      String(t).includes("launchthat_lms:posts"),
    );

  // Queries: load postmeta and parse `content_access`
  const postMeta = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.core.posts.postMeta.getPostMeta,
    {
      postId: contentId,
      postTypeSlug,
      ...(portalAwareOrgId ? { organizationId: portalAwareOrgId } : {}),
    },
  ) as unknown as Array<{ key: string; value?: unknown }> | undefined;

  const currentRules = useMemo(() => {
    const entry = Array.isArray(postMeta)
      ? postMeta.find((m) => m?.key === "content_access")
      : undefined;
    const parsed = parseContentAccessMetaValue(entry?.value);
    return parsed;
  }, [postMeta]);

  const saveCoreMeta = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.core.posts.mutations.updatePost,
  );
  const deleteCoreMetaKey = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.core.posts.mutations.deletePostMetaKey,
  );
  const saveLmsMeta = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.plugins.lms.posts.mutations.updatePost,
  );
  const deleteLmsMetaKey = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiAny.plugins.lms.posts.mutations.deletePostMetaKey,
  );

  // Load existing rules when data is available
  useEffect(() => {
    if (isDirty) return;
    setAccessRules(currentRules ?? normalizeContentAccessRules(null));
  }, [currentRules, isDirty]);

  // Reset dirty state when switching content
  useEffect(() => {
    setIsDirty(false);
  }, [contentType, contentId, postTypeSlug]);

  const handleSave = async () => {
    try {
      if (isEffectivelyEmptyContentAccessRules(accessRules)) {
        if (isLmsComponent) {
          await deleteLmsMetaKey({ postId: contentId, key: "content_access" });
        } else {
          await deleteCoreMetaKey({ postId: contentId, key: "content_access" });
        }
      } else {
        const value = serializeContentAccessRules(accessRules);
        if (isLmsComponent) {
          await saveLmsMeta({ id: contentId, meta: { content_access: value } });
        } else {
          await saveCoreMeta({
            id: contentId,
            meta: { content_access: value },
          });
        }
      }
      setIsDirty(false);
      toast.success("Access rules saved successfully");
    } catch (error) {
      console.error("Failed to save access rules:", error);
      toast.error("Failed to save access rules");
    }
  };

  const handleClear = async () => {
    try {
      if (isLmsComponent) {
        await deleteLmsMetaKey({ postId: contentId, key: "content_access" });
      } else {
        await deleteCoreMetaKey({ postId: contentId, key: "content_access" });
      }
      setAccessRules(normalizeContentAccessRules(null));
      setIsDirty(false);
      toast.success("Access rules cleared");
    } catch (error) {
      console.error("Failed to clear access rules:", error);
      toast.error("Failed to clear access rules");
    }
  };

  const [requiredRoleInput, setRequiredRoleInput] = useState("");
  const [requiredPermissionInput, setRequiredPermissionInput] = useState("");

  const rawSections = applyFilters(ADMIN_CONTENT_ACCESS_SECTIONS_FILTER, [], {
    contentType,
    contentId,
    enabledPluginIds,
  });
  const sections: ContentAccessAdminSection[] = Array.isArray(rawSections)
    ? (rawSections as ContentAccessAdminSection[])
    : [];
  const visibleSections = useMemo(() => {
    const filtered = sections.filter((s) => {
      if (!s?.pluginId) return true;
      return enabledPluginIds.includes(s.pluginId);
    });
    return filtered.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledPluginIds, rawSections]);

  return (
    <Card className="rounded-none border-none p-0 shadow-none">
      <CardHeader className="p-0">
        <CardTitle>Content Access Control</CardTitle>
        <CardDescription>
          Configure who can access this {contentType}
          {title && ` (${title})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Login gate */}
        <div className="flex items-center space-x-2">
          {/*
            UX rule:
            - Default is public (no meta stored)
            - Only show/enable restrictions if login is required
          */}
          <Checkbox
            id="requiresLogin"
            checked={!accessRules.isPublic}
            onCheckedChange={(checked) => {
              const requiresLogin = checked === true;
              setAccessRulesDirty((prev) => {
                if (!requiresLogin) {
                  // If it's public, other restrictions are meaningless; clear them.
                  return {
                    ...prev,
                    isPublic: true,
                    requiredRoleNames: [],
                    requiredPermissionKeys: [],
                    requiredTags: { mode: "some", tagIds: [] },
                    excludedTags: { mode: "some", tagIds: [] },
                  };
                }
                return { ...prev, isPublic: false };
              });
            }}
          />
          <Label htmlFor="requiresLogin" className="text-sm font-medium">
            Users must be logged in to view this page
          </Label>
        </div>

        {accessRules.isPublic ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              This content is public. Turn on “Users must be logged in…” to add
              role/tag/permission restrictions.
            </p>
          </div>
        ) : null}

        {/* Core access controls (always available) */}
        <div
          className={`space-y-6 ${accessRules.isPublic ? "pointer-events-none opacity-50" : ""}`}
        >
          {/* Role requirements */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Required Roles</Label>
            <div className="flex flex-wrap gap-2">
              {(accessRules.requiredRoleNames ?? []).map((roleName) => (
                <Badge
                  key={roleName}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {roleName}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      setAccessRulesDirty((prev) => ({
                        ...prev,
                        requiredRoleNames: (
                          prev.requiredRoleNames ?? []
                        ).filter((r) => r !== roleName),
                      }))
                    }
                  />
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={requiredRoleInput}
                onChange={(e) => setRequiredRoleInput(e.target.value)}
                placeholder="Add required role (name)"
                disabled={accessRules.isPublic}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const role = requiredRoleInput.trim();
                  if (!role) return;
                  setAccessRulesDirty((prev) => ({
                    ...prev,
                    requiredRoleNames: Array.from(
                      new Set([...(prev.requiredRoleNames ?? []), role]),
                    ),
                  }));
                  setRequiredRoleInput("");
                }}
                disabled={accessRules.isPublic}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Permission requirements */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Required Permissions
            </Label>
            <div className="flex flex-wrap gap-2">
              {(accessRules.requiredPermissionKeys ?? []).map((key) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {key}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      setAccessRulesDirty((prev) => ({
                        ...prev,
                        requiredPermissionKeys: (
                          prev.requiredPermissionKeys ?? []
                        ).filter((p) => p !== key),
                      }))
                    }
                  />
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={requiredPermissionInput}
                onChange={(e) => setRequiredPermissionInput(e.target.value)}
                placeholder="Add required permission key"
                disabled={accessRules.isPublic}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const key = requiredPermissionInput.trim();
                  if (!key) return;
                  setAccessRulesDirty((prev) => ({
                    ...prev,
                    requiredPermissionKeys: Array.from(
                      new Set([...(prev.requiredPermissionKeys ?? []), key]),
                    ),
                  }));
                  setRequiredPermissionInput("");
                }}
                disabled={accessRules.isPublic}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Plugin-provided access controls (e.g. CRM marketing tags) */}
        {visibleSections.length > 0 ? (
          <div
            className={`space-y-6 ${accessRules.isPublic ? "pointer-events-none opacity-50" : ""}`}
          >
            {visibleSections.map((section) => (
              <React.Fragment key={section.id}>
                {section.render({
                  contentType,
                  contentId,
                  title,
                  rules: accessRules,
                  setRules: setAccessRulesDirty,
                  disabled: accessRules.isPublic,
                })}
              </React.Fragment>
            ))}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave}>Save Access Rules</Button>
          <Button variant="outline" onClick={handleClear}>
            Clear Rules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
