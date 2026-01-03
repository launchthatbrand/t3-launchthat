/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { PluginDefinition } from "./types";
import type {
  ContentAccessDecision,
  ContentAccessProvider,
} from "~/lib/access/contentAccessRegistry";
import { FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER } from "./hookSlots";

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
    if (!subject.isAuthenticated) {
      return { kind: "deny", reason: "Please log in to access this content" };
    }

    const tagKeys = Array.isArray(d.tagKeys) ? d.tagKeys : [];
    const tagKeySet = new Set(tagKeys.filter((k) => typeof k === "string"));
    const ok = checkRulesAgainstTags(rules, tagKeySet);
    if (ok) return { kind: "allow" };

    const reason =
      (rules.requiredTags?.tagIds?.length ?? 0) > 0
        ? `Missing required tags (need ${rules.requiredTags.mode === "all" ? "ALL" : "at least one"} of the specified tags)`
        : "Access denied due to excluded tags";
    return { kind: "deny", reason };
  },
};

export const portalCrmPlugin: PluginDefinition = {
  id: "crm",
  name: "CRM",
  description: "Contacts, marketing tags, and tag-based access control.",
  longDescription:
    "CRM features: contacts, tag segmentation, and tag-driven access control and automations. Designed to be optional and pluggable.",
  features: ["Contacts", "Marketing tags", "Tag-based content access"],
  postTypes: [],
  activation: {
    optionKey: "plugin_crm_enabled",
    optionType: "site",
    defaultEnabled: false,
  },
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
          list.push(crmTagContentAccessProvider);
          return list;
        },
        priority: 10,
        acceptedArgs: 2,
      },
    ],
  },
};
