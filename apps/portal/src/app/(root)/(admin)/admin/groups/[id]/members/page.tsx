import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { GroupMembersDisplay } from "@/components/groups/GroupMembersDisplay";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface MembersPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: MembersPageProps) {
  const id = params.id;

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
  } catch (error) {
    return {
      title: "Group Members | WSA App",
    };
  }
}

export default async function MembersPage({ params }: MembersPageProps) {
  const id = params.id;

  const convex = getConvex();
  const group = await convex.query(api.groups.queries.getGroupById, {
    groupId: id as Id<"groups">,
  });

  if (!group) {
    notFound();
  }

  // Get user role from group data
  const userRole = group.userMembership?.role || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Members</h2>
        <div className="text-sm text-muted-foreground">
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupMembersDisplay groupId={group._id} currentUserRole={userRole} />
        </CardContent>
      </Card>
    </div>
  );
}
