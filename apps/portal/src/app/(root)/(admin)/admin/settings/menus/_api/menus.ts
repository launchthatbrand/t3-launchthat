import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export const useMenus = () => {
  const result = useQuery(api.core.menus.queries.listMenus, {});
  return {
    data: (result ?? []) as Doc<"menus">[],
    isLoading: result === undefined,
  };
};

export const useMenu = (menuId: Id<"menus"> | undefined) => {
  return useQuery(
    api.core.menus.queries.getMenu,
    menuId ? { menuId } : "skip",
  ) as Doc<"menus"> | undefined;
};

export const useMenuItems = (menuId: Id<"menus"> | undefined) => {
  return useQuery(
    api.core.menus.queries.getMenuItems,
    menuId ? { menuId } : "skip",
  ) as Doc<"menuItems">[] | undefined;
};

export const useMenuByLocation = (location?: string) => {
  return useQuery(
    api.core.menus.queries.getMenuByLocation,
    location ? { location } : "skip",
  ) as Doc<"menus"> | null | undefined;
};

export const useMenuWithItemsByLocation = (location?: string) => {
  return useQuery(
    api.core.menus.queries.getMenuWithItemsByLocation,
    location ? { location } : "skip",
  ) as
    | {
        menu: Doc<"menus">;
        items: Doc<"menuItems">[];
      }
    | null
    | undefined;
};

export const useCreateMenu = () =>
  useMutation(api.core.menus.mutations.createMenu);
export const useUpdateMenu = () =>
  useMutation(api.core.menus.mutations.updateMenu);
export const useAddMenuItem = () =>
  useMutation(api.core.menus.mutations.addMenuItem);
export const useRemoveMenuItem = () =>
  useMutation(api.core.menus.mutations.removeMenuItem);
export const useReorderMenuItems = () =>
  useMutation(api.core.menus.mutations.reorderMenuItems);
export const useUpdateMenuItem = () =>
  useMutation(api.core.menus.mutations.updateMenuItem);
