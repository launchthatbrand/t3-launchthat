import type { GroupWithDetails } from "@/types/groups";
import type { Id } from "@convex-config/_generated/dataModel";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getConvex } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";
import { api } from "@convex-config/_generated/api";

import { GroupProfileClient } from "./components/GroupProfileClient";

interface GroupProfileLayoutProps {
  children: ReactNode;
  params: { id: string };
}

export default async function GroupProfileLayout({
  children,
  params,
}: GroupProfileLayoutProps) {
  // Get the ID from params
  const { id } = params;

  // Get the current user data from Clerk
  const { userId } = await auth();

  // Server-side data fetching
  const convex = getConvex();
  let groupData: GroupWithDetails | null = null;

  try {
    groupData = (await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    })) as GroupWithDetails | null;

    if (!groupData) {
      notFound();
    }

    // Pass the server-fetched data directly to the GroupProfileClient
    return (
      <GroupProfileClient groupData={groupData} groupId={id as Id<"groups">}>
        {children}
      </GroupProfileClient>
    );
  } catch (error) {
    console.error("Error fetching group:", error);
    notFound();
  }
}
