"use client";

import "@measured/puck/puck.css";

import type { Id } from "@convex-config/_generated/dataModel";
import type { Config, Data } from "@measured/puck";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface GroupDashboardEditorProps {
  groupId: Id<"groups">;
  initialData?: Data;
}

// Define a proper interface for component props
export interface PuckWrappedComponentProps {
  id?: string;
  props?: Record<string, unknown>;
}

// Create Puck component config
const config: Config = {
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
};

// Default initial data if none is provided
const defaultData: Data = {
  content: [
    {
      type: "HeadingBlock",
      props: {
        children: "Welcome to your group dashboard!",
        id: "heading-1",
      },
    },
  ],
  root: {},
};

export function GroupDashboardEditor({
  groupId,
  initialData,
}: GroupDashboardEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initialData ?? defaultData);
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
      <Puck
        config={config}
        data={data}
        onPublish={setData}
        //   renderHeader={({ publish }) => (
        //     <div className="flex items-center justify-between border-b bg-background p-4">
        //       <h2 className="text-lg font-semibold">Edit Dashboard</h2>
        //       <div className="flex gap-2">
        //         <Button variant="outline" onClick={() => publish()}>
        //           Preview
        //         </Button>
        //         <Button onClick={handleSave} disabled={isSaving}>
        //           {isSaving ? "Saving..." : "Save Dashboard"}
        //         </Button>
        //       </div>
        //     </div>
        //   )}
      />
    </div>
  );
}
