import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

type AnyCtx = GenericQueryCtx<any> | GenericMutationCtx<any>;

export const sanitizeSlug = (raw: string): string => {
  const slug = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug.slice(0, 96);
};

export const ensureUniqueSlug = async (
  ctx: AnyCtx,
  slug: string,
  organizationId: string | undefined,
  excludeId?: string,
): Promise<string> => {
  const normalized = sanitizeSlug(slug) || `post-${Date.now()}`;

  // Simple collision loop. This avoids full scans by using the best available index.
  let candidate = normalized;
  for (let i = 0; i < 20; i += 1) {
    const existing = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_org_slug", (q: any) =>
            q.eq("organizationId", organizationId).eq("slug", candidate),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q: any) => q.eq("slug", candidate))
          .filter((q: any) => q.eq(q.field("organizationId"), undefined))
          .unique();

    if (!existing) {
      return candidate;
    }
    if (excludeId && String(existing._id) === excludeId) {
      return candidate;
    }
    candidate = `${normalized}-${i + 1}`;
  }
  return `${normalized}-${Date.now()}`;
};


