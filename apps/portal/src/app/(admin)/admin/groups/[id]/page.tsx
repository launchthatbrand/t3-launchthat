import type { Id } from "@/convex/_generated/dataModel";
import { notFound, redirect } from "next/navigation";
import { GroupProfile } from "@/components/groups/GroupProfile";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

interface GroupProfilePageProps {
  params: { id: string };
}

// Generate metadata dynamically
export async function generateMetadata({ params }: GroupProfilePageProps) {
  try {
    const id = params.id;

    if (!id) {
      return {
        title: "Group Not Found | WSA App",
        description: "The requested group could not be found.",
      };
    }

    // Fetch the group data to use in metadata
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | WSA App",
        description: "The requested group could not be found.",
      };
    }

    return {
      title: `${group.name} | WSA App`,
      description: group.description.substring(0, 160),
    };
  } catch (error) {
    return {
      title: "Group | WSA App",
      description: "View group details",
    };
  }
}

export default function GroupProfilePage({ params }: GroupProfilePageProps) {
  // Redirect to the dashboard tab
  redirect(`/admin/groups/${params.id}/dashboard`);
}
