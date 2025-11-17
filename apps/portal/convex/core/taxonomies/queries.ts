import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

const taxonomyValidator = v.object({
  _id: v.id("taxonomies"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  hierarchical: v.boolean(),
  builtIn: v.boolean(),
  termCollection: v.union(
    v.literal("categories"),
    v.literal("tags"),
    v.literal("custom"),
  ),
  postTypeSlugs: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const taxonomyTermValidator = v.object({
  taxonomyId: v.id("taxonomies"),
  source: v.union(
    v.literal("categories"),
    v.literal("tags"),
    v.literal("custom"),
  ),
  _id: v.union(v.id("categories"), v.id("tags"), v.id("taxonomyTerms")),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  parentId: v.optional(
    v.union(v.id("categories"), v.id("taxonomyTerms"), v.id("tags")),
  ),
  metadata: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
  ),
});

export const listTaxonomies = query({
  args: {},
  returns: v.array(taxonomyValidator),
  handler: async (ctx) => {
    return await ctx.db.query("taxonomies").collect();
  },
});

export const getTaxonomyBySlug = query({
  args: { slug: v.string() },
  returns: v.union(taxonomyValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taxonomies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const listTermsByTaxonomy = query({
  args: { slug: v.string() },
  returns: v.array(taxonomyTermValidator),
  handler: async (ctx, args) => {
    const taxonomy = await ctx.db
      .query("taxonomies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!taxonomy) {
      return [];
    }

    const base = {
      taxonomyId: taxonomy._id,
      source: taxonomy.termCollection,
    } as const;

    if (taxonomy.termCollection === "categories") {
      const categories = await ctx.db.query("categories").collect();
      return categories.map((category) => ({
        ...base,
        _id: category._id as Id<"categories">,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentId: category.parentId ?? undefined,
        metadata: category.metadata,
      }));
    }

    if (taxonomy.termCollection === "tags") {
      const tags = await ctx.db.query("tags").collect();
      return tags.map((tag) => ({
        ...base,
        _id: tag._id as Id<"tags">,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
      }));
    }

    const terms = await ctx.db
      .query("taxonomyTerms")
      .withIndex("by_taxonomy", (q) => q.eq("taxonomyId", taxonomy._id))
      .collect();

    return terms.map((term) => ({
      ...base,
      _id: term._id as Id<"taxonomyTerms">,
      name: term.name,
      slug: term.slug,
      description: term.description,
      parentId: term.parentId ?? undefined,
      metadata: term.metadata,
    }));
  },
});
