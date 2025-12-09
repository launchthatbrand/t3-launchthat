"use client";

export interface MenuSectionRef {
  id: string;
  label: string;
  order?: number;
}

export interface MenuItemInput {
  id: string;
  label: string;
  href: string;
  icon?: string;
  order?: number;
  parentId?: string;
  section?: MenuSectionRef;
}

export interface MenuNode {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children: MenuNode[];
  order: number;
}

export interface MenuSectionNode {
  id?: string;
  label?: string;
  order?: number;
  items: MenuNode[];
}

export interface AdminMenuContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postTypes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taxonomyAssignments?: Map<string, any[]>;
  isPluginEnabled?: (pluginId: string) => boolean;
  pluginParents?: Record<string, { parentId: string; customPath?: string }>;
}

type MenuSourceResolver = (context: AdminMenuContext) => MenuItemInput[];

class AdminMenuRegistry {
  private sources = new Map<string, MenuSourceResolver>();

  registerSource(id: string, resolver: MenuSourceResolver) {
    if (this.sources.has(id)) {
      throw new Error(`Admin menu source "${id}" is already registered.`);
    }
    this.sources.set(id, resolver);
  }

  unregisterSource(id: string) {
    this.sources.delete(id);
  }

  clear() {
    this.sources.clear();
  }

  getMenuSections(context: AdminMenuContext): MenuSectionNode[] {
    const inputs: MenuItemInput[] = [];
    for (const resolver of this.sources.values()) {
      const result = resolver(context);
      if (Array.isArray(result)) {
        inputs.push(...result);
      }
    }
    return this.buildSections(inputs);
  }

  private buildSections(items: MenuItemInput[]): MenuSectionNode[] {
    const nodes = new Map<string, MenuNode>();
    const childrenByParent = new Map<string, MenuNode[]>();

    const createNode = (item: MenuItemInput): MenuNode => ({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: item.icon,
      children: [],
      order: item.order ?? 100,
    });

    items.forEach((item) => {
      nodes.set(item.id, createNode(item));
    });

    items.forEach((item) => {
      if (item.parentId) {
        const parentChildren =
          childrenByParent.get(item.parentId) ?? ([] as MenuNode[]);
        const node = nodes.get(item.id);
        if (node) {
          parentChildren.push(node);
          childrenByParent.set(item.parentId, parentChildren);
        }
      }
    });

    childrenByParent.forEach((children, parentId) => {
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children = this.sortNodes(children);
      }
    });

    const roots = items
      .filter((item) => !item.parentId)
      .map((item) => nodes.get(item.id))
      .filter((node): node is MenuNode => Boolean(node));

    const sections = new Map<string, MenuSectionNode>();

    roots.forEach((node, index) => {
      const item = items.find((entry) => entry.id === node.id);
      const sectionRef = item?.section;
      const key = sectionRef?.id ?? "__default__";
      const existing = sections.get(key);
      if (existing) {
        existing.items.push(node);
      } else {
        sections.set(key, {
          id: sectionRef?.id,
          label: sectionRef?.label,
          order: sectionRef?.order ?? (sectionRef ? index : undefined),
          items: [node],
        });
      }
    });

    const sortedSections = Array.from(sections.values()).map((section) => ({
      ...section,
      items: this.sortNodes(section.items),
    }));

    return sortedSections.sort((a, b) => {
      const orderDiff = (a.order ?? 100) - (b.order ?? 100);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      const labelA = a.label ?? "";
      const labelB = b.label ?? "";
      return labelA.localeCompare(labelB);
    });
  }

  private sortNodes(nodes: MenuNode[]): MenuNode[] {
    return nodes.sort((a, b) => {
      const orderDiff = a.order - b.order;
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return a.label.localeCompare(b.label);
    });
  }
}

export const adminMenuRegistry = new AdminMenuRegistry();
