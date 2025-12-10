// React integration for the WordPress-style hook system
import React, { useMemo } from "react";

import type {
  HookContext,
  PluginSidebar,
  PluginSlotContent,
  PluginTab,
} from "@acme/admin-runtime";
import { applyFilters, doAction } from "@acme/admin-runtime";

/**
 * React hook to apply filters with memoization
 */
export function useApplyFilters<T>(
  hookName: string,
  defaultValue: T,
  context?: HookContext,
): T {
  return useMemo(() => {
    return applyFilters(hookName, defaultValue, context) as T;
  }, [hookName, defaultValue, context]);
}

/**
 * React hook to execute actions
 */
export function useDoAction() {
  return useMemo(() => doAction, []);
}

/**
 * Hook to get filtered tabs for admin post layouts
 */
export function usePluginTabs(
  defaultTabs: PluginTab[] = [],
  context: HookContext,
): PluginTab[] {
  return useMemo(() => {
    // Get tabs from action hooks
    const actionTabs: PluginTab[] = [];
    doAction("admin.post.tabs", actionTabs, context);

    // Combine with default tabs and apply filters
    const allTabs = [...defaultTabs, ...actionTabs];
    const filteredTabs = applyFilters(
      "admin.post.tabs.filter",
      allTabs,
      context,
    ) as PluginTab[];

    // Filter by conditions and sort by order
    const finalTabs = filteredTabs
      .filter((tab) => !tab.condition || tab.condition(context))
      .sort((a, b) => (a.order ?? 10) - (b.order ?? 10));

    return finalTabs;
  }, [defaultTabs, context]);
}

/**
 * Hook to get filtered sidebar content for admin post layouts
 */
export function usePluginSidebar(
  position: "top" | "middle" | "bottom" = "middle",
  context: HookContext,
): PluginSidebar[] {
  return useMemo(() => {
    // Get sidebar items from action hooks
    const sidebarItems: PluginSidebar[] = [];
    doAction(`admin.post.sidebar.${position}`, sidebarItems, context);

    // Apply filters
    const filteredItems = applyFilters(
      `admin.post.sidebar.${position}.filter`,
      sidebarItems,
      context,
    ) as PluginSidebar[];

    // Filter by conditions and sort by order
    return filteredItems
      .filter((item) => !item.condition || item.condition(context))
      .sort((a, b) => (a.order ?? 10) - (b.order ?? 10));
  }, [position, context]);
}

/**
 * Hook to get slot content
 */
export function useSlotContent(
  slotName: string,
  context: HookContext,
): PluginSlotContent[] {
  return useMemo(() => {
    // Get slot content from action hooks
    const slotItems: PluginSlotContent[] = [];
    doAction(`admin.post.slot.${slotName}`, slotItems, context);

    // Apply filters
    const filteredItems = applyFilters(
      `admin.post.slot.${slotName}.filter`,
      slotItems,
      context,
    ) as PluginSlotContent[];

    // Filter by conditions and sort by order
    return filteredItems
      .filter((item) => !item.condition || item.condition(context))
      .sort((a, b) => (a.order ?? 10) - (b.order ?? 10));
  }, [slotName, context]);
}

/**
 * Component to render a slot with plugin content
 */
interface SlotProps {
  name: string;
  context: HookContext;
  fallback?: React.ReactNode;
  className?: string;
}

export const Slot: React.FC<SlotProps> = ({
  name,
  context,
  fallback = null,
  className,
}) => {
  const slotContent = useSlotContent(name, context);

  if (slotContent.length === 0) {
    return fallback as React.ReactElement;
  }

  return (
    <div className={className}>
      {slotContent.map((item) => (
        <item.component key={item.id} {...context} />
      ))}
    </div>
  );
};

/**
 * Component to render sidebar content
 */
interface SidebarProps {
  position: "top" | "middle" | "bottom";
  context: HookContext;
  className?: string;
}

export const PluginSidebarContent: React.FC<SidebarProps> = ({
  position,
  context,
  className,
}) => {
  const sidebarItems = usePluginSidebar(position, context);

  if (sidebarItems.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {sidebarItems.map((item) => (
        <item.component key={item.id} {...context} />
      ))}
    </div>
  );
};
