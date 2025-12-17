import type { Doc } from "@/convex/_generated/dataModel";

export interface PageTemplateContext {
  post: Doc<"posts">;
  postType?: Doc<"postTypes"> | null;
  meta: Record<string, unknown>;
  organizationId?: string | null;
}

export interface PageTemplateDefinition {
  slug: string;
  label: string;
  description?: string;
  render: (ctx: PageTemplateContext) => React.ReactNode;
  order?: number;
}

const DEFAULT_TEMPLATE_SLUG = "default";
export const PAGE_TEMPLATE_ACCESS_OPTION_KEY = "page_template_access";

const GLOBAL_KEY = "__global__";

const registry = new Map<string, Map<string, PageTemplateDefinition>>();

const getBucket = (organizationId?: string | null) => {
  const key = organizationId ?? GLOBAL_KEY;
  if (!registry.has(key)) {
    registry.set(key, new Map());
  }
  const bucket = registry.get(key);
  if (!bucket) {
    const created = new Map<string, PageTemplateDefinition>();
    registry.set(key, created);
    return created;
  }
  return bucket;
};

export const registerPageTemplate = (
  template: PageTemplateDefinition,
  organizationId?: string | null,
) => {
  const bucket = getBucket(organizationId);
  bucket.set(template.slug, template);
};

export const unregisterPageTemplate = (
  slug: string,
  organizationId?: string | null,
) => {
  const bucket = getBucket(organizationId);
  bucket.delete(slug);
};

export const listPageTemplates = (organizationId?: string | null) => {
  const globalTemplates = registry.get(GLOBAL_KEY) ?? new Map();
  const orgTemplates = organizationId
    ? registry.get(organizationId)
    : undefined;

  const merged = new Map<string, PageTemplateDefinition>(globalTemplates);
  if (orgTemplates) {
    orgTemplates.forEach((value, key) => merged.set(key, value));
  }

  return Array.from(merged.values()).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label),
  );
};

export const getPageTemplate = (
  slug?: string | null,
  organizationId?: string | null,
) => {
  const orgBucket = organizationId ? registry.get(organizationId) : undefined;
  const globalBucket = registry.get(GLOBAL_KEY);

  if (slug && orgBucket?.has(slug)) return orgBucket.get(slug);
  if (slug && globalBucket?.has(slug)) return globalBucket.get(slug);

  return (
    orgBucket?.get(DEFAULT_TEMPLATE_SLUG) ??
    globalBucket?.get(DEFAULT_TEMPLATE_SLUG)
  );
};

// Default template delegates to existing single renderer; the runtime can interpret
// "default" by skipping to the built-in rendering pipeline.
export const DEFAULT_PAGE_TEMPLATE_SLUG = DEFAULT_TEMPLATE_SLUG;

registerPageTemplate(
  {
    slug: DEFAULT_TEMPLATE_SLUG,
    label: "Default",
    description: "Use the standard page renderer",
    render: () => null,
    order: 0,
  },
  null,
);
