import { v } from "convex/values";

import { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

// ---------- Menu Queries ----------
export const listMenus = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("menus"),
      _creationTime: v.number(),
      name: v.string(),
      location: v.string(),
      itemCount: v.optional(v.number()),
      isBuiltIn: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("menus").collect();
  },
});

export const getMenuItems = query({
  args: { menuId: v.id("menus") },
  returns: v.array(
    v.object({
      _id: v.id("menuItems"),
      _creationTime: v.number(),
      menuId: v.id("menus"),
      parentId: v.optional(v.union(v.id("menuItems"), v.null())),
      label: v.string(),
      url: v.string(),
      order: v.number(),
      isBuiltIn: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    // Use the new index to fetch items sorted by menuId, parentId, and order
    const allMenuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_menu_parent_order", (q) => q.eq("menuId", args.menuId))
      .collect();

    // Separate top-level and nested items
    const topLevelItems = allMenuItems.filter((item) => item.parentId === null);
    const nestedItems = allMenuItems.filter((item) => item.parentId !== null);

    // Recursive function to build the hierarchical structure
    const buildHierarchy = (
      itemsToProcess: Doc<"menuItems">[],
    ): Doc<"menuItems">[] => {
      return itemsToProcess
        .sort((a, b) => a.order - b.order)
        .flatMap((item) => {
          const children = nestedItems.filter(
            (child) => child.parentId?.toString() === item._id.toString(),
          );
          return [item, ...buildHierarchy(children)];
        });
    };

    return buildHierarchy(topLevelItems);
  },
});

export const getMenu = query({
  args: { menuId: v.id("menus") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("menus"),
      _creationTime: v.number(),
      name: v.string(),
      location: v.string(),
      itemCount: v.optional(v.number()),
      isBuiltIn: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.menuId);
  },
});

// ---------- Mutations ----------
export const createMenu = mutation({
  args: {
    name: v.string(),
    location: v.string(),
  },
  returns: v.id("menus"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("menus", {
      name: args.name,
      location: args.location,
      isBuiltIn: false,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMenuItem = mutation({
  args: {
    menuId: v.id("menus"),
    parentId: v.optional(v.union(v.id("menuItems"), v.null())),
    label: v.string(),
    url: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.id("menuItems"),
  handler: async (ctx, args) => {
    const now = Date.now();
    // verify menu exists
    const menu = await ctx.db.get(args.menuId);
    if (!menu) throw new Error("Menu not found");

    let newOrder = args.order;

    if (newOrder === undefined) {
      const relevantItems = await ctx.db
        .query("menuItems")
        .withIndex("by_menu", (q) => q.eq("menuId", args.menuId))
        .filter((q) =>
          args.parentId
            ? q.eq(q.field("parentId"), args.parentId)
            : q.eq(q.field("parentId"), null),
        )
        .collect();

      const maxOrder = relevantItems.reduce(
        (max, item) => Math.max(max, item.order),
        -1,
      );
      newOrder = maxOrder + 1;
    }

    const id = await ctx.db.insert("menuItems", {
      menuId: args.menuId,
      parentId: args.parentId,
      label: args.label,
      url: args.url,
      order: newOrder,
      createdAt: now,
      updatedAt: now,
    });

    // bump item count
    await ctx.db.patch(args.menuId, { itemCount: (menu.itemCount ?? 0) + 1 });
    return id;
  },
});

export const removeMenuItem = mutation({
  args: { menuItemId: v.id("menuItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const menuItem = await ctx.db.get(args.menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }
    if (menuItem.isBuiltIn) {
      throw new Error("Cannot delete built-in menu items");
    }
    await ctx.db.delete(args.menuItemId);
    return null;
  },
});

export const seedMenuItems = mutation({
  args: {
    menuId: v.id("menus"),
    items: v.array(
      v.object({
        label: v.string(),
        url: v.string(),
        parentId: v.optional(v.union(v.id("menuItems"), v.null())),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    // Verify menu exists
    const menu = await ctx.db.get(args.menuId);
    if (!menu) throw new Error("Menu not found");

    for (const item of args.items) {
      // Calculate order for each item
      const relevantItems = await ctx.db
        .query("menuItems")
        .withIndex("by_menu", (q) => q.eq("menuId", args.menuId))
        .filter((q) =>
          item.parentId
            ? q.eq(q.field("parentId"), item.parentId)
            : q.eq(q.field("parentId"), null),
        )
        .collect();

      const maxOrder = relevantItems.reduce(
        (max, existingItem) => Math.max(max, existingItem.order),
        -1,
      );
      const newOrder = maxOrder + 1;

      await ctx.db.insert("menuItems", {
        menuId: args.menuId,
        parentId: item.parentId,
        label: item.label,
        url: item.url,
        order: newOrder,
        createdAt: now,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const reorderMenuItems = mutation({
  args: {
    menuId: v.id("menus"),
    updates: v.array(
      v.object({
        id: v.id("menuItems"),
        order: v.number(),
        parentId: v.optional(v.union(v.id("menuItems"), v.null())),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        order: update.order,
        parentId: update.parentId, // Allow updating parentId during reorder
        updatedAt: now,
      });
    }
    return null;
  },
});
