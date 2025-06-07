import type { Id } from "@convex-config/_generated/dataModel";
import { notFound } from "next/navigation";
import { getConvex } from "@/lib/convex";
import { api } from "@convex-config/_generated/api";

import { GroupDashboardEditor } from "./components/GroupDashboardEditor";

interface GroupEditorPageProps {
  params: { id: string };
}

export default async function GroupEditorPage({
  params,
}: GroupEditorPageProps) {
  const { id } = params;

  // Fetch the group data
  const convex = getConvex();
  try {
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <h1 className="mb-6 text-2xl font-bold">
          Edit Dashboard for Group: {group.name}
        </h1>

        <GroupDashboardEditor
          groupId={group._id}
          initialData={group.dashboardData || undefined}
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
