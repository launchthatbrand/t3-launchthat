export interface ContentAccessTagRule {
  mode: "all" | "some";
  tagIds: string[];
}

export interface ContentAccessRules {
  isPublic?: boolean;
  requiredRoleNames?: string[];
  requiredPermissionKeys?: string[];
  requiredTags?: ContentAccessTagRule;
  excludedTags?: ContentAccessTagRule;
}

export interface NormalizedContentAccessRules {
  isPublic: boolean;
  requiredRoleNames: string[];
  requiredPermissionKeys: string[];
  requiredTags: ContentAccessTagRule;
  excludedTags: ContentAccessTagRule;
}

const DEFAULT_TAG_RULE: ContentAccessTagRule = { mode: "some", tagIds: [] };

const isTagRule = (value: unknown): value is ContentAccessTagRule => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ContentAccessTagRule>;
  if (v.mode !== "all" && v.mode !== "some") return false;
  if (!Array.isArray(v.tagIds)) return false;
  return v.tagIds.every((id) => typeof id === "string");
};

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  if (!value.every((v) => typeof v === "string")) return null;
  return value;
};

export const normalizeContentAccessRules = (
  rules: ContentAccessRules | null | undefined,
): NormalizedContentAccessRules => {
  const requiredRoleNames = asStringArray(rules?.requiredRoleNames) ?? [];
  const requiredPermissionKeys =
    asStringArray(rules?.requiredPermissionKeys) ?? [];
  const requiredTags = isTagRule(rules?.requiredTags)
    ? rules.requiredTags
    : DEFAULT_TAG_RULE;
  const excludedTags = isTagRule(rules?.excludedTags)
    ? rules.excludedTags
    : DEFAULT_TAG_RULE;

  // Backwards-compatible defaulting:
  // - If isPublic is explicitly set, honor it.
  // - If any restriction exists and isPublic is missing, default to NOT public.
  // - If nothing is configured, default to public (absence of meta == public).
  const hasAnyRestriction =
    requiredRoleNames.length > 0 ||
    requiredPermissionKeys.length > 0 ||
    requiredTags.tagIds.length > 0 ||
    excludedTags.tagIds.length > 0;

  return {
    isPublic:
      rules?.isPublic !== undefined
        ? Boolean(rules.isPublic)
        : !hasAnyRestriction,
    requiredRoleNames,
    requiredPermissionKeys,
    requiredTags,
    excludedTags,
  };
};

export const parseContentAccessMetaValue = (
  metaValue: unknown,
): NormalizedContentAccessRules | null => {
  if (typeof metaValue !== "string" || metaValue.trim().length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(metaValue) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return normalizeContentAccessRules(parsed as ContentAccessRules);
  } catch {
    return null;
  }
};

export const serializeContentAccessRules = (
  rules: NormalizedContentAccessRules,
): string => {
  // Store a compact, single-blob JSON value (WordPress-style postmeta).
  return JSON.stringify({
    isPublic: rules.isPublic,
    requiredRoleNames: rules.requiredRoleNames,
    requiredPermissionKeys: rules.requiredPermissionKeys,
    requiredTags: rules.requiredTags,
    excludedTags: rules.excludedTags,
  } satisfies ContentAccessRules);
};

export const isEffectivelyEmptyContentAccessRules = (
  rules: NormalizedContentAccessRules,
): boolean => {
  // Public is the default behavior. If content is public and no additional
  // restrictions are configured, treat as empty (delete meta).
  if (!rules.isPublic) return false;
  if (rules.requiredRoleNames.length > 0) return false;
  if (rules.requiredPermissionKeys.length > 0) return false;
  if (rules.requiredTags.tagIds.length > 0) return false;
  if (rules.excludedTags.tagIds.length > 0) return false;
  return true;
};
