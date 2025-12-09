"use client";

import type { MenuNode, MenuSectionNode } from "./registry";

export const ADMIN_MENU_OPTION_KEY = "adminMenuOverrides";
export const DEFAULT_SECTION_KEY = "__default__";

export interface CustomAdminMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  sectionKey?: string;
  parentId?: string;
  order?: number;
}

export interface AdminMenuOverrides {
  sectionOrder?: string[];
  orderBySection?: Record<string, string[]>;
  hiddenIds?: string[];
  labelOverrides?: Record<string, string>;
  customItems?: CustomAdminMenuItem[];
}

const sectionKeyFor = (section?: MenuSectionNode) =>
  section?.id ?? DEFAULT_SECTION_KEY;

const sortByOrderList = (nodes: MenuNode[], orderList: string[]) => {
  const orderMap = new Map(orderList.map((id, index) => [id, index]));
  return [...nodes].sort((a, b) => {
    const aRank = orderMap.get(a.id);
    const bRank = orderMap.get(b.id);
    if (aRank !== undefined && bRank !== undefined) {
      return aRank - bRank;
    }
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;
    return (
      (a.order ?? 100) - (b.order ?? 100) || a.label.localeCompare(b.label)
    );
  });
};

const mapNodeWithOverrides = (
  node: MenuNode,
  hiddenSet: Set<string>,
  labelMap: Record<string, string>,
): MenuNode | null => {
  if (hiddenSet.has(node.id)) {
    return null;
  }

  const nextChildren = node.children
    .map((child) => mapNodeWithOverrides(child, hiddenSet, labelMap))
    .filter((child): child is MenuNode => Boolean(child));

  return {
    ...node,
    label: labelMap[node.id] ?? node.label,
    children: nextChildren,
  };
};

export const applyAdminMenuOverrides = (
  sections: MenuSectionNode[],
  overrides?: AdminMenuOverrides | null,
): MenuSectionNode[] => {
  if (!overrides) {
    return sections;
  }

  const hiddenSet = new Set(overrides.hiddenIds ?? []);
  const labelMap = overrides.labelOverrides ?? {};
  const orderBySection = overrides.orderBySection ?? {};

  const customBySection = new Map<string, MenuNode[]>();
  (overrides.customItems ?? []).forEach((item) => {
    const sectionKey = item.sectionKey ?? DEFAULT_SECTION_KEY;
    const existing = customBySection.get(sectionKey) ?? [];
    existing.push({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: item.icon,
      children: [],
      order: item.order ?? 100,
    });
    customBySection.set(sectionKey, existing);
  });

  const nextSections: MenuSectionNode[] = sections.map((section) => {
    const sectionKey = sectionKeyFor(section);
    const filteredItems = section.items
      .map((item) => mapNodeWithOverrides(item, hiddenSet, labelMap))
      .filter((node): node is MenuNode => Boolean(node));

    const customItems = customBySection.get(sectionKey) ?? [];
    const combined = [...filteredItems, ...customItems];
    const orderList = orderBySection[sectionKey];
    const items =
      orderList && orderList.length > 0
        ? sortByOrderList(combined, orderList)
        : combined;

    return {
      ...section,
      items,
    };
  });

  customBySection.forEach((customItems, sectionKey) => {
    const hasSection =
      sectionKey === DEFAULT_SECTION_KEY
        ? nextSections.some((entry) => !entry.id)
        : nextSections.some((entry) => entry.id === sectionKey);

    if (!hasSection && customItems.length > 0) {
      const orderList = orderBySection[sectionKey] ?? [];
      nextSections.push({
        id: sectionKey === DEFAULT_SECTION_KEY ? undefined : sectionKey,
        label: sectionKey === DEFAULT_SECTION_KEY ? undefined : sectionKey,
        order: undefined,
        items:
          orderList.length > 0
            ? sortByOrderList(customItems, orderList)
            : customItems,
      });
    }
  });

  const keyedSections = new Map<string, MenuSectionNode>();
  nextSections.forEach((section) => {
    keyedSections.set(sectionKeyFor(section), section);
  });

  const orderedSections: MenuSectionNode[] = [];
  (overrides.sectionOrder ?? []).forEach((key) => {
    const section = keyedSections.get(key);
    if (section) {
      orderedSections.push(section);
      keyedSections.delete(key);
    }
  });

  keyedSections.forEach((section) => orderedSections.push(section));

  return orderedSections;
};
