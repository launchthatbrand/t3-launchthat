"use client";

import type { GroupWithDetails } from "@/types/groups";
import type { Id } from "@convex-config/_generated/dataModel";
import { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { getConvex } from "@/lib/convex";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { GroupProfileClient } from "./components/GroupProfileClient";
import { GroupDashboardEditor } from "./editor/components/GroupDashboardEditor";

interface LayoutClientWrapperProps {
  children: ReactNode;
  groupData: GroupWithDetails;
  groupId: Id<"groups">;
}

export function LayoutClientWrapper({
  children,
  groupData,
  groupId,
}: LayoutClientWrapperProps) {
  const convex = getConvex();
  const searchParams = useSearchParams();
  const isEditorMode = searchParams.get("editor") === "true";
  const group = convex.query(api.groups.queries.getGroupById, {
    groupId,
  });

  if (isEditorMode) {
    return (
      <GroupDashboardEditor
        groupId={groupId}
        initialData={group.dashboardData || undefined}
      />
    );
  }

  return (
    <GroupProfileClient groupData={groupData} groupId={groupId}>
      {children}
    </GroupProfileClient>
  );
}
