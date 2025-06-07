import type { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { usePuckConfigStore } from "@/src/store/puckConfigStore";
import { useQuery } from "convex/react";

/**
 * Hook to fetch and populate dynamic data needed for Puck editor
 * This centralizes all data fetching for dropdown options in one place
 */
export function usePuckDynamicData() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditorMode = searchParams?.get("editor") === "true";

  const setGroupOptions = usePuckConfigStore((state) => state.setGroupOptions);
  const setCurrentGroupId = usePuckConfigStore(
    (state) => state.setCurrentGroupId,
  );

  // Extract current group ID from URL
  const currentGroupId = (() => {
    // Direct group ID from params
    if (params?.groupId && typeof params.groupId === "string") {
      return params.groupId as Id<"groups">;
    }

    // Extract from URL path patterns like /groups/[groupId]
    const groupPathMatch = pathname?.match(/\/groups\/([^\/]+)/);
    if (groupPathMatch && groupPathMatch[1]) {
      return groupPathMatch[1] as Id<"groups">;
    }

    return undefined;
  })();

  // Set current group ID in the store
  useEffect(() => {
    if (currentGroupId) {
      setCurrentGroupId(currentGroupId);
    }
  }, [currentGroupId, setCurrentGroupId]);

  // Fetch all groups for dropdown options
  const { groups = [] } = useQuery(api.groups.queries.listGroups, {
    filters: { active: true },
  }) || { groups: [] };

  // Update store with group options
  useEffect(() => {
    if (groups.length > 0) {
      // Convert groups to dropdown options
      const options = groups.map((group) => ({
        label: group.name,
        value: group._id,
      }));

      // If current group exists, add it at the top with a special label
      if (currentGroupId) {
        const currentGroup = groups.find((g) => g._id === currentGroupId);
        if (currentGroup) {
          // Remove the current group from the list to avoid duplication
          const filteredOptions = options.filter(
            (o) => o.value !== currentGroupId,
          );

          // Add current group as first option
          setGroupOptions(
            [
              { label: `Current: ${currentGroup.name}`, value: currentGroupId },
              ...filteredOptions,
            ],
            currentGroupId,
          );
          return;
        }
      }

      // If no current group or it wasn't found
      setGroupOptions(options);
    }
  }, [groups, currentGroupId, setGroupOptions]);

  return {
    isEditorMode,
    currentGroupId,
  };
}
