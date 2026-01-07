/**
 * Menus Queries
 *
 * This module provides query endpoints for menus.
 */
import { v } from "convex/values";

import { query } from "../../_generated/server";

const menuValidator = v.object({
  _id: v.id("menus"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  name: v.string(),
  location: v.string(),
  isBuiltIn: v.optional(v.boolean()),
  itemCount: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const menuItemValidator = v.object({
  _id: v.id("menuItems"),
  _creationTime: v.number(),
  menuId: v.id("menus"),
  parentId: v.optional(v.union(v.id("menuItems"), v.null())),
  label: v.string(),
  url: v.string(),
  order: v.optional(v.number()),
  isBuiltIn: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

/**
 * List all menus
 */
export const listMenus = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(menuValidator),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("menus")
      .withIndex("by_org_and_location", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
    return rows;
  },
});

/**
 * Get a menu by ID
 */
export const getMenu = query({
  args: {
    organizationId: v.id("organizations"),
    menuId: v.id("menus"),
  },
  returns: v.union(menuValidator, v.null()),
  handler: async (ctx, args) => {
    const menu = await ctx.db.get(args.menuId);
    if (!menu) return null;
    if (menu.organizationId !== args.organizationId) return null;
    return menu;
  },
});

/**
 * Get menu items for a specific menu
 */
export const getMenuItems = query({
  args: {
    organizationId: v.id("organizations"),
    menuId: v.id("menus"),
  },
  returns: v.array(menuItemValidator),
  handler: async (ctx, args) => {
    const menu = await ctx.db.get(args.menuId);
    if (!menu) return [];
    if (menu.organizationId !== args.organizationId) return [];

    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_menu", (q) => q.eq("menuId", args.menuId))
      .collect();

    return menuItems.sort((a, b) => a.order - b.order);
  },
});

export const getMenuByLocation = query({
  args: {
    organizationId: v.id("organizations"),
    location: v.string(),
  },
  returns: v.union(menuValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("menus")
      .withIndex("by_org_and_location", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("location", args.location),
      )
      .unique();
  },
});

export const getMenuWithItemsByLocation = query({
  args: {
    organizationId: v.id("organizations"),
    location: v.string(),
  },
  returns: v.union(
    v.object({
      menu: menuValidator,
      items: v.array(menuItemValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const menu = await ctx.db
      .query("menus")
      .withIndex("by_org_and_location", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("location", args.location),
      )
      .unique();

    if (!menu) {
      return null;
    }

    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_menu", (q) => q.eq("menuId", menu._id))
      .collect();

    return {
      menu,
      items: items.sort((a, b) => a.order - b.order),
    };
  },
});
