"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { Data as PuckData } from "@measured/puck";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Edit } from "lucide-react";

import { Button } from "@acme/ui/button";

// Dynamically import the PuckRenderer to avoid server/client mismatch
const PuckRenderer = dynamic(
  () =>
    import("@/components/ui/group-dashboard/PuckRenderer").then(
      (mod) => mod.PuckRenderer,
    ),
  { ssr: false },
);

interface DashboardContentProps {
  pageIdentifier: string;
  groupId?: Id<"groups">;
  title?: string;
  editUrl?: string;
  showEditButton?: boolean;
}

/**
 * Generic component to render Puck-powered content
 * Can be used for any page with custom content stored in the puckEditor table
 */
export function DashboardContent({
  pageIdentifier,
  groupId,
  title,
  editUrl,
  showEditButton = true,
}: DashboardContentProps) {
  const router = useRouter();
  const [parsedData, setParsedData] = useState<PuckData | null>(null);

  // Query dashboard data from the puckEditor table
  const dashboardDataResult = useQuery(api.puckEditor.queries.getData, {
    pageIdentifier,
  });

  // Parse dashboard data when it changes
  useEffect(() => {
    if (typeof dashboardDataResult === "string") {
      try {
        const data = JSON.parse(dashboardDataResult) as PuckData;
        setParsedData(data);
      } catch (error) {
        console.error("Error parsing dashboard data:", error);
      }
    }
  }, [dashboardDataResult]);

  // Generate the edit URL based on the current page
  const calculatedEditUrl =
    editUrl ||
    (groupId
      ? `/admin/groups/${groupId}?editor=true`
      : `${window.location.pathname}?editor=true`);

  // If we don't have data yet, show a loading state
  if (!parsedData && !dashboardDataResult) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  // If we don't have any custom content, show a message
  if (!parsedData && typeof dashboardDataResult !== "string") {
    return (
      <div className="space-y-4">
        {title && <h1 className="text-3xl font-bold">{title}</h1>}

        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-muted-foreground">
            No custom content found for this page
          </p>
          {showEditButton && (
            <Link href={calculatedEditUrl}>
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <Edit className="h-4 w-4" />
                Create Custom Page
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title and edit button */}
      {(title || showEditButton) && (
        <div className="flex items-center justify-between">
          {title && <h1 className="text-3xl font-bold">{title}</h1>}

          {showEditButton && (
            <Link href={calculatedEditUrl} className="inline-flex">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                {parsedData ? "Edit Page" : "Create Custom Page"}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Parse the JSON string from dashboardData safely */}
      {parsedData && groupId && (
        <PuckRenderer data={parsedData} groupId={groupId} />
      )}

      {/* For non-group pages, we need to adapt the PuckRenderer or use a different renderer */}
      {parsedData && !groupId && (
        <div className="rounded-md border border-dashed border-muted p-4">
          <p className="text-center text-muted-foreground">
            Content available but needs appropriate renderer for this page type
          </p>
        </div>
      )}
    </div>
  );
}
