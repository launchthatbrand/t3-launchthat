import React from "react";

import type { Id } from "@/convex/_generated/dataModel";
import type { PluginDefinition } from "./types";
import type { AdminDashboardMetaBox } from "../adminDashboard/metaBoxes";
import { ADMIN_DASHBOARD_METABOXES_FILTER } from "./hookSlots";
import { LmsDashboardMetaBox } from "~/components/lms/admin/LmsDashboardMetaBox";

export const enhanceLmsPluginDefinition = (base: PluginDefinition): PluginDefinition => {
  const baseFilters = Array.isArray(base.hooks?.filters) ? base.hooks.filters : [];

  return {
    ...base,
    hooks: {
      ...(base.hooks ?? {}),
      filters: [
        ...baseFilters,
        {
          hook: ADMIN_DASHBOARD_METABOXES_FILTER,
          callback: (value: unknown, ctx: unknown) => {
            const list: AdminDashboardMetaBox[] = Array.isArray(value)
              ? (value as AdminDashboardMetaBox[])
              : [];

            const c = (ctx ?? {}) as { organizationId?: Id<"organizations"> };
            const orgId = c.organizationId;
            if (!orgId) return list;

            list.push({
              id: "lms:dashboard",
              title: "LMS",
              description: "Courses and enrollments overview.",
              location: "main",
              priority: 15,
              defaultWidth: "half",
              render: () => <LmsDashboardMetaBox organizationId={orgId} />,
            });

            return list;
          },
          priority: 10,
          acceptedArgs: 2,
        },
      ],
    },
  };
};


