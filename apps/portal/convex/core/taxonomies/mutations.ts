import { ConvexError, v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { mutation } from "../../_generated/server";
import { sanitizeSlug } from "../../lib/slugs";

const RESERVED_TAXONOMY_SLUGS = new Set(["category", "post_tag"]);

const taxonomyInputValidator = v.object({
  organizationId: v.id("organizations"),
  name: v.string(),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  hierarchical: v.boolean(),
  postTypeSlugs: v.optional(v.array(v.string())),
});

async function ensureUniqueTaxonomySlug(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations"> | undefined;
    slug: string;
    excludeId?: Id<"taxonomies">;
  },
) {
  // NOTE: Use the stable `by_slug` index and filter in memory to avoid type drift
  // when schema/indexes change during this migration.
  const matches = await ctx.db
    .query("taxonomies")
    .withIndex("by_slug", (q) => q.eq("slug", args.slug))
    .collect();
  const existing = matches.find(
    (row) => row.organizationId === args.organizationId,
  );
  if (existing && existing._id !== args.excludeId) {
    throw new ConvexError({
      message: `Taxonomy with slug "${args.slug}" already exists.`,
      code: "conflict",
    });
  }
}

async function resolveTaxonomyBySlug(
  ctx: MutationCtx,
  args: {
    slug: string;
    organizationId: Id<"organizations">;
  },
) {
  const matches = await ctx.db
    .query("taxonomies")
    .withIndex("by_slug", (q) => q.eq("slug", args.slug))
    .collect();

  const orgSpecific = matches.find(
    (row) => row.organizationId === args.organizationId,
  );
  if (orgSpecific) return orgSpecific;

  return matches.find((row) => row.organizationId === undefined) ?? null;
}

const DEFAULT_TAXONOMIES = [
  {
    name: "Categories",
    slug: "category",
    description: "Hierarchical organization for posts.",
    hierarchical: true,
  },
  {
    name: "Tags",
    slug: "post_tag",
    description: "Non-hierarchical tags for posts.",
    hierarchical: false,
  },
] as const;

export async function seedDefaultTaxonomies(ctx: MutationCtx) {
  const now = Date.now();
  const created: string[] = [];
  for (const taxonomy of DEFAULT_TAXONOMIES) {
    const matches = await ctx.db
      .query("taxonomies")
      .withIndex("by_slug", (q) => q.eq("slug", taxonomy.slug))
      .collect();
    const existing = matches.find((row) => row.organizationId === undefined);
    if (!existing) {
      await ctx.db.insert("taxonomies", {
        name: taxonomy.name,
        slug: taxonomy.slug,
        description: taxonomy.description,
        hierarchical: taxonomy.hierarchical,
        builtIn: true,
        organizationId: undefined,
        // Undefined/empty = usable by all post types by default.
        postTypeSlugs: undefined,
        createdAt: now,
        updatedAt: now,
      });
      created.push(taxonomy.slug);
    }
  }
  return created;
}

export const ensureBuiltInTaxonomies = mutation({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    return await seedDefaultTaxonomies(ctx);
  },
});

export const createTaxonomy = mutation({
  args: taxonomyInputValidator,
  returns: v.id("taxonomies"),
  handler: async (ctx, args) => {
    const slug =
      sanitizeSlug(args.slug ?? args.name) || `taxonomy-${Date.now()}`;
    if (RESERVED_TAXONOMY_SLUGS.has(slug)) {
      throw new ConvexError({
        code: "invalid_argument",
        message: `Slug "${slug}" is reserved.`,
      });
    }

    await ensureUniqueTaxonomySlug(ctx, {
      organizationId: args.organizationId,
      slug,
    });
    // Also ensure no collision with built-ins.
    await ensureUniqueTaxonomySlug(ctx, { organizationId: undefined, slug });

    const now = Date.now();
    return await ctx.db.insert("taxonomies", {
      organizationId: args.organizationId,
      name: args.name,
      slug,
      description: args.description,
      hierarchical: args.hierarchical,
      builtIn: false,
      postTypeSlugs: args.postTypeSlugs ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTaxonomy = mutation({
  args: {
    organizationId: v.id("organizations"),
    id: v.id("taxonomies"),
    data: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      hierarchical: v.optional(v.boolean()),
      postTypeSlugs: v.optional(v.array(v.string())),
    }),
  },
  returns: v.id("taxonomies"),
  handler: async (ctx, args) => {
    const taxonomy = await ctx.db.get(args.id);
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    if (taxonomy.builtIn) {
      throw new ConvexError({
        code: "forbidden",
        message: "Cannot update built-in taxonomies.",
      });
    }

    if (taxonomy.organizationId !== args.organizationId) {
      throw new ConvexError({
        code: "forbidden",
        message: "Taxonomy does not belong to this organization.",
      });
    }

    const nextSlug = sanitizeSlug(args.data.slug ?? taxonomy.slug);
    if (RESERVED_TAXONOMY_SLUGS.has(nextSlug)) {
      throw new ConvexError({
        code: "invalid_argument",
        message: `Slug "${nextSlug}" is reserved.`,
      });
    }

    await ensureUniqueTaxonomySlug(ctx, {
      organizationId: args.organizationId,
      slug: nextSlug,
      excludeId: taxonomy._id,
    });
    await ensureUniqueTaxonomySlug(ctx, {
      organizationId: undefined,
      slug: nextSlug,
    });

    await ctx.db.patch(args.id, {
      name: args.data.name ?? taxonomy.name,
      slug: nextSlug,
      description: args.data.description ?? taxonomy.description,
      hierarchical: args.data.hierarchical ?? taxonomy.hierarchical,
      postTypeSlugs: args.data.postTypeSlugs ?? taxonomy.postTypeSlugs,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const deleteTaxonomy = mutation({
  args: { organizationId: v.id("organizations"), id: v.id("taxonomies") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const taxonomy = await ctx.db.get(args.id);
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }
    if (taxonomy.builtIn) {
      throw new ConvexError({
        code: "forbidden",
        message: "Cannot delete built-in taxonomies.",
      });
    }
    if (taxonomy.organizationId !== args.organizationId) {
      throw new ConvexError({
        code: "forbidden",
        message: "Taxonomy does not belong to this organization.",
      });
    }

    const terms = await ctx.db
      .query("taxonomyTerms")
      .withIndex("by_org_and_taxonomy", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("taxonomyId", taxonomy._id),
      )
      .collect();
    for (const term of terms) {
      const meta = await ctx.db
        .query("taxonomyMeta")
        .withIndex("by_term", (q) => q.eq("termId", term._id))
        .collect();
      for (const entry of meta) {
        await ctx.db.delete(entry._id);
      }
      await ctx.db.delete(term._id);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

async function ensureUniqueTermSlug(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    taxonomyId: Id<"taxonomies">;
    slug: string;
    excludeId?: Id<"taxonomyTerms">;
  },
) {
  const existing = await ctx.db
    .query("taxonomyTerms")
    .withIndex("by_org_taxonomy_and_slug", (q) =>
      q
        .eq("organizationId", args.organizationId)
        .eq("taxonomyId", args.taxonomyId)
        .eq("slug", args.slug),
    )
    .unique();
  if (existing && existing._id !== args.excludeId) {
    throw new ConvexError({
      code: "conflict",
      message: `Term with slug "${args.slug}" already exists.`,
    });
  }
}

export const createTerm = mutation({
  args: {
    organizationId: v.id("organizations"),
    taxonomySlug: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("taxonomyTerms")),
    postTypeSlugs: v.optional(v.array(v.string())),
  },
  returns: v.id("taxonomyTerms"),
  handler: async (ctx, args) => {
    const taxonomy = await resolveTaxonomyBySlug(ctx, {
      slug: args.taxonomySlug,
      organizationId: args.organizationId,
    });
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    const slug = sanitizeSlug(args.slug ?? args.name) || `term-${Date.now()}`;
    await ensureUniqueTermSlug(ctx, {
      organizationId: args.organizationId,
      taxonomyId: taxonomy._id,
      slug,
    });

    if (!taxonomy.hierarchical && args.parentId) {
      throw new ConvexError({
        code: "invalid_argument",
        message: "Non-hierarchical taxonomies cannot have parent terms.",
      });
    }

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (
        !parent ||
        parent.organizationId !== args.organizationId ||
        parent.taxonomyId !== taxonomy._id
      ) {
        throw new ConvexError({
          code: "invalid_argument",
          message:
            "Parent term must belong to the same organization and taxonomy.",
        });
      }
    }

    const now = Date.now();
    return await ctx.db.insert("taxonomyTerms", {
      taxonomyId: taxonomy._id,
      organizationId: args.organizationId,
      name: args.name,
      slug,
      description: args.description,
      parentId: args.parentId,
      // Undefined means “all post types”.
      postTypeSlugs:
        args.postTypeSlugs && args.postTypeSlugs.length > 0
          ? args.postTypeSlugs
          : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTerm = mutation({
  args: {
    organizationId: v.id("organizations"),
    taxonomySlug: v.string(),
    termId: v.id("taxonomyTerms"),
    data: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("taxonomyTerms")),
      postTypeSlugs: v.optional(v.array(v.string())),
    }),
  },
  returns: v.id("taxonomyTerms"),
  handler: async (ctx, args) => {
    const taxonomy = await resolveTaxonomyBySlug(ctx, {
      slug: args.taxonomySlug,
      organizationId: args.organizationId,
    });
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    const term = await ctx.db.get(args.termId);
    if (
      !term ||
      term.organizationId !== args.organizationId ||
      term.taxonomyId !== taxonomy._id
    ) {
      throw new ConvexError({ code: "not_found", message: "Term not found." });
    }

    const nextSlug = args.data.slug ? sanitizeSlug(args.data.slug) : undefined;
    if (nextSlug && nextSlug !== term.slug) {
      await ensureUniqueTermSlug(ctx, {
        organizationId: args.organizationId,
        taxonomyId: taxonomy._id,
        slug: nextSlug,
        excludeId: term._id,
      });
    }

    if (!taxonomy.hierarchical && args.data.parentId) {
      throw new ConvexError({
        code: "invalid_argument",
        message: "Non-hierarchical taxonomies cannot have parent terms.",
      });
    }

    if (args.data.parentId) {
      const parent = await ctx.db.get(args.data.parentId);
      if (
        !parent ||
        parent.organizationId !== args.organizationId ||
        parent.taxonomyId !== taxonomy._id
      ) {
        throw new ConvexError({
          code: "invalid_argument",
          message:
            "Parent term must belong to the same organization and taxonomy.",
        });
      }
    }

    await ctx.db.patch(term._id, {
      name: args.data.name ?? term.name,
      slug: nextSlug ?? term.slug,
      description: args.data.description ?? term.description,
      parentId: args.data.parentId ?? term.parentId,
      postTypeSlugs:
        args.data.postTypeSlugs !== undefined
          ? args.data.postTypeSlugs.length > 0
            ? args.data.postTypeSlugs
            : undefined
          : term.postTypeSlugs,
      updatedAt: Date.now(),
    });
    return term._id;
  },
});

export const setObjectTerms = mutation({
  args: {
    organizationId: v.id("organizations"),
    objectId: v.string(),
    postTypeSlug: v.string(),
    termIds: v.array(v.id("taxonomyTerms")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const normalizedPostTypeSlug = args.postTypeSlug.toLowerCase();
    const rows = await ctx.db
      .query("taxonomyObjectTerms")
      .withIndex("by_org_and_object", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("objectId", args.objectId),
      )
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }

    const now = Date.now();
    for (const termId of args.termIds) {
      await ctx.db.insert("taxonomyObjectTerms", {
        organizationId: args.organizationId,
        objectId: args.objectId,
        postTypeSlug: normalizedPostTypeSlug,
        termId,
        createdAt: now,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const deleteTerm = mutation({
  args: {
    organizationId: v.id("organizations"),
    taxonomySlug: v.string(),
    termId: v.id("taxonomyTerms"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const taxonomy = await resolveTaxonomyBySlug(ctx, {
      slug: args.taxonomySlug,
      organizationId: args.organizationId,
    });
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    const root = await ctx.db.get(args.termId);
    if (
      !root ||
      root.organizationId !== args.organizationId ||
      root.taxonomyId !== taxonomy._id
    ) {
      throw new ConvexError({ code: "not_found", message: "Term not found." });
    }

    const allTerms = await ctx.db
      .query("taxonomyTerms")
      .withIndex("by_org_and_taxonomy", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("taxonomyId", taxonomy._id),
      )
      .collect();

    const byParent = new Map<
      Id<"taxonomyTerms"> | undefined,
      Id<"taxonomyTerms">[]
    >();
    for (const term of allTerms) {
      const parentKey = term.parentId ?? undefined;
      const list = byParent.get(parentKey) ?? [];
      list.push(term._id);
      byParent.set(parentKey, list);
    }

    const toDelete: Id<"taxonomyTerms">[] = [];
    const queue: Id<"taxonomyTerms">[] = [root._id];
    while (queue.length) {
      const current = queue.shift();
      if (!current) break;
      toDelete.push(current);
      const children = byParent.get(current) ?? [];
      queue.push(...children);
    }

    for (const termId of toDelete) {
      const meta = await ctx.db
        .query("taxonomyMeta")
        .withIndex("by_term", (q) => q.eq("termId", termId))
        .collect();
      for (const entry of meta) {
        await ctx.db.delete(entry._id);
      }
      await ctx.db.delete(termId);
    }

    return true;
  },
});

export const setTermMeta = mutation({
  args: {
    organizationId: v.id("organizations"),
    termId: v.id("taxonomyTerms"),
    key: v.string(),
    value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  },
  returns: v.id("taxonomyMeta"),
  handler: async (ctx, args) => {
    const term = await ctx.db.get(args.termId);
    if (!term || term.organizationId !== args.organizationId) {
      throw new ConvexError({ code: "not_found", message: "Term not found." });
    }

    const existing = await ctx.db
      .query("taxonomyMeta")
      .withIndex("by_term_and_key", (q) =>
        q.eq("termId", args.termId).eq("key", args.key),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("taxonomyMeta", {
      termId: args.termId,
      key: args.key,
      value: args.value,
      createdAt: now,
      updatedAt: now,
    });
  },
});
