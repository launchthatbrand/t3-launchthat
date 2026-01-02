export const FUNNEL_DEFAULT_SLUG = "__default_funnel__";

/**
 * Funnel step routing meta is system-owned and must be kept strictly consistent
 * by backend write paths (create/update/cascade). Admin UIs should treat these
 * keys as read-only and never allow manual edits.
 */
export const STEP_FUNNEL_ID_KEY = "step.funnelId" as const;
export const STEP_FUNNEL_SLUG_KEY = "step.funnelSlug" as const;
export const STEP_IS_DEFAULT_FUNNEL_KEY = "step.isDefaultFunnel" as const;


