"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { GroupFeed } from "@/components/groups/GroupFeed";

import { TabsContent } from "@acme/ui/tabs";

export function DiscussionContent({ groupId }: { groupId: string }) {
  if (!groupId) {
    notFound();
  }

  return (
    <TabsContent value="discussion" className="outline-none">
      <h2 className="text-xl font-semibold">Group Discussion</h2>

      <div className="mt-6">
        <GroupFeed groupId={groupId as Id<"groups">} />
      </div>
    </TabsContent>
  );
}
