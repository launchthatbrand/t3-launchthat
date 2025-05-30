"use client";

import { Badge } from "@acme/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";

export function InvitationBadge() {
  const { user } = useUser();
  const clerkId = user?.id;

  // Direct approach: query the count using the clerk ID directly
  // Modify the countPendingInvitations function to accept clerkId instead of userId
  const pendingCount = useQuery(
    api.groups.countPendingInvitationsByClerkId,
    clerkId ? { clerkId } : "skip",
  );

  // If no count or count is 0, don't show the badge
  if (!pendingCount || pendingCount === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
    >
      {pendingCount > 99 ? "99+" : pendingCount}
    </Badge>
  );
}
