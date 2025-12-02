"use client";

import type { Config, Data, Field } from "@measured/puck";
// Import wrapper components
import {
  WrappedActivitySummary,
  WrappedAnnouncements,
  WrappedContainer,
  WrappedDiscussions,
  WrappedGrid,
  WrappedGroupOverview,
  WrappedText,
  WrappedUpcomingEventsMembers,
} from "@acme/ui/group-dashboard/puck-wrappers";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";

// Define a registry of page types with their configurations
export interface EditorConfig {
  name: string;
  config: Config;
  defaultData: Data;
  fetchData?: () => Promise<Data | null>;
  saveData?: (data: Data) => Promise<void>;
}

// Registry of editor configurations for different page types
const editorRegistry: Record<string, EditorConfig> = {
  // Group dashboard editor
  "group-dashboard": {
    name: "Group Dashboard",
    config: {
      components: {
        Container: {
          render: WrappedContainer,
          fields: {
            className: { type: "text" as const },
          },
        },
        Grid: {
          render: WrappedGrid,
          fields: {
            columns: {
              type: "select" as const,
              options: [
                { label: "1 Column", value: 1 },
                { label: "2 Columns", value: 2 },
                { label: "3 Columns", value: 3 },
                { label: "4 Columns", value: 4 },
              ],
            },
            gap: {
              type: "select" as const,
              options: [
                { label: "Small", value: 2 },
                { label: "Medium", value: 4 },
                { label: "Large", value: 6 },
                { label: "Extra Large", value: 8 },
              ],
            },
            className: { type: "text" as const },
          },
        },
        Text: {
          render: WrappedText,
          fields: {
            content: { type: "text" as const },
            variant: {
              type: "select" as const,
              options: [
                { label: "Heading 1", value: "h1" },
                { label: "Heading 2", value: "h2" },
                { label: "Heading 3", value: "h3" },
                { label: "Heading 4", value: "h4" },
                { label: "Paragraph", value: "p" },
                { label: "Lead Paragraph", value: "lead" },
                { label: "Small Text", value: "small" },
              ],
            },
            align: {
              type: "select" as const,
              options: [
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" },
              ],
            },
            className: { type: "text" as const },
          },
        },
        GroupOverview: {
          render: WrappedGroupOverview,
          fields: {
            title: { type: "text" as const },
            description: { type: "textarea" as const },
            categoryTags: {
              type: "array" as const,
              arrayFields: {
                type: "text" as const,
              },
            },
            creationTime: { type: "number" as const },
          },
        },
        ActivitySummary: {
          render: WrappedActivitySummary,
          fields: {
            title: { type: "text" as const },
            description: { type: "text" as const },
            memberCount: { type: "number" as const },
            postCount: { type: "number" as const },
            eventCount: { type: "number" as const },
            activeMembers: { type: "number" as const },
            isLoading: { type: "text" as const },
          },
        },
        Announcements: {
          render: WrappedAnnouncements,
          fields: {
            title: { type: "text" as const },
            description: { type: "text" as const },
            groupId: { type: "text" as const },
            isLoading: { type: "text" as const },
          },
        },
        Discussions: {
          render: WrappedDiscussions,
          fields: {
            title: { type: "text" as const },
            description: { type: "text" as const },
            groupId: { type: "text" as const },
            columnSpan: {
              type: "select" as const,
              options: [
                { label: "Full Width", value: "full" },
                { label: "Two-Thirds Width", value: "two-thirds" },
              ],
            },
            isLoading: { type: "text" as const },
          },
        },
        UpcomingEventsMembers: {
          render: WrappedUpcomingEventsMembers,
          fields: {
            title: { type: "text" as const },
            description: { type: "text" as const },
            groupId: { type: "text" as const },
            isLoading: { type: "text" as const },
          },
        },
      },
      categories: [
        {
          title: "Layout",
          components: ["Container", "Grid"],
        },
        {
          title: "Content",
          components: ["Text"],
        },
        {
          title: "Group Components",
          components: [
            "GroupOverview",
            "ActivitySummary",
            "Announcements",
            "Discussions",
            "UpcomingEventsMembers",
          ],
        },
      ],
    },
    defaultData: {
      content: [
        {
          type: "Container",
          props: {
            id: "container-1",
          },
          children: [
            {
              type: "Text",
              props: {
                id: "text-1",
                content: "Welcome to your group dashboard!",
                variant: "h1",
                align: "center",
              },
            },
            {
              type: "Text",
              props: {
                id: "text-2",
                content:
                  "Customize this page by adding and arranging components.",
                variant: "lead",
                align: "center",
              },
            },
            {
              type: "Grid",
              props: {
                id: "grid-1",
                columns: 3,
                gap: 6,
              },
              children: [
                {
                  type: "GroupOverview",
                  props: {
                    id: "overview-1",
                    title: "Group Overview",
                    description:
                      "This is a sample group description. Edit this in the editor.",
                    categoryTags: ["Sample", "Group", "Dashboard"],
                    creationTime: Date.now(),
                  },
                },
                {
                  type: "ActivitySummary",
                  props: {
                    id: "activity-1",
                    title: "Activity Summary",
                    description: "Group engagement metrics",
                    memberCount: 0,
                    postCount: 0,
                    eventCount: 0,
                    activeMembers: 0,
                  },
                },
                {
                  type: "Announcements",
                  props: {
                    id: "announcements-1",
                    title: "Announcements",
                    description: "Important group updates",
                    groupId: "",
                  },
                },
              ],
            },
          ],
        },
      ],
      root: {},
    },
  },
  // Homepage editor
  homepage: {
    name: "Homepage",
    config: {
      components: {
        HeadingBlock: {
          fields: {
            children: {
              type: "text" as const,
              label: "Heading Text",
            },
          },
          render: ({ children }) => {
            return <h1>{children}</h1>;
          },
        },
      },
    },
    defaultData: {
      content: [
        {
          type: "HeadingBlock",
          props: {
            children: "Welcome to the Homepage",
            id: "heading-1",
          },
        },
      ],
      root: {},
    },
  },
};

// Extract groupId from a path like /admin/groups/abc123 or /groups/abc123
export function extractGroupIdFromPath(path: string): string | null {
  const match = /\/(?:admin|groups)\/([^/]+)/.exec(path);
  return match ? match[1] : null;
}

// Function to get the editor config for a given path
export function getEditorConfigForPath(path: string): EditorConfig | null {
  // Extract the group ID from the path if it's a group page
  const groupId = extractGroupIdFromPath(path);

  // Determine page type from path
  if (groupId) {
    // Any group page (admin or frontend)
    return editorRegistry["group-dashboard"] || null;
  }

  if (path === "/" || path === "/home") {
    return editorRegistry.homepage || null;
  }

  // Default to null if no matching config
  return null;
}

// Hook to get save handler for group dashboards
export function useGroupDashboardSave(groupId: string) {
  const updateGroupDashboard = useMutation(
    api.groups.mutations.updateDashboardData,
  );

  return async (data: Data) => {
    if (!groupId) return;

    await updateGroupDashboard({
      groupId: groupId as unknown as Id<"groups">,
      dashboardData: data,
    });
  };
}
