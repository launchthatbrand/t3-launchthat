import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

import { RequestsContent } from "../components/RequestsContent";

interface RequestsPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: RequestsPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | Requests",
      };
    }

    return {
      title: `${group.name} Membership Requests | WSA App`,
      description: `Manage membership requests for the ${group.name} group`,
    };
  } catch {
    return {
      title: "Group Membership Requests | WSA App",
    };
  }
}

export default async function RequestsPage({ params }: RequestsPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return <RequestsContent groupId={id} />;
}
