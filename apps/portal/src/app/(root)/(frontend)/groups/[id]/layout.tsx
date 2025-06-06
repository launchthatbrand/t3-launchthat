import type { Id } from "@/convex/_generated/dataModel";
import type { GroupWithDetails } from "@/types/groups";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";
import { auth } from "@clerk/nextjs/server";

import { GroupProfileClient } from "./components/GroupProfileClient";

interface GroupProfileLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function GroupProfileLayout({
  children,
  params,
}: GroupProfileLayoutProps) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Get the current user data from Clerk
  const { userId } = await auth();
  console.log(
    "[GroupProfileLayout] Clerk user:",
    userId ? { id: userId } : "Not authenticated",
  );

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

    console.log("[GroupProfileLayout] Group data:", {
      id: groupData._id,
      name: groupData.name,
      userMembership: groupData.userMembership,
    });

    // Pass the server-fetched data to the client component
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
