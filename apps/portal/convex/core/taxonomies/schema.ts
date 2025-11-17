import { defineTable } from "convex/server";
import { v } from "convex/values";

export const taxonomiesTable = defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  hierarchical: v.boolean(),
  builtIn: v.boolean(),
  postTypeSlugs: v.optional(v.array(v.string())),
  termCollection: v.union(
    v.literal("categories"),
    v.literal("tags"),
    v.literal("custom"),
  ),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_builtIn", ["builtIn"]);

export const taxonomyTermsTable = defineTable({
  taxonomyId: v.id("taxonomies"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  parentId: v.optional(v.id("taxonomyTerms")),
  metadata: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
  ),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_taxonomy", ["taxonomyId"])
  .index("by_taxonomy_slug", ["taxonomyId", "slug"]);

export const taxonomiesSchema = {
  taxonomies: taxonomiesTable,
  taxonomyTerms: taxonomyTermsTable,
};
