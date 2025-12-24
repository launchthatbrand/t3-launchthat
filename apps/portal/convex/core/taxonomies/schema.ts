import { defineTable } from "convex/server";
import { v } from "convex/values";

export const taxonomiesTable = defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  hierarchical: v.boolean(),
  builtIn: v.boolean(),
  // Undefined for built-in taxonomies; set for org-scoped custom taxonomies.
  organizationId: v.optional(v.id("organizations")),
  postTypeSlugs: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_builtIn", ["builtIn"])
  .index("by_org", ["organizationId"])
  .index("by_org_and_slug", ["organizationId", "slug"]);

export const taxonomyTermsTable = defineTable({
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
})
  .index("by_org_and_taxonomy", ["organizationId", "taxonomyId"])
  .index("by_org_taxonomy_and_slug", ["organizationId", "taxonomyId", "slug"])
  .index("by_org_and_parent", ["organizationId", "parentId"]);

export const taxonomyMetaTable = defineTable({
  termId: v.id("taxonomyTerms"),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_term", ["termId"])
  .index("by_term_and_key", ["termId", "key"]);

// For non-core storage kinds (e.g. component/custom posts), we track term assignments
// in a join table keyed by org + objectId.
export const taxonomyObjectTermsTable = defineTable({
  organizationId: v.id("organizations"),
  objectId: v.string(),
  postTypeSlug: v.string(),
  termId: v.id("taxonomyTerms"),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_org_and_object", ["organizationId", "objectId"])
  .index("by_org_and_term", ["organizationId", "termId"])
  .index("by_org_term_and_postTypeSlug", [
    "organizationId",
    "termId",
    "postTypeSlug",
  ]);

export const taxonomiesSchema = {
  taxonomies: taxonomiesTable,
  taxonomyTerms: taxonomyTermsTable,
  taxonomyMeta: taxonomyMetaTable,
  taxonomyObjectTerms: taxonomyObjectTermsTable,
};
