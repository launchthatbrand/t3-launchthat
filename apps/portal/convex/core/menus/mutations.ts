/**
 * Menus Mutations
 *
 * This module provides mutation endpoints for menus.
 */
import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

const ALLOWED_LOCATIONS = ["primary", "footer", "sidebar"] as const;
type MenuLocation = (typeof ALLOWED_LOCATIONS)[number];

const normalizeLocation = (value: string): MenuLocation => {
  const normalized = value.trim().toLowerCase();
  if (!ALLOWED_LOCATIONS.includes(normalized as MenuLocation)) {
    throw new ConvexError(
      `Unsupported menu location "${value}". Use ${ALLOWED_LOCATIONS.join(", ")}`,
    );
  }
  return normalized as MenuLocation;
};

/**
 * Create a new menu
 */
export const createMenu = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    location: v.string(),
    isBuiltIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const location = normalizeLocation(args.location);

    const existingMenu = await ctx.db
      .query("menus")
      .withIndex("by_org_and_location", (q) =>
        q.eq("organizationId", args.organizationId).eq("location", location),
      )
      .unique();

    if (existingMenu) {
      throw new ConvexError(
        `Location "${location}" is already assigned to the "${existingMenu.name}" menu. Update that menu instead.`,
      );
    }

    return await ctx.db.insert("menus", {
      organizationId: args.organizationId,
      name: args.name,
      location,
      isBuiltIn: args.isBuiltIn ?? false,
      itemCount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Add a menu item
 */
export const addMenuItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    menuId: v.id("menus"),
    parentId: v.optional(v.union(v.id("menuItems"), v.null())),
    label: v.string(),
    url: v.string(),
    order: v.optional(v.number()),
    isBuiltIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const menu = await ctx.db.get(args.menuId);
    if (!menu) {
      throw new ConvexError("Menu not found");
    }
    if (menu.organizationId !== args.organizationId) {
      throw new ConvexError("Menu not found");
    }

    const order =
      args.order ??
      (await ctx.db
        .query("menuItems")
        .withIndex("by_menu", (q) => q.eq("menuId", args.menuId))
        .collect()
        .then((items) => items.length));

    const menuItemId = await ctx.db.insert("menuItems", {
      menuId: args.menuId,
      parentId: args.parentId,
      label: args.label,
      url: args.url,
      order,
      isBuiltIn: args.isBuiltIn ?? false,
      createdAt: Date.now(),
    });

    // Update menu item count
    await ctx.db.patch(args.menuId, {
      itemCount: (menu.itemCount ?? 0) + 1,
      updatedAt: Date.now(),
    });

    return menuItemId;
  },
});

/**
 * Remove a menu item
 */
export const removeMenuItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    itemId: v.id("menuItems"),
  },
  handler: async (ctx, args) => {
    const menuItem = await ctx.db.get(args.itemId);
    if (!menuItem) {
      throw new ConvexError("Menu item not found");
    }
    const menu = await ctx.db.get(menuItem.menuId);
    if (!menu || menu.organizationId !== args.organizationId) {
      throw new ConvexError("Menu item not found");
    }

    await ctx.db.delete(args.itemId);

    // Update menu item count
    await ctx.db.patch(menuItem.menuId, {
      itemCount: Math.max((menu.itemCount ?? 1) - 1, 0),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Reorder menu items
 */
export const reorderMenuItems = mutation({
  args: {
    organizationId: v.id("organizations"),
    menuId: v.id("menus"),
    updates: v.array(
      v.object({
        itemId: v.id("menuItems"),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const menu = await ctx.db.get(args.menuId);
    if (!menu) {
      throw new ConvexError("Menu not found");
    }
    if (menu.organizationId !== args.organizationId) {
      throw new ConvexError("Menu not found");
    }

    for (const item of args.updates) {
      await ctx.db.patch(item.itemId, {
        order: item.order,
        updatedAt: Date.now(),
      });
    }

    // Update menu's updated timestamp
    await ctx.db.patch(args.menuId, {
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateMenu = mutation({
  args: {
    organizationId: v.id("organizations"),
    menuId: v.id("menus"),
    data: v.object({
      name: v.optional(v.string()),
      location: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existingMenu = await ctx.db.get(args.menuId);
    if (!existingMenu) {
      throw new ConvexError("Menu not found");
    }
    if (existingMenu.organizationId !== args.organizationId) {
      throw new ConvexError("Menu not found");
    }

    const patch: Record<string, unknown> = {};

    if (args.data.name && args.data.name !== existingMenu.name) {
      patch.name = args.data.name;
    }

    if (args.data.location) {
      const location = normalizeLocation(args.data.location);
      if (location !== existingMenu.location) {
        const locationInUse = await ctx.db
          .query("menus")
          .withIndex("by_org_and_location", (q) =>
            q.eq("organizationId", args.organizationId).eq("location", location),
          )
          .unique();
        if (locationInUse && locationInUse._id !== args.menuId) {
          throw new ConvexError(
            `Location "${location}" is already assigned to the "${locationInUse.name}" menu.`,
          );
        }
        patch.location = location;
      }
    }

    if (Object.keys(patch).length === 0) {
      return args.menuId;
    }

    patch.updatedAt = Date.now();
    await ctx.db.patch(args.menuId, patch);
    return args.menuId;
  },
});

export const updateMenuItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    itemId: v.id("menuItems"),
    data: v.object({
      label: v.optional(v.string()),
      url: v.optional(v.string()),
      parentId: v.optional(v.union(v.id("menuItems"), v.null())),
      order: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.itemId);
    if (!existing) {
      throw new ConvexError("Menu item not found");
    }
    const menu = await ctx.db.get(existing.menuId);
    if (!menu || menu.organizationId !== args.organizationId) {
      throw new ConvexError("Menu item not found");
    }

    const patch: Record<string, unknown> = {};

    if (args.data.label && args.data.label !== existing.label) {
      patch.label = args.data.label;
    }
    if (args.data.url && args.data.url !== existing.url) {
      patch.url = args.data.url;
    }
    if (
      Object.prototype.hasOwnProperty.call(args.data, "parentId") &&
      args.data.parentId !== existing.parentId
    ) {
      patch.parentId = args.data.parentId ?? null;
    }
    if (
      Object.prototype.hasOwnProperty.call(args.data, "order") &&
      args.data.order !== existing.order
    ) {
      patch.order = args.data.order;
    }

    if (Object.keys(patch).length === 0) {
      return args.itemId;
    }

    patch.updatedAt = Date.now();
    await ctx.db.patch(args.itemId, patch);
    return args.itemId;
  },
});
