import React, { Suspense } from "react";

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { PluginDefinition } from "./types";
import type { ContentAccessAdminSection } from "~/lib/access/contentAccessAdminSections";
import type {
  ContentAccessDecision,
  ContentAccessProvider,
} from "~/lib/access/contentAccessRegistry";
import {
  ADMIN_CONTENT_ACCESS_SECTIONS_FILTER,
  ADMIN_ECOMMERCE_PRODUCT_DETAILS_SECTIONS_FILTER,
  FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER,
} from "./hookSlots";

const CrmMarketingTagsContentAccessSection = React.lazy(async () => {
  const mod = await import(
    "../../components/access/CrmMarketingTagsContentAccessSection"
  );
  return { default: mod.CrmMarketingTagsContentAccessSection };
});

const CrmProductMarketingTagsSection = React.lazy(async () => {
  const mod = await import("../../components/commerce/CrmProductMarketingTagsSection");
  return { default: mod.CrmProductMarketingTagsSection };
});

interface TagRule {
  mode: "all" | "some";
  tagIds: string[];
}
interface ContentAccessRules {
  isPublic?: boolean;
  requiredTags: TagRule;
  excludedTags: TagRule;
}

interface CrmAccessEvalData {
  contentRules?: ContentAccessRules | null;
  parentRules?: ContentAccessRules | null;
  tagKeys?: string[]; // slugs and/or ids
}

const checkRulesAgainstTags = (
  rules: ContentAccessRules,
  tagKeySet: Set<string>,
): boolean => {
  if (rules.isPublic) return true;

  const required = rules.requiredTags?.tagIds ?? [];
  if (required.length > 0) {
    const hasRequired =
      rules.requiredTags.mode === "all"
        ? required.every((k) => tagKeySet.has(k))
        : required.some((k) => tagKeySet.has(k));
    if (!hasRequired) return false;
  }

  const excluded = rules.excludedTags?.tagIds ?? [];
  if (excluded.length > 0) {
    const hasExcluded =
      rules.excludedTags.mode === "all"
        ? excluded.every((k) => tagKeySet.has(k))
        : excluded.some((k) => tagKeySet.has(k));
    if (hasExcluded) return false;
  }

  return true;
};

const crmTagContentAccessProvider: ContentAccessProvider = {
  id: "crm.tagAccess",
  pluginId: "crm",
  priority: 50,
  decide: ({ subject, data }): ContentAccessDecision => {
    const d = (data ?? {}) as CrmAccessEvalData;
    const rules = (d.contentRules ??
      d.parentRules) as ContentAccessRules | null;
    if (!rules) return { kind: "abstain" };

    if (rules.isPublic) return { kind: "allow" };

    const required = rules.requiredTags?.tagIds ?? [];
    const excluded = rules.excludedTags?.tagIds ?? [];
    const hasAnyTagRule = required.length > 0 || excluded.length > 0;
    if (!hasAnyTagRule) {
      // No tag constraints configured → don't block access
      return { kind: "abstain" };
    }

    if (!subject.isAuthenticated) {
      return { kind: "deny", reason: "Please log in to access this content" };
    }

    const tagKeys = Array.isArray(d.tagKeys) ? d.tagKeys : [];
    const tagKeySet = new Set(tagKeys.filter((k) => typeof k === "string"));
    const ok = checkRulesAgainstTags(rules, tagKeySet);
    if (ok) return { kind: "allow" };

    const reason =
      required.length > 0
        ? `Missing required tags (need ${
            rules.requiredTags.mode === "all" ? "ALL" : "at least one"
          } of the specified tags)`
        : "Access denied due to excluded tags";
    return { kind: "deny", reason };
  },
};

export const enhanceCrmPluginDefinition = (
  base: PluginDefinition,
): PluginDefinition => {
  const baseBootstrap = base.admin?.bootstrap;
  const baseFilters = Array.isArray(base.hooks?.filters)
    ? base.hooks.filters
    : [];

  return {
    ...base,
    // Compose hooks: CRM package plugin doesn't currently register content access providers.
    hooks: {
      ...(base.hooks ?? {}),
      filters: [
        ...baseFilters,
        {
          hook: FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER,
          callback: (value: unknown) => {
            const list = Array.isArray(value)
              ? ([
                  ...(value as ContentAccessProvider[]),
                ] as ContentAccessProvider[])
              : ([] as ContentAccessProvider[]);
            list.push(crmTagContentAccessProvider);
            return list;
          },
          priority: 10,
          acceptedArgs: 2,
        },
      ],
    },
    admin: {
      ...(base.admin ?? {}),
      bootstrap: () => {
        // Ensure original CRM bootstrap (if any) still runs
        if (typeof baseBootstrap === "function") {
          baseBootstrap();
        }

        // Idempotency guard (important for HMR / re-mounts)
        const g = globalThis as unknown as {
          __portal_crm_content_access_sections_registered?: boolean;
          __portal_crm_ecommerce_product_sections_registered?: boolean;
        };
        if (
          g.__portal_crm_content_access_sections_registered &&
          g.__portal_crm_ecommerce_product_sections_registered
        ) {
          return;
        }
        g.__portal_crm_content_access_sections_registered = true;
        g.__portal_crm_ecommerce_product_sections_registered = true;

        void import("@acme/admin-runtime/hooks").then((hooks) => {
          if (typeof hooks.addFilter !== "function") return;

          hooks.addFilter(
            String(ADMIN_CONTENT_ACCESS_SECTIONS_FILTER),
            (value: unknown) => {
              const list = Array.isArray(value)
                ? ([
                    ...(value as ContentAccessAdminSection[]),
                  ] as ContentAccessAdminSection[])
                : ([] as ContentAccessAdminSection[]);

              list.push({
                id: "crm:marketingTags",
                pluginId: "crm",
                priority: 50,
                render: ({ rules, setRules, disabled }) => (
                  <Suspense fallback={null}>
                    <CrmMarketingTagsContentAccessSection
                      rules={rules}
                      setRules={setRules}
                      disabled={disabled}
                    />
                  </Suspense>
                ),
              });

              return list;
            },
            10,
            2,
          );

          hooks.addFilter(
            String(ADMIN_ECOMMERCE_PRODUCT_DETAILS_SECTIONS_FILTER),
            (value: unknown, ctx: unknown) => {
              const list = Array.isArray(value)
                ? ([...(value as React.ReactNode[])] as React.ReactNode[])
                : ([] as React.ReactNode[]);

              const c = (ctx ?? {}) as {
                organizationId?: string | null;
                canEdit?: boolean;
                getValue?: (key: string) => unknown;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue?: (key: string, value: any) => void;
              };

              if (typeof c.getValue !== "function" || typeof c.setValue !== "function") {
                return list;
              }

              list.push(
                <Suspense key="crm:product-marketing-tags" fallback={null}>
                  <CrmProductMarketingTagsSection
                    canEdit={Boolean(c.canEdit)}
                    organizationId={typeof c.organizationId === "string" ? c.organizationId : null}
                    getValue={c.getValue}
                    setValue={c.setValue}
                  />
                </Suspense>,
              );

              return list;
            },
            10,
            2,
          );
        });

        // CRM admin submenu item: Marketing Tags (EntityList page)
        void import("~/lib/plugins/crmAdminMenu").then(
          ({ registerCrmMarketingTagsMenuItem }) => {
            registerCrmMarketingTagsMenuItem();
          },
        );
      },
    },
  };
};
