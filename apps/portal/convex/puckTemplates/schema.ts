import { defineTable } from "convex/server";
import { v } from "convex/values";

export const puckTemplatesTable = defineTable({
  name: v.string(),
  templateType: v.union(v.literal("single"), v.literal("archive")),
  postTypeSlug: v.string(),
  pageIdentifier: v.string(),
  scopeKey: v.string(),
  organizationId: v.optional(v.id("organizations")),
}).index("by_scope_type_slug", ["scopeKey", "templateType", "postTypeSlug"]);

