import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const menusTable = defineTable({
  name: v.string(),
  location: v.string(),
  isBuiltIn: v.optional(v.boolean()),
  itemCount: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index("by_location", ["location"]);

export const menuItemsTable = defineTable({
  menuId: v.id("menus"),
  parentId: v.optional(v.union(v.id("menuItems"), v.null())),
  label: v.string(),
  url: v.string(),
  order: v.number(),
  isBuiltIn: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_menu", ["menuId"]) // list items in a menu
  .index("by_parent", ["parentId"])
  .index("by_menu_parent_order", ["menuId", "parentId", "order"]);

export const menusSchema = defineSchema({
  menus: menusTable,
  menuItems: menuItemsTable,
});
