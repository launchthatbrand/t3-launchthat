import React from "react";

import type { PluginDefinition } from "./types";
import { ADMIN_DASHBOARD_METABOXES_FILTER } from "./hookSlots";
import { EcommerceDashboardMetaBox } from "~/components/commerce/admin/EcommerceDashboardMetaBox";
import type { AdminDashboardMetaBox } from "../adminDashboard/metaBoxes";

export const enhanceEcommercePluginDefinition = (
  base: PluginDefinition,
): PluginDefinition => {
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
            const c = (ctx ?? {}) as { organizationId?: string };
            const orgId = typeof c.organizationId === "string" ? c.organizationId : "";
            if (!orgId) return list;

            list.push({
              id: "ecommerce:dashboard",
              title: "Ecommerce",
              description: "Revenue and orders summary for this organization.",
              location: "main",
              priority: 10,
              render: () => (
                <EcommerceDashboardMetaBox organizationId={orgId as never} />
              ),
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


