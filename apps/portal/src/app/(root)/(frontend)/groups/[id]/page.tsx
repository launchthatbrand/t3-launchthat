import type { Id } from "@convex-config/_generated/dataModel";
import { notFound } from "next/navigation";
import { getConvex } from "@/lib/convex";
import { api } from "@convex-config/_generated/api";

import { DashboardContent } from "./components/DashboardContent";

interface GroupPageProps {
  params: {
    id: string;
  };
}

// Generate metadata dynamically
export async function generateMetadata({ params }: GroupPageProps) {
  const id = params.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | WSA App",
      };
    }

    return {
      title: `${group.name} | Group | WSA App`,
      description: group.description.substring(0, 160),
    };
  } catch (error) {
    console.error("Error fetching group metadata:", error);
    return {
      title: "Group | WSA App",
    };
  }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const id = params.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      notFound();
    }

    // Check if this group has a custom dashboard
    const hasCustomDashboard = !!(group as any).dashboardData;

    // If it has a custom dashboard, render it with the PuckRenderer
    // Otherwise, render the standard dashboard
    return (
      <div className="container mx-auto pb-12 pt-6">
        <DashboardContent
          group={group}
          hasCustomDashboard={hasCustomDashboard}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching group:", error);
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mt-4 text-muted-foreground">
          Unable to load group information
        </p>
      </div>
    );
  }
}
