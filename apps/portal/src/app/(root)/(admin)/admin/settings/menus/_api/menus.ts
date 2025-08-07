import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export const useMenus = () => {
  return useQuery(api.core.menus.queries.listMenus, {});
};

export const useMenu = (menuId: Id<"menus"> | undefined) => {
  return useQuery(api.core.menus.queries.getMenu, menuId ? { menuId } : "skip");
};

export const useMenuItems = (menuId: Id<"menus"> | undefined) => {
  return useQuery(
    api.core.menus.queries.getMenuItems,
    menuId ? { menuId } : "skip",
  );
};

export const useCreateMenu = () => useMutation(api.core.menus.createMenu);
export const useAddMenuItem = () => useMutation(api.core.menus.addMenuItem);
export const useRemoveMenuItem = () =>
  useMutation(api.core.menus.removeMenuItem);
export const useReorderMenuItems = () =>
  useMutation(api.core.menus.reorderMenuItems);
