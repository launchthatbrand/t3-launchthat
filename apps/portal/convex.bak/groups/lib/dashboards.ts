import type { Data as _PuckData } from "@measured/puck";
import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";
import { hasGroupPermissions } from "../lib/permissions";

/**
 * Save a dashboard configuration for a group
 */
export const saveDashboardConfig = mutation({
  args: {
    groupId: v.id("groups"),
    data: v.any(), // Puck Data object
  },
  returns: v.id("groupDashboards"),
  handler: async (ctx, args) => {
    // Check permissions
    const hasPermission = await hasGroupPermissions({
      ctx,
      groupId: args.groupId,
      requiredPermissions: ["canEdit"],
    });

    if (!hasPermission) {
      throw new Error("You don't have permission to save this dashboard");
    }

    // Check if there's an existing dashboard for this group
    const existingDashboard = await ctx.db
      .query("groupDashboards")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .unique();

    if (existingDashboard) {
      // Update the existing dashboard
      await ctx.db.patch(existingDashboard._id, {
        data: args.data as Record<string, unknown>,
        updatedAt: Date.now(),
      });
      return existingDashboard._id;
    }

    // Create a new dashboard
    const dashboardId = await ctx.db.insert("groupDashboards", {
      groupId: args.groupId,
      data: args.data as Record<string, unknown>,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return dashboardId;
  },
});

/**
 * Get dashboard configuration for a group
 */
export const getDashboardConfig = query({
  args: {
    groupId: v.id("groups"),
  },
  returns: v.union(
    v.object({
      _id: v.id("groupDashboards"),
      groupId: v.id("groups"),
      data: v.any(), // Puck Data object
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Check if there's an existing dashboard for this group
    const dashboard = await ctx.db
      .query("groupDashboards")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .unique();

    if (!dashboard) {
      return null;
    }

    return dashboard;
  },
});

/**
 * Get default dashboard configuration if no custom dashboard exists
 */
export const getDefaultDashboardConfig = query({
  args: {},
  handler: async () => {
    // Simulate an async operation to satisfy the linter
    await Promise.resolve();

    // Return a default dashboard configuration
    const defaultConfig = {
      content: [
        {
          type: "Container",
          props: {
            className: "space-y-6",
            id: "container-1", // Add unique IDs to each component
          },
          children: [
            {
              type: "Text",
              props: {
                content: "Group Dashboard",
                variant: "h1",
                align: "left",
                id: "text-1",
              },
            },
            {
              type: "Grid",
              props: {
                columns: 2,
                gap: 6,
                id: "grid-1",
              },
              children: [
                {
                  type: "GroupOverview",
                  props: {
                    title: "Group Overview",
                    id: "group-overview-1",
                  },
                },
                {
                  type: "ActivitySummary",
                  props: {
                    title: "Activity Summary",
                    id: "activity-summary-1",
                  },
                },
              ],
            },
            {
              type: "Grid",
              props: {
                columns: 2,
                gap: 6,
                id: "grid-2",
              },
              children: [
                {
                  type: "Announcements",
                  props: {
                    title: "Announcements",
                    id: "announcements-1",
                  },
                },
                {
                  type: "UpcomingEventsMembers",
                  props: {
                    title: "Upcoming Events & Members",
                    id: "upcoming-events-members-1",
                  },
                },
              ],
            },
          ],
        },
      ],
      root: {},
    };

    return defaultConfig;
  },
});
