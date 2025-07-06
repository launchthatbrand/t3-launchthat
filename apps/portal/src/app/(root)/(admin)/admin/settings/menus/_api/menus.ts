import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export function useMenus() {
  return useQuery(api.cms.menus.listMenus, {});
}

export function useMenu(menuId: Id<"menus"> | null) {
  return useQuery(api.cms.menus.getMenu, menuId ? { menuId } : "skip");
}

export function useMenuItems(menuId: Id<"menus"> | null) {
  return useQuery(api.cms.menus.getMenuItems, menuId ? { menuId } : "skip");
}

export const useCreateMenu = () => useMutation(api.cms.menus.createMenu);
export const useAddMenuItem = () => useMutation(api.cms.menus.addMenuItem);
export const useRemoveMenuItem = () =>
  useMutation(api.cms.menus.removeMenuItem);
export const useReorderMenuItems = () =>
  useMutation(api.cms.menus.reorderMenuItems);
