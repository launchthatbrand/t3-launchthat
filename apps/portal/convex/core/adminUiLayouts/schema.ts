import { defineTable } from "convex/server";
import { v } from "convex/values";

const scopeValidator = v.union(v.literal("dashboard"), v.literal("singlePost"));

const areaValidator = v.object({
  main: v.array(
    v.object({
      id: v.string(),
      width: v.union(v.literal("half"), v.literal("full")),
    }),
  ),
  sidebar: v.array(
    v.object({
      id: v.string(),
    }),
  ),
});

export const adminUiLayoutsTable = defineTable({
  organizationId: v.id("organizations"),
  userId: v.id("users"),
  scope: scopeValidator,
  postTypeSlug: v.union(v.string(), v.null()),
  areas: areaValidator,
  version: v.number(),
  updatedAt: v.number(),
}).index("by_org_and_user_and_scope_and_post_type", [
  "organizationId",
  "userId",
  "scope",
  "postTypeSlug",
]);

export const adminUiLayoutsSchema = {
  adminUiLayouts: adminUiLayoutsTable,
};


