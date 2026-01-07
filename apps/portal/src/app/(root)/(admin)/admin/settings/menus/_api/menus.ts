import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useTenant } from "~/context/TenantContext";

const useOrganizationId = (): Id<"organizations"> | null => {
  const tenant = useTenant();
  const raw = tenant && typeof (tenant as { _id?: unknown })._id === "string"
    ? (tenant as { _id: string })._id
    : null;
  return raw ? (raw as Id<"organizations">) : null;
};

export const useMenus = (): { data: Doc<"menus">[]; isLoading: boolean } => {
  const organizationId = useOrganizationId();
  const result = useQuery(
    api.core.menus.queries.listMenus,
    organizationId ? { organizationId } : "skip",
  );
  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
};

export const useMenu = (menuId: Id<"menus"> | undefined) => {
  const organizationId = useOrganizationId();
  return useQuery(
    api.core.menus.queries.getMenu,
    menuId && organizationId ? { menuId, organizationId } : "skip",
  ) as Doc<"menus"> | undefined;
};

export const useMenuItems = (menuId: Id<"menus"> | undefined) => {
  const organizationId = useOrganizationId();
  return useQuery(
    api.core.menus.queries.getMenuItems,
    menuId && organizationId ? { menuId, organizationId } : "skip",
  );
};

export const useMenuByLocation = (location?: string) => {
  const organizationId = useOrganizationId();
  return useQuery(
    api.core.menus.queries.getMenuByLocation,
    location && organizationId ? { location, organizationId } : "skip",
  );
};

export const useMenuWithItemsByLocation = (location?: string) => {
  const organizationId = useOrganizationId();
  return useQuery(
    api.core.menus.queries.getMenuWithItemsByLocation,
    location && organizationId ? { location, organizationId } : "skip",
  ) as
    | {
        menu: Doc<"menus">;
        items: Doc<"menuItems">[];
      }
    | null
    | undefined;
};

export const useCreateMenu = () => useMutation(api.core.menus.mutations.createMenu);
export const useUpdateMenu = () => useMutation(api.core.menus.mutations.updateMenu);
export const useAddMenuItem = () => useMutation(api.core.menus.mutations.addMenuItem);
export const useRemoveMenuItem = () =>
  useMutation(api.core.menus.mutations.removeMenuItem);
export const useReorderMenuItems = () =>
  useMutation(api.core.menus.mutations.reorderMenuItems);
export const useUpdateMenuItem = () =>
  useMutation(api.core.menus.mutations.updateMenuItem);
