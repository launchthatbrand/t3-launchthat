/**
 * Menus Queries
 *
 * This module provides query endpoints for menus.
 */
import { v } from "convex/values";
import { query } from "../../_generated/server";
/**
 * List all menus
 */
export const listMenus = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("menus").collect();
    },
});
/**
 * Get a menu by ID
 */
export const getMenu = query({
    args: {
        menuId: v.id("menus"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.menuId);
    },
});
/**
 * Get menu items for a specific menu
 */
export const getMenuItems = query({
    args: {
        menuId: v.id("menus"),
    },
    handler: async (ctx, args) => {
        const menuItems = await ctx.db
            .query("menuItems")
            .withIndex("by_menu", (q) => q.eq("menuId", args.menuId))
            .collect();
        return menuItems;
    },
});
