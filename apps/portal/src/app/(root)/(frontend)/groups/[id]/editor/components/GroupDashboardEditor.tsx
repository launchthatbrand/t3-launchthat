"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import type { Data } from "@measured/puck";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/group-dashboard/puck-wrappers";
import { api } from "@convex-config/_generated/api";
import { Puck } from "@measured/puck";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

// For now, we'll use a simplified config for development

// Import the Puck components and config when we're ready to use them
// import { config } from "@/components/ui/group-dashboard/puck-config";

interface GroupDashboardEditorProps {
  groupId: Id<"groups">;
  initialData?: Data;
}

// Remove the custom wrappers
export type PuckWrappedComponentProps = {
  id?: string;
  props?: Record<string, any>;
};

// Remove the WrappedContainer, WrappedGrid, WrappedText, etc. components

// Create a simple Puck config
const config = {
  components: {
    Container: {
      render: WrappedContainer,
      fields: {
        className: { type: "text" },
      },
    },
    Grid: {
      render: WrappedGrid,
      fields: {
        columns: {
          type: "select",
          options: [
            { label: "1 Column", value: 1 },
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
            { label: "4 Columns", value: 4 },
          ],
        },
        gap: {
          type: "select",
          options: [
            { label: "Small", value: 2 },
            { label: "Medium", value: 4 },
            { label: "Large", value: 6 },
            { label: "Extra Large", value: 8 },
          ],
        },
        className: { type: "text" },
      },
    },
    Text: {
      render: WrappedText,
      fields: {
        content: { type: "text" },
        variant: {
          type: "select",
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
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        className: { type: "text" },
      },
    },
    GroupOverview: {
      render: WrappedGroupOverview,
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        categoryTags: { type: "array", arrayFields: { type: "text" } },
        creationTime: { type: "number" },
      },
    },
    ActivitySummary: {
      render: WrappedActivitySummary,
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        memberCount: { type: "number" },
        postCount: { type: "number" },
        eventCount: { type: "number" },
        activeMembers: { type: "number" },
        isLoading: { type: "boolean" },
      },
    },
    Announcements: {
      render: WrappedAnnouncements,
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        groupId: { type: "text" },
        isLoading: { type: "boolean" },
      },
    },
    Discussions: {
      render: WrappedDiscussions,
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        groupId: { type: "text" },
        columnSpan: {
          type: "select",
          options: [
            { label: "Full Width", value: "full" },
            { label: "Two-Thirds Width", value: "two-thirds" },
          ],
        },
        isLoading: { type: "boolean" },
      },
    },
    UpcomingEventsMembers: {
      render: WrappedUpcomingEventsMembers,
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        groupId: { type: "text" },
        isLoading: { type: "boolean" },
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

// Default initial data if none is provided
const defaultData: Data = {
  content: [
    {
      type: "Container",
      props: {},
      children: [
        {
          type: "Text",
          props: {
            content: "Welcome to your group dashboard!",
            variant: "h1",
            align: "center",
          },
        },
        {
          type: "Text",
          props: {
            content: "Customize this page by adding and arranging components.",
            variant: "lead",
            align: "center",
          },
        },
        {
          type: "Grid",
          props: {
            columns: 3,
            gap: 6,
          },
          children: [
            {
              type: "GroupOverview",
              props: {
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
};

export function GroupDashboardEditor({
  groupId,
  initialData,
}: GroupDashboardEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initialData || defaultData);
  const [isSaving, setIsSaving] = useState(false);

  // Convex mutation to save the dashboard data
  const updateGroupDashboard = useMutation(
    api.groups.mutations.updateDashboardData,
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await updateGroupDashboard({
        groupId,
        dashboardData: data,
      });

      toast.success("Dashboard saved successfully");
      router.refresh();
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast.error("Failed to save dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Dashboard Editor</CardTitle>
          <CardDescription>
            Customize your group dashboard by adding and arranging components.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[600px] rounded-md border">
            <Puck
              config={config}
              data={data}
              onPublish={setData}
              renderHeader={({ publish }) => (
                <div className="flex items-center justify-between border-b bg-background p-4">
                  <h2 className="text-lg font-semibold">Edit Dashboard</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => publish()}>
                      Preview
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Dashboard"}
                    </Button>
                  </div>
                </div>
              )}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Dashboard"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
