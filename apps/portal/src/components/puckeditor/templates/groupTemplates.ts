import type { Id } from "@/convex/_generated/dataModel";
import type { Data } from "@measured/puck";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  data: (groupId?: Id<"groups">) => Data;
}

/**
 * Collection of predefined templates for group pages
 */
export const groupTemplates: Template[] = [
  {
    id: "default",
    name: "Default Group Page",
    description: "A standard group page with all essential widgets",
    category: "Group",
    thumbnail: "/templates/default-group.png",
    data: (groupId) => ({
      content: [
        {
          type: "HeadingBlock",
          props: {
            children: "Group Dashboard",
            level: "h1",
          },
        },
        {
          type: "TextBlock",
          props: {
            content:
              "Welcome to the group dashboard. Here you can find all group-related information and activities.",
          },
        },
        {
          type: "Spacer",
          props: {
            height: 20,
          },
        },
        {
          type: "GroupMembers",
          props: {
            title: "Group Members",
            groupId,
            maxMembers: 5,
            showRoles: "yes",
            variant: "default",
          },
        },
        {
          type: "Spacer",
          props: {
            height: 20,
          },
        },
        {
          type: "GroupActivity",
          props: {
            title: "Recent Activity",
            groupId,
            showStats: "yes",
            showTrends: "yes",
          },
        },
      ],
      root: {},
    }),
  },
  {
    id: "discussion-focused",
    name: "Discussion Focused",
    description: "A template focused on group discussions and interactions",
    category: "Group",
    thumbnail: "/templates/discussion-group.png",
    data: (groupId) => ({
      content: [
        {
          type: "HeadingBlock",
          props: {
            children: "Group Discussions",
            level: "h1",
          },
        },
        {
          type: "TextBlock",
          props: {
            content:
              "Join the conversation and connect with other group members.",
          },
        },
        {
          type: "Spacer",
          props: {
            height: 20,
          },
        },
        {
          type: "GroupDiscussions",
          props: {
            title: "Recent Discussions",
            groupId,
            maxPosts: 10,
            showAuthors: "yes",
            showAddButton: "yes",
          },
        },
        {
          type: "Spacer",
          props: {
            height: 20,
          },
        },
        {
          type: "GroupMembers",
          props: {
            title: "Active Members",
            groupId,
            maxMembers: 5,
            showRoles: "yes",
            variant: "compact",
          },
        },
      ],
      root: {},
    }),
  },
  {
    id: "resource-hub",
    name: "Resource Hub",
    description: "A template focused on files and resources",
    category: "Group",
    thumbnail: "/templates/resource-hub.png",
    data: (groupId) => ({
      content: [
        {
          type: "HeadingBlock",
          props: {
            children: "Group Resources",
            level: "h1",
          },
        },
        {
          type: "TextBlock",
          props: {
            content:
              "Access all the resources and files shared within this group.",
          },
        },
        {
          type: "Spacer",
          props: {
            height: 20,
          },
        },
        {
          type: "GroupDownloads",
          props: {
            title: "Shared Files",
            groupId,
            maxDownloads: 10,
            showUploaders: true,
            showAddButton: true,
          },
        },
        {
          type: "Spacer",
          props: {
            height: 20,
          },
        },
        {
          type: "GroupEvents",
          props: {
            title: "Upcoming Events",
            groupId,
            maxEvents: 3,
            showAttendees: "yes",
            showAddButton: "yes",
          },
        },
      ],
      root: {},
    }),
  },
  {
    id: "two-column",
    name: "Two Column Layout",
    description: "A two-column layout with member list and discussions",
    category: "Layout",
    thumbnail: "/templates/two-column.png",
    data: (groupId) => ({
      content: [
        {
          type: "HeadingBlock",
          props: {
            children: "Group Dashboard",
            level: "h1",
          },
        },
        {
          type: "Spacer",
          props: {
            height: 20,
          },
        },
        {
          type: "div",
          props: {
            className: "grid grid-cols-1 md:grid-cols-3 gap-4",
            children: [
              {
                type: "div",
                props: {
                  className: "md:col-span-2",
                  children: [
                    {
                      type: "GroupDiscussions",
                      props: {
                        title: "Discussions",
                        groupId,
                        maxPosts: 5,
                        showAuthors: "yes",
                        showAddButton: "yes",
                      },
                    },
                    {
                      type: "Spacer",
                      props: {
                        height: 20,
                      },
                    },
                    {
                      type: "GroupEvents",
                      props: {
                        title: "Events",
                        groupId,
                        maxEvents: 3,
                        showAttendees: "yes",
                        showAddButton: "yes",
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  className: "md:col-span-1",
                  children: [
                    {
                      type: "GroupMembers",
                      props: {
                        title: "Members",
                        groupId,
                        maxMembers: 10,
                        showRoles: "yes",
                        variant: "default",
                      },
                    },
                    {
                      type: "Spacer",
                      props: {
                        height: 20,
                      },
                    },
                    {
                      type: "GroupActivity",
                      props: {
                        title: "Activity",
                        groupId,
                        showStats: "yes",
                        showTrends: "no",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      root: {},
    }),
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory() {
  const categories: Record<string, Template[]> = {};

  groupTemplates.forEach((template) => {
    if (!categories[template.category]) {
      categories[template.category] = [];
    }
    categories[template.category].push(template);
  });

  return categories;
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return groupTemplates.find((template) => template.id === id);
}
