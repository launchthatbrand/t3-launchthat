import React from "react";
import { type Config } from "@measured/puck";

import type { ActivitySummaryProps } from "./ActivitySummary";
import type { AnnouncementsProps } from "./Announcements";
import type { ContainerProps } from "./Container";
import type { DiscussionsProps } from "./Discussions";
import type { GridProps } from "./Grid";
import type { GroupOverviewProps } from "./GroupOverview";
import type { TextProps } from "./Text";
import type { UpcomingEventsMembersProps } from "./UpcomingEventsMembers";
import { ActivitySummary } from "./ActivitySummary";
import { Announcements } from "./Announcements";
import { Container } from "./Container";
import { Discussions } from "./Discussions";
import { Grid } from "./Grid";
import { GroupOverview } from "./GroupOverview";
import { Text } from "./Text";
import { UpcomingEventsMembers } from "./UpcomingEventsMembers";

// Mock data for the default state when creating new components
const mockGroupData = {
  groupId: "demo-group",
  creationTime: Date.now(),
  description: "This is a sample group for demonstration purposes.",
  categoryTags: ["Demo", "Sample", "Testing"],
  stats: {
    memberCount: 24,
    postCount: 56,
    eventCount: 3,
    activeMembers: 15,
  },
  latestPosts: [
    {
      _id: "post1",
      _creationTime: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      title: "Welcome to our group!",
      content:
        "This is a welcome post with some information about what we'll be doing in this group.",
      author: {
        name: "Admin User",
        profileImageUrl: null,
      },
    },
    {
      _id: "post2",
      _creationTime: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      title: "Upcoming events",
      content:
        "We have several exciting events planned for the next few weeks. Check them out!",
      author: {
        name: "Event Coordinator",
        profileImageUrl: null,
      },
    },
  ],
  upcomingEvents: [
    {
      _id: "event1",
      title: "Monthly Meetup",
      startTime: Date.now() + 1000 * 60 * 60 * 24 * 3, // 3 days from now
    },
    {
      _id: "event2",
      title: "Workshop Session",
      startTime: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days from now
    },
  ],
  activeMembers: [
    {
      _id: "member1",
      name: "John Doe",
      profileImageUrl: null,
      role: "admin" as const,
    },
    {
      _id: "member2",
      name: "Jane Smith",
      profileImageUrl: null,
      role: "moderator" as const,
    },
    {
      _id: "member3",
      name: "Alex Johnson",
      profileImageUrl: null,
      role: "member" as const,
    },
  ],
};

// Define the Puck configuration
export const config: Config = {
  root: {
    render: ({ children }) =>
      React.createElement("div", { className: "mt-6" }, children),
  },
  components: {
    Container: {
      render: Container,
      fields: {
        className: {
          type: "text",
          label: "Custom Classes",
        },
      },
    },
    Grid: {
      render: Grid,
      fields: {
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "1 Column", value: 1 },
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
            { label: "4 Columns", value: 4 },
          ],
          defaultValue: 3,
        },
        gap: {
          type: "select",
          label: "Gap Size",
          options: [
            { label: "Small", value: 2 },
            { label: "Medium", value: 4 },
            { label: "Large", value: 6 },
            { label: "Extra Large", value: 8 },
          ],
          defaultValue: 6,
        },
        className: {
          type: "text",
          label: "Custom Classes",
        },
      },
    },
    Text: {
      render: Text,
      fields: {
        content: {
          type: "rich-text",
          label: "Content",
          defaultValue: "Your text here",
        },
        variant: {
          type: "select",
          label: "Text Style",
          options: [
            { label: "Heading 1", value: "h1" },
            { label: "Heading 2", value: "h2" },
            { label: "Heading 3", value: "h3" },
            { label: "Heading 4", value: "h4" },
            { label: "Paragraph", value: "p" },
            { label: "Lead Paragraph", value: "lead" },
            { label: "Small Text", value: "small" },
          ],
          defaultValue: "p",
        },
        align: {
          type: "select",
          label: "Alignment",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "left",
        },
        className: {
          type: "text",
          label: "Custom Classes",
        },
      },
    },
    GroupOverview: {
      render: GroupOverview,
      fields: {
        title: {
          type: "text",
          label: "Card Title",
          defaultValue: "Group Overview",
        },
        description: {
          type: "textarea",
          label: "Group Description",
          defaultValue: mockGroupData.description,
        },
        categoryTags: {
          type: "array",
          label: "Category Tags",
          arrayFields: {
            type: "text",
          },
          defaultValue: mockGroupData.categoryTags,
        },
        creationTime: {
          type: "number",
          label: "Creation Time (Timestamp)",
          defaultValue: mockGroupData.creationTime,
        },
      },
    },
    ActivitySummary: {
      render: ActivitySummary,
      fields: {
        title: {
          type: "text",
          label: "Card Title",
          defaultValue: "Activity Summary",
        },
        description: {
          type: "text",
          label: "Card Description",
          defaultValue: "Group engagement metrics",
        },
        memberCount: {
          type: "number",
          label: "Member Count",
          defaultValue: mockGroupData.stats.memberCount,
        },
        postCount: {
          type: "number",
          label: "Post Count",
          defaultValue: mockGroupData.stats.postCount,
        },
        eventCount: {
          type: "number",
          label: "Event Count",
          defaultValue: mockGroupData.stats.eventCount,
        },
        activeMembers: {
          type: "number",
          label: "Active Members",
          defaultValue: mockGroupData.stats.activeMembers,
        },
        isLoading: {
          type: "boolean",
          label: "Show Loading State",
          defaultValue: false,
        },
      },
    },
    Announcements: {
      render: Announcements,
      fields: {
        title: {
          type: "text",
          label: "Card Title",
          defaultValue: "Announcements",
        },
        description: {
          type: "text",
          label: "Card Description",
          defaultValue: "Important group updates",
        },
        groupId: {
          type: "text",
          label: "Group ID",
          defaultValue: mockGroupData.groupId,
        },
        isLoading: {
          type: "boolean",
          label: "Show Loading State",
          defaultValue: false,
        },
      },
      defaultProps: {
        latestPosts: mockGroupData.latestPosts,
      },
    },
    Discussions: {
      render: Discussions,
      fields: {
        title: {
          type: "text",
          label: "Card Title",
          defaultValue: "Recent Discussions",
        },
        description: {
          type: "text",
          label: "Card Description",
          defaultValue: "Latest conversations in the group",
        },
        groupId: {
          type: "text",
          label: "Group ID",
          defaultValue: mockGroupData.groupId,
        },
        columnSpan: {
          type: "select",
          label: "Column Span",
          options: [
            { label: "Full Width", value: "full" },
            { label: "Two-Thirds Width", value: "two-thirds" },
          ],
          defaultValue: "two-thirds",
        },
        isLoading: {
          type: "boolean",
          label: "Show Loading State",
          defaultValue: false,
        },
      },
      defaultProps: {
        latestPosts: mockGroupData.latestPosts,
      },
    },
    UpcomingEventsMembers: {
      render: UpcomingEventsMembers,
      fields: {
        title: {
          type: "text",
          label: "Card Title",
          defaultValue: "Coming Up",
        },
        description: {
          type: "text",
          label: "Card Description",
          defaultValue: "Events and active members",
        },
        groupId: {
          type: "text",
          label: "Group ID",
          defaultValue: mockGroupData.groupId,
        },
        isLoading: {
          type: "boolean",
          label: "Show Loading State",
          defaultValue: false,
        },
      },
      defaultProps: {
        upcomingEvents: mockGroupData.upcomingEvents,
        activeMembers: mockGroupData.activeMembers,
      },
    },
  },
  categories: [
    {
      name: "Layout",
      components: ["Container", "Grid"],
    },
    {
      name: "Content",
      components: ["Text"],
    },
    {
      name: "Group Components",
      components: [
        "GroupOverview",
        "ActivitySummary",
        "Announcements",
        "Discussions",
        "UpcomingEventsMembers",
      ],
    },
  ],
};
