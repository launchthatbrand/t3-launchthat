export const SEO_META_KEYS = {
  title: "seo_title",
  description: "seo_description",
  canonical: "seo_canonical",
  noindex: "seo_noindex",
  nofollow: "seo_nofollow",
} as const;

export type SeoMetaKey = (typeof SEO_META_KEYS)[keyof typeof SEO_META_KEYS];

export const SEO_OPTION_KEYS = {
  general: "seo_general_settings",
  social: "seo_social_settings",
  sitemap: "seo_sitemap_settings",
  structured: "seo_structured_settings",
} as const;

export type SeoOptionKey =
  (typeof SEO_OPTION_KEYS)[keyof typeof SEO_OPTION_KEYS];
