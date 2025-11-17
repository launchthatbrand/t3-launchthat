"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import type { Config, Data } from "@measured/puck";
import { api } from "@convex-config/_generated/api";
import { Puck } from "@measured/puck";
import { useQuery } from "convex/react";

// Import the wrapped components
import {
  WrappedActivitySummary,
  WrappedAnnouncements,
  WrappedContainer,
  WrappedDiscussions,
  WrappedGrid,
  WrappedGroupOverview,
  WrappedText,
  WrappedUpcomingEventsMembers,
} from "./puck-wrappers";

interface PuckRendererProps {
  data: Data;
  groupId: Id<"groups">;
}

export function PuckRenderer({ data, groupId }: PuckRendererProps) {
  // Fetch real data for the group
  const group = useQuery(api.groups.queries.getGroupById, {
    groupId,
  });

  // Fetch statistics
  const stats = useQuery(api.groups.queries.getGroupStats, {
    groupId,
  }) ?? {
    memberCount: 0,
    postCount: 0,
    eventCount: 0,
    activeMembers: 0,
  };

  // Fetch latest posts
  const latestPosts =
    useQuery(api.groups.queries.getLatestGroupPosts, {
      groupId,
      limit: 5,
    }) ?? [];

  // Fetch upcoming events
  const upcomingEvents =
    useQuery(api.groups.queries.getUpcomingGroupEvents, {
      groupId,
      limit: 3,
    }) ?? [];

  // Fetch active members
  const activeMembers =
    useQuery(api.groups.queries.getActiveGroupMembers, {
      groupId,
      limit: 5,
    }) ?? [];

  // Create a simple config that matches what was used in the editor
  const config: Config = {
    components: {
      Container: {
        render: WrappedContainer,
        type: "Container",
      },
      Grid: {
        render: WrappedGrid,
        type: "Grid",
      },
      Text: {
        render: WrappedText,
        type: "Text",
      },
      GroupOverview: {
        render: WrappedGroupOverview,
        type: "GroupOverview",
        defaultProps: {
          description: group?.description ?? "",
          categoryTags: group?.categoryTags ?? [],
          creationTime: group?._creationTime ?? Date.now(),
        },
      },
      ActivitySummary: {
        render: WrappedActivitySummary,
        type: "ActivitySummary",
        defaultProps: {
          memberCount: stats.memberCount,
          postCount: stats.postCount,
          eventCount: stats.eventCount,
          activeMembers: stats.activeMembers,
        },
      },
      Announcements: {
        render: WrappedAnnouncements,
        type: "Announcements",
        defaultProps: {
          latestPosts,
          groupId,
        },
      },
      Discussions: {
        render: WrappedDiscussions,
        type: "Discussions",
        defaultProps: {
          latestPosts,
          groupId,
        },
      },
      UpcomingEventsMembers: {
        render: WrappedUpcomingEventsMembers,
        type: "UpcomingEventsMembers",
        defaultProps: {
          upcomingEvents,
          activeMembers,
          groupId,
        },
      },
    },
  };

  return (
    <div className="py-4">
      <Puck
        config={config}
        data={data}
        readOnly={true}
        renderHeaderReadOnly={() => null}
      />
    </div>
  );
}
