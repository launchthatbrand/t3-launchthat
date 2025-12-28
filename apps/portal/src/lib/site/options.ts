export const SITE_OPTION_KEYS = {
  frontPage: "site.frontPage",
} as const;

export type SiteOptionKey =
  (typeof SITE_OPTION_KEYS)[keyof typeof SITE_OPTION_KEYS];
