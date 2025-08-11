/**
 * Menus Mutations
 *
 * This module provides mutation endpoints for menus.
 */
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
/**
 * Create a new menu
 */
export const createMenu = mutation({
    args: {
        name: v.string(),
        location: v.string(),
        isBuiltIn: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("menus", {
            name: args.name,
            location: args.location,
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
        menuId: v.id("menus"),
        parentId: v.optional(v.union(v.id("menuItems"), v.null())),
        label: v.string(),
        url: v.string(),
        order: v.number(),
        isBuiltIn: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const menuItemId = await ctx.db.insert("menuItems", {
            menuId: args.menuId,
            parentId: args.parentId,
            label: args.label,
            url: args.url,
            order: args.order,
            isBuiltIn: args.isBuiltIn ?? false,
            createdAt: Date.now(),
        });
        // Update menu item count
        const menu = await ctx.db.get(args.menuId);
        if (menu) {
            await ctx.db.patch(args.menuId, {
                itemCount: (menu.itemCount ?? 0) + 1,
                updatedAt: Date.now(),
            });
        }
        return menuItemId;
    },
});
/**
 * Remove a menu item
 */
export const removeMenuItem = mutation({
    args: {
        itemId: v.id("menuItems"),
    },
    handler: async (ctx, args) => {
        const menuItem = await ctx.db.get(args.itemId);
        if (!menuItem) {
            throw new Error("Menu item not found");
        }
        await ctx.db.delete(args.itemId);
        // Update menu item count
        const menu = await ctx.db.get(menuItem.menuId);
        if (menu) {
            await ctx.db.patch(menuItem.menuId, {
                itemCount: Math.max((menu.itemCount ?? 1) - 1, 0),
                updatedAt: Date.now(),
            });
        }
        return null;
    },
});
/**
 * Reorder menu items
 */
export const reorderMenuItems = mutation({
    args: {
        menuId: v.id("menus"),
        itemOrders: v.array(v.object({
            itemId: v.id("menuItems"),
            order: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        for (const item of args.itemOrders) {
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
