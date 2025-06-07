import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

import { DiscussionContent } from "../components/DiscussionContent";

interface DiscussionPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: DiscussionPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | Discussion",
      };
    }

    return {
      title: `${group.name} Discussion | WSA App`,
      description: `Discussion forum for the ${group.name} group`,
    };
  } catch {
    return {
      title: "Group Discussion | WSA App",
    };
  }
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return <DiscussionContent groupId={id} />;
}
