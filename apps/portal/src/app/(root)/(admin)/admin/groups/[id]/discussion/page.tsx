import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { GroupFeed } from "@/components/groups/GroupFeed";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

interface DiscussionPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: DiscussionPageProps) {
  const id = params.id;

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
  } catch (error) {
    return {
      title: "Group Discussion | WSA App",
    };
  }
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const id = params.id;

  const convex = getConvex();
  const group = await convex.query(api.groups.queries.getGroupById, {
    groupId: id as Id<"groups">,
  });

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Group Discussion</h2>
      </div>

      <GroupFeed groupId={id as Id<"groups">} />
    </div>
  );
}
