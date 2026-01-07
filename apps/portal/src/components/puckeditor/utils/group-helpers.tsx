"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * Extract group ID from the URL path
 * Handles various URL patterns that might contain a group ID
 */
export function useCurrentGroupId(): Id<"groups"> | undefined {
  const params = useParams();
  const pathname = usePathname();

  return useMemo(() => {
    // Direct group ID from params
    if (params.groupId && typeof params.groupId === "string") {
      return params.groupId as Id<"groups">;
    }

    // Extract from URL path patterns like /groups/[groupId]
    const groupPathMatch = /\/groups\/([^\/]+)/.exec(pathname);
    if (groupPathMatch?.[1]) {
      return groupPathMatch[1] as Id<"groups">;
    }

    return undefined;
  }, [params, pathname]);
}

/**
 * Fetch a list of available groups for selector options
 */
export function useGroupOptions() {
  const groups = useQuery(api.groups.queries.listGroups, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  const currentGroupId = useCurrentGroupId();

  const options = useMemo(() => {
    const result =
      groups?.page?.map((group) => ({
        label: group.name,
        value: group._id,
      })) || [];

    // Add "Current Group" option at the top when editing in a group context
    if (currentGroupId) {
      const currentGroup = groups?.page?.find(
        (group) => group._id === currentGroupId,
      );
      if (currentGroup) {
        // If the current group is in the list, move it to the top and mark it as "Current"
        const filteredOptions = result.filter(
          (option) => option.value !== currentGroupId,
        );
        return [
          { label: `Current: ${currentGroup.name}`, value: currentGroupId },
          ...filteredOptions,
        ];
      }
    }

    return result;
  }, [groups, currentGroupId]);

  return {
    options,
    currentGroupId,
    isLoading: !groups,
  };
}

/**
 * Create a common groupId field configuration for Puck components
 */
export function createGroupIdField() {
  return {
    type: "select" as const,
    label: "Group",
    options: [], // Will be populated dynamically in the component
    dynamicOptions: true,
  };
}
