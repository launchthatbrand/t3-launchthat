import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { mutation } from "../../_generated/server";
import { sanitizeSlug } from "../../lib/slugs";

type TermCollection = "categories" | "tags" | "custom";

const taxonomyInputValidator = v.object({
  name: v.string(),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  hierarchical: v.boolean(),
  postTypeSlugs: v.optional(v.array(v.string())),
});

async function ensureUniqueTaxonomySlug(
  ctx: MutationCtx,
  slug: string,
  excludeId?: Id<"taxonomies">,
) {
  const existing = await ctx.db
    .query("taxonomies")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new ConvexError({
      message: `Taxonomy with slug "${slug}" already exists.`,
      code: "conflict",
    });
  }
}

async function insertCategoryTerm(
  ctx: MutationCtx,
  args: {
    name: string;
    slug: string;
    description?: string;
    parentId?: Id<"categories">;
  },
) {
  const existing = await ctx.db
    .query("categories")
    .withIndex("by_slug", (q) => q.eq("slug", args.slug))
    .unique();
  if (existing) {
    throw new ConvexError({
      message: `Category with slug "${args.slug}" already exists.`,
      code: "conflict",
    });
  }
  return await ctx.db.insert("categories", {
    name: args.name,
    slug: args.slug,
    description: args.description,
    parentId: args.parentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

async function insertTagTerm(
  ctx: MutationCtx,
  args: { name: string; slug: string; description?: string },
) {
  const existing = await ctx.db
    .query("tags")
    .withIndex("by_slug", (q) => q.eq("slug", args.slug))
    .unique();
  if (existing) {
    throw new ConvexError({
      message: `Tag with slug "${args.slug}" already exists.`,
      code: "conflict",
    });
  }
  return await ctx.db.insert("tags", {
    name: args.name,
    slug: args.slug,
    description: args.description,
  });
}

async function insertCustomTerm(
  ctx: MutationCtx,
  taxonomyId: Id<"taxonomies">,
  args: {
    name: string;
    slug: string;
    description?: string;
    parentId?: Id<"taxonomyTerms">;
  },
) {
  const existing = await ctx.db
    .query("taxonomyTerms")
    .withIndex("by_taxonomy_slug", (q) =>
      q.eq("taxonomyId", taxonomyId).eq("slug", args.slug),
    )
    .unique();
  if (existing) {
    throw new ConvexError({
      message: `Term with slug "${args.slug}" already exists.`,
      code: "conflict",
    });
  }

  if (args.parentId) {
    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.taxonomyId !== taxonomyId) {
      throw new ConvexError({
        message: "Parent term must belong to the same taxonomy.",
        code: "invalid_argument",
      });
    }
  }

  return await ctx.db.insert("taxonomyTerms", {
    taxonomyId,
    name: args.name,
    slug: args.slug,
    description: args.description,
    parentId: args.parentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

async function deleteCustomTermsForTaxonomy(
  ctx: MutationCtx,
  taxonomyId: Id<"taxonomies">,
) {
  const terms = await ctx.db
    .query("taxonomyTerms")
    .withIndex("by_taxonomy", (q) => q.eq("taxonomyId", taxonomyId))
    .collect();
  for (const term of terms) {
    await ctx.db.delete(term._id);
  }
}

const DEFAULT_TAXONOMIES = [
  {
    name: "Categories",
    slug: "category",
    description: "Hierarchical organization for posts.",
    hierarchical: true,
    builtIn: true,
    termCollection: "categories" satisfies TermCollection,
    postTypeSlugs: ["posts"] as string[],
  },
  {
    name: "Tags",
    slug: "post_tag",
    description: "Non-hierarchical tags for posts.",
    hierarchical: false,
    builtIn: true,
    termCollection: "tags" satisfies TermCollection,
    postTypeSlugs: ["posts"] as string[],
  },
] as const;

export async function seedDefaultTaxonomies(ctx: MutationCtx) {
  const now = Date.now();
  const created: string[] = [];
  for (const taxonomy of DEFAULT_TAXONOMIES) {
    const existing = await ctx.db
      .query("taxonomies")
      .withIndex("by_slug", (q) => q.eq("slug", taxonomy.slug))
      .unique();
    if (!existing) {
      await ctx.db.insert("taxonomies", {
        name: taxonomy.name,
        slug: taxonomy.slug,
        description: taxonomy.description,
        hierarchical: taxonomy.hierarchical,
        builtIn: taxonomy.builtIn,
        termCollection: taxonomy.termCollection,
        postTypeSlugs: taxonomy.postTypeSlugs,
        createdAt: now,
        updatedAt: now,
      });
      created.push(taxonomy.slug);
    }
  }

  return created;
}

export const createTaxonomy = mutation({
  args: taxonomyInputValidator,
  handler: async (ctx, args) => {
    const slug =
      sanitizeSlug(args.slug ?? args.name) || `taxonomy-${Date.now()}`;
    await ensureUniqueTaxonomySlug(ctx, slug);
    const now = Date.now();
    return await ctx.db.insert("taxonomies", {
      name: args.name,
      slug,
      description: args.description,
      hierarchical: args.hierarchical,
      builtIn: false,
      termCollection: "custom",
      postTypeSlugs: args.postTypeSlugs ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTaxonomy = mutation({
  args: {
    id: v.id("taxonomies"),
    data: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      hierarchical: v.optional(v.boolean()),
      postTypeSlugs: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const taxonomy = await ctx.db.get(args.id);
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    if (taxonomy.builtIn && args.data.slug) {
      throw new ConvexError({
        code: "forbidden",
        message: "Cannot change slug for built-in taxonomy.",
      });
    }

    const nextSlug = sanitizeSlug(args.data.slug ?? taxonomy.slug);
    await ensureUniqueTaxonomySlug(ctx, nextSlug, taxonomy._id);

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
  args: { id: v.id("taxonomies") },
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
        message: "Cannot delete built-in taxonomy.",
      });
    }

    if (taxonomy.termCollection === "custom") {
      await deleteCustomTermsForTaxonomy(ctx, taxonomy._id);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

export const ensureBuiltInTaxonomies = mutation({
  args: {},
  handler: async (ctx) => {
    return await seedDefaultTaxonomies(ctx);
  },
});

export const createTerm = mutation({
  args: {
    taxonomySlug: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(
      v.union(v.id("categories"), v.id("taxonomyTerms"), v.id("tags")),
    ),
  },
  handler: async (ctx, args) => {
    const taxonomy = await ctx.db
      .query("taxonomies")
      .withIndex("by_slug", (q) => q.eq("slug", args.taxonomySlug))
      .unique();
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    const slug = sanitizeSlug(args.slug ?? args.name) || `term-${Date.now()}`;

    if (!taxonomy.hierarchical && args.parentId) {
      throw new ConvexError({
        code: "invalid_argument",
        message: "Non-hierarchical taxonomies cannot have parent terms.",
      });
    }

    if (taxonomy.termCollection === "categories") {
      return await insertCategoryTerm(ctx, {
        name: args.name,
        slug,
        description: args.description,
        parentId: args.parentId as Id<"categories"> | undefined,
      });
    }

    if (taxonomy.termCollection === "tags") {
      return await insertTagTerm(ctx, {
        name: args.name,
        slug,
        description: args.description,
      });
    }

    return await insertCustomTerm(ctx, taxonomy._id, {
      name: args.name,
      slug,
      description: args.description,
      parentId: args.parentId as Id<"taxonomyTerms"> | undefined,
    });
  },
});

export const updateTerm = mutation({
  args: {
    taxonomySlug: v.string(),
    termId: v.union(v.id("categories"), v.id("tags"), v.id("taxonomyTerms")),
    data: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      parentId: v.optional(
        v.union(v.id("categories"), v.id("taxonomyTerms"), v.id("tags")),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const taxonomy = await ctx.db
      .query("taxonomies")
      .withIndex("by_slug", (q) => q.eq("slug", args.taxonomySlug))
      .unique();
    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    const slug = args.data.slug ? sanitizeSlug(args.data.slug) : undefined;

    if (!taxonomy.hierarchical && args.data.parentId) {
      throw new ConvexError({
        code: "invalid_argument",
        message: "Non-hierarchical taxonomies cannot have parent terms.",
      });
    }

    if (taxonomy.termCollection === "categories") {
      const term = await ctx.db.get(args.termId as Id<"categories">);
      if (!term) {
        throw new ConvexError({
          code: "not_found",
          message: "Term not found.",
        });
      }
      await ctx.db.patch(term._id, {
        name: args.data.name ?? term.name,
        slug: slug ?? term.slug,
        description: args.data.description ?? term.description,
        parentId:
          args.data.parentId !== undefined
            ? ((args.data.parentId as Id<"categories"> | null) ?? undefined)
            : term.parentId,
        updatedAt: Date.now(),
      });
      return term._id;
    }

    if (taxonomy.termCollection === "tags") {
      const term = await ctx.db.get(args.termId as Id<"tags">);
      if (!term) {
        throw new ConvexError({
          code: "not_found",
          message: "Term not found.",
        });
      }
      await ctx.db.patch(term._id, {
        name: args.data.name ?? term.name,
        slug: slug ?? term.slug,
        description: args.data.description ?? term.description,
      });
      return term._id;
    }

    const term = await ctx.db.get(args.termId as Id<"taxonomyTerms">);
    if (!term || term.taxonomyId !== taxonomy._id) {
      throw new ConvexError({ code: "not_found", message: "Term not found." });
    }
    if (args.data.parentId) {
      const parent = await ctx.db.get(
        args.data.parentId as Id<"taxonomyTerms">,
      );
      if (!parent || parent.taxonomyId !== taxonomy._id) {
        throw new ConvexError({
          code: "invalid_argument",
          message: "Parent must belong to the same taxonomy.",
        });
      }
    }
    await ctx.db.patch(term._id, {
      name: args.data.name ?? term.name,
      slug: slug ?? term.slug,
      description: args.data.description ?? term.description,
      parentId:
        args.data.parentId !== undefined
          ? ((args.data.parentId as Id<"taxonomyTerms"> | null) ?? undefined)
          : term.parentId,
      updatedAt: Date.now(),
    });
    return term._id;
  },
});

export const deleteTerm = mutation({
  args: {
    taxonomySlug: v.string(),
    termId: v.union(v.id("categories"), v.id("tags"), v.id("taxonomyTerms")),
  },
  handler: async (ctx, args) => {
    const taxonomy = await ctx.db
      .query("taxonomies")
      .withIndex("by_slug", (q) => q.eq("slug", args.taxonomySlug))
      .unique();

    if (!taxonomy) {
      throw new ConvexError({
        code: "not_found",
        message: "Taxonomy not found.",
      });
    }

    const tableMap: Record<
      TermCollection,
      "categories" | "tags" | "taxonomyTerms"
    > = {
      categories: "categories",
      tags: "tags",
      custom: "taxonomyTerms",
    };

    const table = tableMap[taxonomy.termCollection];
    const term = await ctx.db.get(args.termId as Id<typeof table>);
    if (!term) {
      throw new ConvexError({
        code: "not_found",
        message: "Term not found.",
      });
    }

    if (table === "taxonomyTerms") {
      const children = await ctx.db
        .query("taxonomyTerms")
        .withIndex("by_taxonomy", (q) => q.eq("taxonomyId", taxonomy._id))
        .collect();
      const toDelete = children.filter(
        (child) => child.parentId === (term as any)._id,
      );
      for (const child of toDelete) {
        await ctx.db.delete(child._id);
      }
    }

    await ctx.db.delete(args.termId as Id<typeof table>);
    return true;
  },
});
