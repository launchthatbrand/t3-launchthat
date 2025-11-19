import { useParams, usePathname, useSearchParams } from "next/navigation";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { usePuckConfigStore } from "@/src/store/puckConfigStore";

/**
 * Hook to fetch and populate dynamic data needed for Puck editor
 * This centralizes all data fetching for dropdown options in one place
 */
export function usePuckDynamicData() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditorMode = searchParams?.get("editor") === "true";

  const resetConfig = usePuckConfigStore((state) => state.resetConfig);

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

  useEffect(() => {
    resetConfig();
  }, [resetConfig]);

  return {
    isEditorMode,
    currentGroupId,
  };
}
