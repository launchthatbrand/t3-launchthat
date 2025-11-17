import type { Id } from "@convex-config/_generated/dataModel";
import { notFound } from "next/navigation";
import { getConvex } from "@/lib/convex";
import { api } from "@convex-config/_generated/api";

import { MembersContent } from "../components/MembersContent";

interface MembersPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: MembersPageProps) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | Members",
      };
    }

    return {
      title: `${group.name} Members | WSA App`,
      description: `Members of the ${group.name} group`,
    };
  } catch {
    return {
      title: "Group Members | WSA App",
    };
  }
}

export default async function MembersPage({ params }: MembersPageProps) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const id = resolvedParams.id;

  console.log("[MembersPage] Rendering with id:", id);

  // Fetch the group data for member count
  const convex = getConvex();
  try {
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    console.log(
      "[MembersPage] Group data:",
      group ? `Found group: ${group.name}` : "Group not found",
    );

    if (!group) {
      notFound();
    }

    return <MembersContent groupId={id} memberCount={group.memberCount} />;
  } catch (error) {
    console.error("Error fetching group data:", error);
    return (
      <div className="py-8 text-center text-muted-foreground">
        Unable to load group members
      </div>
    );
  }
}
