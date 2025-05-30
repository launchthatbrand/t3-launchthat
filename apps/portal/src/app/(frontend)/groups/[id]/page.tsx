import { DashboardContent } from "./components/DashboardContent";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";
import { notFound } from "next/navigation";

interface GroupProfilePageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata dynamically
export async function generateMetadata({ params }: GroupProfilePageProps) {
  try {
    const id = (await params).id;

    if (!id) {
      return {
        title: "Group Not Found | WSA App",
        description: "The requested group could not be found.",
      };
    }

    // Fetch the group data to use in metadata
    const convex = getConvex();

    try {
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
    } catch {
      // If the group query fails, return default metadata
      return {
        title: "Group | WSA App",
        description: "View group details",
      };
    }
  } catch {
    return {
      title: "Group | WSA App",
      description: "View group details",
    };
  }
}

export default async function GroupProfilePage({
  params,
}: GroupProfilePageProps) {
  const id = (await params).id;

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
      <DashboardContent
        description={group.description}
        categoryTags={group.categoryTags}
        creationTime={group._creationTime}
        groupId={group._id}
      />
    );
  } catch (error) {
    console.error("Error fetching group:", error);
    return (
      <div className="py-8 text-center text-muted-foreground">
        Unable to load group information
      </div>
    );
  }
}
