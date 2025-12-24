import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { query } from "../../_generated/server";

const taxonomyValidator = v.object({
  _id: v.id("taxonomies"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  hierarchical: v.boolean(),
  builtIn: v.boolean(),
  organizationId: v.optional(v.id("organizations")),
  postTypeSlugs: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const taxonomyTermValidator = v.object({
  _id: v.id("taxonomyTerms"),
  _creationTime: v.number(),
  taxonomyId: v.id("taxonomies"),
  organizationId: v.id("organizations"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  parentId: v.optional(v.id("taxonomyTerms")),
  postTypeSlugs: v.optional(v.array(v.string())),
  metadata: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
  ),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

async function resolveTaxonomyIdBySlug(args: {
  ctx: QueryCtx;
  slug: string;
  organizationId?: Id<"organizations">;
}) {
  const { ctx, slug, organizationId } = args;
  if (organizationId) {
    const orgSpecific = await ctx.db
      .query("taxonomies")
      .withIndex("by_org_and_slug", (q) =>
        q.eq("organizationId", organizationId).eq("slug", slug),
      )
      .unique();
    if (orgSpecific) return orgSpecific;
  }

  // Built-ins are stored with `organizationId` unset.
  return await ctx.db
    .query("taxonomies")
    .withIndex("by_org_and_slug", (q) =>
      q.eq("organizationId", undefined).eq("slug", slug),
    )
    .unique();
}

export const listTaxonomies = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(taxonomyValidator),
  handler: async (ctx, args) => {
    const builtIns = await ctx.db
      .query("taxonomies")
      .withIndex("by_builtIn", (q) => q.eq("builtIn", true))
      .collect();

    const custom = args.organizationId
      ? await ctx.db
          .query("taxonomies")
          .withIndex("by_org", (q) =>
            q.eq("organizationId", args.organizationId),
          )
          .collect()
      : [];

    return [...builtIns, ...custom].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  },
});

export const getTaxonomyBySlug = query({
  args: { slug: v.string(), organizationId: v.optional(v.id("organizations")) },
  returns: v.union(taxonomyValidator, v.null()),
  handler: async (ctx, args) => {
    const record = await resolveTaxonomyIdBySlug({
      ctx,
      slug: args.slug,
      organizationId: args.organizationId,
    });
    return record ?? null;
  },
});

export const listTermsByTaxonomy = query({
  args: {
    taxonomySlug: v.string(),
    organizationId: v.id("organizations"),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(taxonomyTermValidator),
  handler: async (ctx, args) => {
    const taxonomy = await resolveTaxonomyIdBySlug({
      ctx,
      slug: args.taxonomySlug,
      organizationId: args.organizationId,
    });
    if (!taxonomy) return [];

    const normalizedPostType = args.postTypeSlug?.toLowerCase();
    if (
      normalizedPostType &&
      Array.isArray(taxonomy.postTypeSlugs) &&
      taxonomy.postTypeSlugs.length > 0 &&
      !taxonomy.postTypeSlugs.includes(normalizedPostType)
    ) {
      return [];
    }

    const terms = await ctx.db
      .query("taxonomyTerms")
      .withIndex("by_org_and_taxonomy", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("taxonomyId", taxonomy._id),
      )
      .collect();

    if (!normalizedPostType) return terms;

    return terms.filter((term) => {
      const scoped = Array.isArray(term.postTypeSlugs)
        ? term.postTypeSlugs
        : [];
      if (scoped.length === 0) return true;
      return scoped.includes(normalizedPostType);
    });
  },
});

export const getTermBySlug = query({
  args: {
    taxonomySlug: v.string(),
    organizationId: v.id("organizations"),
    termSlug: v.string(),
  },
  returns: v.union(taxonomyTermValidator, v.null()),
  handler: async (ctx, args) => {
    const taxonomy = await resolveTaxonomyIdBySlug({
      ctx,
      slug: args.taxonomySlug,
      organizationId: args.organizationId,
    });
    if (!taxonomy) return null;

    return (
      (await ctx.db
        .query("taxonomyTerms")
        .withIndex("by_org_taxonomy_and_slug", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("taxonomyId", taxonomy._id)
            .eq("slug", args.termSlug),
        )
        .unique()) ?? null
    );
  },
});

export const listObjectTerms = query({
  args: {
    organizationId: v.id("organizations"),
    objectId: v.string(),
  },
  returns: v.array(v.id("taxonomyTerms")),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("taxonomyObjectTerms")
      .withIndex("by_org_and_object", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("objectId", args.objectId),
      )
      .collect();
    return rows.map((row) => row.termId);
  },
});

export const listObjectsByTerm = query({
  args: {
    organizationId: v.id("organizations"),
    termId: v.id("taxonomyTerms"),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    if (args.postTypeSlug) {
      const normalized = args.postTypeSlug.toLowerCase();
      const rows = await ctx.db
        .query("taxonomyObjectTerms")
        .withIndex("by_org_term_and_postTypeSlug", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("termId", args.termId)
            .eq("postTypeSlug", normalized),
        )
        .collect();
      return rows.map((row) => row.objectId);
    }

    const all = await ctx.db
      .query("taxonomyObjectTerms")
      .withIndex("by_org_and_term", (q) =>
        q.eq("organizationId", args.organizationId).eq("termId", args.termId),
      )
      .collect();
    return all.map((row) => row.objectId);
  },
});

export const listAssignmentsByTerm = query({
  args: {
    organizationId: v.id("organizations"),
    termId: v.id("taxonomyTerms"),
  },
  returns: v.array(
    v.object({
      objectId: v.string(),
      postTypeSlug: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("taxonomyObjectTerms")
      .withIndex("by_org_and_term", (q) =>
        q.eq("organizationId", args.organizationId).eq("termId", args.termId),
      )
      .collect();
    return rows.map((row) => ({
      objectId: row.objectId,
      postTypeSlug: row.postTypeSlug,
    }));
  },
});

export const listObjectTermBadges = query({
  args: {
    organizationId: v.id("organizations"),
    objectId: v.string(),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      taxonomySlug: v.string(),
      taxonomyName: v.string(),
      termId: v.id("taxonomyTerms"),
      termSlug: v.string(),
      termName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const normalizedPostType = args.postTypeSlug?.toLowerCase().trim();
    const rows = await ctx.db
      .query("taxonomyObjectTerms")
      .withIndex("by_org_and_object", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("objectId", args.objectId),
      )
      .collect();

    const filtered = normalizedPostType
      ? rows.filter(
          (row) =>
            (row.postTypeSlug ?? "").toLowerCase() === normalizedPostType,
        )
      : rows;

    const seenTermIds = new Set<Id<"taxonomyTerms">>();
    const results: Array<{
      taxonomySlug: string;
      taxonomyName: string;
      termId: Id<"taxonomyTerms">;
      termSlug: string;
      termName: string;
    }> = [];

    for (const row of filtered) {
      if (seenTermIds.has(row.termId)) {
        continue;
      }
      seenTermIds.add(row.termId);

      const term = await ctx.db.get(row.termId);
      if (!term) continue;
      const taxonomy = await ctx.db.get(term.taxonomyId);
      if (!taxonomy) continue;

      results.push({
        taxonomySlug: taxonomy.slug,
        taxonomyName: taxonomy.name,
        termId: term._id,
        termSlug: term.slug,
        termName: term.name,
      });
    }

    // Stable ordering in UI.
    results.sort((a, b) => {
      const taxonomyCmp = a.taxonomyName.localeCompare(b.taxonomyName);
      if (taxonomyCmp !== 0) return taxonomyCmp;
      return a.termName.localeCompare(b.termName);
    });

    return results;
  },
});
