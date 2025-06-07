import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

interface GroupOption {
  label: string;
  value: string;
}

export function useGroupData() {
  const params = useParams();
  const pathname = usePathname();
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);

  // Extract current group ID from URL
  const currentGroupId = useMemo(() => {
    // Direct group ID from params
    if (params?.groupId && typeof params.groupId === "string") {
      return params.groupId as Id<"groups">;
    }

    // For /groups/[id] pattern
    if (
      params?.id &&
      typeof params.id === "string" &&
      pathname?.includes("/groups/")
    ) {
      return params.id as Id<"groups">;
    }

    // Extract from URL path patterns like /groups/[groupId]
    const groupPathMatch = pathname?.match(/\/groups\/([^\/]+)/);
    if (groupPathMatch && groupPathMatch[1]) {
      return groupPathMatch[1] as Id<"groups">;
    }

    return undefined;
  }, [params, pathname]);

  // Fetch groups for dropdown options
  const groupsData = useQuery(api.groups.queries.listGroups, {
    filters: {}, // No specific filters - get all available groups
    paginationOpts: { numItems: 100, cursor: null },
  });

  // Process groups into dropdown options
  useEffect(() => {
    if (groupsData?.groups && groupsData.groups.length > 0) {
      // Convert groups to options format
      const options = groupsData.groups.map((group: any) => ({
        label: group.name,
        value: group._id,
      }));

      // If current group exists, add it at the top with a special label
      if (currentGroupId) {
        const currentGroup = groupsData.groups.find(
          (g: any) => g._id === currentGroupId,
        );
        if (currentGroup) {
          // Remove the current group from the list to avoid duplication
          const filteredOptions = options.filter(
            (o: any) => o.value !== currentGroupId,
          );

          // Add current group as first option
          setGroupOptions([
            { label: `Current: ${currentGroup.name}`, value: currentGroupId },
            ...filteredOptions,
          ]);
          return;
        }
      }

      // If no current group or it wasn't found
      setGroupOptions(options);
    }
  }, [groupsData, currentGroupId]);

  return {
    currentGroupId,
    groupOptions,
    isLoading: !groupsData,
  };
}
