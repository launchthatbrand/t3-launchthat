import type { Id } from "@/convex/_generated/dataModel";
import type { ReactNode } from "react";

import { applyFilters } from "@acme/admin-runtime/hooks";

import { ADMIN_DASHBOARD_METABOXES_FILTER } from "../plugins/hookSlots";

export type AdminDashboardMetaBoxLocation = "main" | "sidebar";

export interface AdminDashboardContext {
  organizationId: Id<"organizations">;
  tenantSlug: string;
  enabledPluginIds?: string[];
}

export interface AdminDashboardMetaBox {
  id: string;
  title: string;
  description?: string | null;
  location: AdminDashboardMetaBoxLocation;
  priority: number;
  defaultWidth?: "half" | "full";
  render: (ctx: AdminDashboardContext) => ReactNode;
}

const isMetaBox = (value: unknown): value is AdminDashboardMetaBox => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    (v.location === "main" || v.location === "sidebar") &&
    typeof v.priority === "number" &&
    typeof v.render === "function"
  );
};

export const collectDashboardMetaBoxes = (
  location: AdminDashboardMetaBoxLocation,
  ctx: AdminDashboardContext,
): AdminDashboardMetaBox[] => {
  // The admin-runtime hook system is intentionally untyped; coerce safely.
  const applyFiltersAny = applyFilters as unknown as (
    hookName: string,
    value: unknown,
    ...args: unknown[]
  ) => unknown;

  const filteredAny = applyFiltersAny(
    ADMIN_DASHBOARD_METABOXES_FILTER,
    [],
    ctx,
  );

  const list: AdminDashboardMetaBox[] = Array.isArray(filteredAny)
    ? filteredAny.filter(isMetaBox)
    : [];

  return list
    .filter((box) => box.location === location)
    .sort((a, b) => {
      if (a.priority === b.priority) {
        return a.title.localeCompare(b.title);
      }
      return a.priority - b.priority;
    });
};
