"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { Data, PuckOptions } from "@measured/puck";
import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Puck } from "@measured/puck";
import { useQuery } from "convex/react";

import { config } from "./config/puck-config";

interface PuckEditorWithGroupsProps extends Omit<PuckOptions, "config"> {
  initialData?: Data;
  onPublish?: (data: Data) => void;
}

export function PuckEditorWithGroups({
  initialData,
  onPublish,
  ...rest
}: PuckEditorWithGroupsProps) {
  const params = useParams();
  const pathname = usePathname();
  const [puckConfig, setPuckConfig] = useState(config);

  // Extract current group ID from URL
  const currentGroupId = (() => {
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
  })();

  // Fetch groups for the selector
  const groups = useQuery(api.groups.queries.listGroups, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  // Update the configuration with the group options
  useEffect(() => {
    if (!groups?.page) return;

    // Convert groups to options format
    const groupOptions = groups.page.map((group) => ({
      label: group.name,
      value: group._id,
    }));

    // If current group exists, add a special option at the top
    if (currentGroupId) {
      const currentGroup = groups.page.find(
        (group) => group._id === currentGroupId,
      );

      if (currentGroup) {
        const currentOption = {
          label: `Current: ${currentGroup.name}`,
          value: currentGroupId,
        };

        // Ensure the current group appears at the top of the list
        groupOptions.unshift(currentOption);
      }
    }

    // Create a deep copy of the config
    const newConfig = JSON.parse(JSON.stringify(config));

    // Update group fields in all group widgets
    Object.keys(newConfig.components).forEach((key) => {
      if (key.startsWith("Group") && newConfig.components[key].fields.groupId) {
        newConfig.components[key].fields.groupId.options = groupOptions;

        // Set default prop for groupId if we have a current group
        if (currentGroupId) {
          newConfig.components[key].defaultProps = {
            ...newConfig.components[key].defaultProps,
            groupId: currentGroupId,
          };
        }
      }
    });

    setPuckConfig(newConfig);
  }, [groups, currentGroupId]);

  return (
    <Puck
      config={puckConfig}
      data={initialData}
      onPublish={onPublish}
      {...rest}
    />
  );
}
