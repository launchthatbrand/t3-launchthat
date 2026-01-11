import React from "react";

import type { PluginDefinition } from "./types";
import {
  ADMIN_DASHBOARD_METABOXES_FILTER,
  ADMIN_ECOMMERCE_PRODUCT_DETAILS_SECTIONS_FILTER,
} from "./hookSlots";
import { EcommerceDashboardMetaBox } from "~/components/commerce/admin/EcommerceDashboardMetaBox";
import { PortalOrgPlanProductSection } from "~/components/commerce/admin/PortalOrgPlanProductSection";
import type { AdminDashboardMetaBox } from "../adminDashboard/metaBoxes";
import { PORTAL_TENANT_ID } from "~/lib/tenant-fetcher";

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
              defaultWidth: "half",
              render: () => (
                <EcommerceDashboardMetaBox organizationId={orgId as never} />
              ),
            });
            return list;
          },
          priority: 10,
          acceptedArgs: 2,
        },
        {
          hook: ADMIN_ECOMMERCE_PRODUCT_DETAILS_SECTIONS_FILTER,
          callback: (value: unknown, ctx: unknown) => {
            const list = Array.isArray(value)
              ? ([...(value as React.ReactNode[])] as React.ReactNode[])
              : ([] as React.ReactNode[]);

            const c = (ctx ?? {}) as {
              postId?: string | null;
              organizationId?: string | null;
              canEdit?: boolean;
              getValue?: (key: string) => unknown;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue?: (key: string, value: any) => void;
            };

            // Only portal-root can create/assign organization plans.
            if (c.organizationId !== PORTAL_TENANT_ID) {
              return list;
            }

            const postId = typeof c.postId === "string" ? c.postId : "";
            if (!postId) {
              return list;
            }

            list.push(
              <PortalOrgPlanProductSection
                key="commerce:portal-org-plan"
                productPostId={postId}
                canEdit={Boolean(c.canEdit)}
              />,
            );

            return list;
          },
          priority: 10,
          acceptedArgs: 2,
        },
      ],
    },
  };
};


