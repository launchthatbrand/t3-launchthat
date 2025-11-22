import { DashboardContent } from "./components/DashboardContent";
import type { Id } from "@convex-config/_generated/dataModel";
import { api } from "@convex-config/_generated/api";
import { getConvex } from "@/lib/convex";
import { getTenantScopedPageIdentifier } from "~/utils/pageIdentifier";
import { notFound } from "next/navigation";

interface GroupPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate metadata dynamically
export async function generateMetadata({ params }: GroupPageProps) {
  const id = (await params).id;

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
  const id = (await params).id;

  try {
    const convex = getConvex();

    // Get the group data
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      notFound();
    }

    // Use the new utility to generate a consistent page identifier
    const pathname = `/admin/groups/${id}`;
    const pageIdentifier = getTenantScopedPageIdentifier(pathname, {
      entityId: id,
      organizationId: group.organizationId ?? null,
    });

    // Safely handle the puckEditor data query with proper types
    let dashboardData = null;
    try {
      dashboardData = await convex.query(api.puckEditor.queries.getData, {
        pageIdentifier,
        ...(group.organizationId ? { organizationId: group.organizationId } : {}),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Continue with null dashboardData
    }

    // Determine if a custom dashboard exists based on whether we found data
    const hasCustomDashboard = typeof dashboardData === "string";

    // Render the dashboard content with appropriate props
    return (
      <div className="container mx-auto pb-12 pt-6">
        <DashboardContent
          group={group}
          hasCustomDashboard={hasCustomDashboard}
          pageIdentifier={pageIdentifier}
          organizationId={group.organizationId ?? undefined}
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
