"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { GroupMembersDisplay } from "@/components/groups/GroupMembersDisplay";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { TabsContent } from "@acme/ui/tabs";

interface MembersContentProps {
  groupId: string;
  memberCount: number;
}

export function MembersContent({ groupId, memberCount }: MembersContentProps) {
  if (!groupId) {
    notFound();
  }

  return (
    <TabsContent value="members" className="outline-none">
      <h2 className="text-xl font-semibold">Members</h2>

      <div className="mb-4 text-sm text-muted-foreground">
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Members</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupMembersDisplay
              groupId={groupId as Id<"groups">}
              currentUserRole={null}
            />
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
