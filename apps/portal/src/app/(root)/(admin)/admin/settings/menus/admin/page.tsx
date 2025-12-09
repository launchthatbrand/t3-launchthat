"use client";

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import "~/lib/adminMenu/sources/postTypes";
import "../../../../../../@sidebar/_components/nav-items";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { Active, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, Edit, Plus, Trash } from "lucide-react";

import {
  BuilderDndProvider,
  DragOverlayPreview,
  SortableItem,
} from "@acme/dnd";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui/toast";

import type {
  AdminMenuOverrides,
  CustomAdminMenuItem,
} from "~/lib/adminMenu/overrides";
import type { MenuNode, MenuSectionNode } from "~/lib/adminMenu/registry";
import { useTenant } from "~/context/TenantContext";
import {
  ADMIN_MENU_OPTION_KEY,
  adminMenuRegistry,
  DEFAULT_SECTION_KEY,
} from "~/lib/adminMenu";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { usePostTypes } from "../../../settings/post-types/_api/postTypes";
import { useTaxonomies } from "../../../settings/taxonomies/_api/taxonomies";

interface TaxonomyNavDefinition {
  slug: string;
  name: string;
  postTypeSlugs?: string[];
}

interface EditableMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  hidden: boolean;
  isCustom: boolean;
  sectionKey: string;
  sectionLabel?: string;
  children: EditableMenuItem[];
}

interface CustomDialogState {
  mode: "add" | "edit";
  sectionKey: string;
  item?: EditableMenuItem;
}

const BUILTIN_TAXONOMIES: TaxonomyNavDefinition[] = [
  {
    slug: "category",
    name: "Categories",
    postTypeSlugs: ["posts"],
  },
  {
    slug: "post_tag",
    name: "Tags",
    postTypeSlugs: ["posts"],
  },
] as const;

const canAccessPostType = (
  postType: Doc<"postTypes">,
  organizationId: Id<"organizations">,
) => {
  const enabledIds = postType.enabledOrganizationIds;
  if (enabledIds !== undefined) {
    if (enabledIds.length === 0) {
      if (postType.isBuiltIn && postType.organizationId === undefined) {
        return true;
      }
      return false;
    }
    return enabledIds.includes(organizationId);
  }

  if (postType.organizationId) {
    return postType.organizationId === organizationId;
  }

  return true;
};

const buildSectionLabelMap = (
  sections: MenuSectionNode[],
  overrides?: AdminMenuOverrides | null,
) => {
  const map = new Map<string, string>();
  sections.forEach((section) => {
    map.set(section.id ?? DEFAULT_SECTION_KEY, section.label ?? "General");
  });

  overrides?.customItems?.forEach((item) => {
    const key = item.sectionKey ?? DEFAULT_SECTION_KEY;
    if (!map.has(key)) {
      map.set(key, key === DEFAULT_SECTION_KEY ? "General" : key);
    }
  });

  return map;
};

const resolveSectionLabel = (sectionLabels: Map<string, string>, key: string) =>
  sectionLabels.get(key) ?? (key === DEFAULT_SECTION_KEY ? "General" : key);

const buildEditableMenuItems = (
  sections: MenuSectionNode[],
  overrides: AdminMenuOverrides | null,
  sectionLabels: Map<string, string>,
): EditableMenuItem[] => {
  const hiddenSet = new Set(overrides?.hiddenIds ?? []);
  const orderBySection = overrides?.orderBySection ?? {};
  const customBySection = new Map<string, EditableMenuItem[]>();
  const sectionOrderOverride = overrides?.sectionOrder ?? [];
  const sectionOrder = [...sectionOrderOverride];
  const sectionOrderSet = new Set(sectionOrderOverride);

  (overrides?.customItems ?? []).forEach((item) => {
    const sectionKey = item.sectionKey ?? DEFAULT_SECTION_KEY;
    const newItem: EditableMenuItem = {
      id: item.id,
      label: item.label,
      href: item.href,
      icon: item.icon,
      hidden: hiddenSet.has(item.id),
      isCustom: true,
      sectionKey,
      sectionLabel: resolveSectionLabel(sectionLabels, sectionKey),
      children: [],
    };

    const existing = customBySection.get(sectionKey);
    if (existing) {
      existing.push(newItem);
    } else {
      customBySection.set(sectionKey, [newItem]);
    }
  });

  const convertNode = (
    node: MenuNode,
    sectionKey: string,
    sectionLabel?: string,
  ): EditableMenuItem => ({
    id: node.id,
    label: node.label,
    href: node.href,
    icon: node.icon,
    hidden: hiddenSet.has(node.id),
    isCustom: false,
    sectionKey,
    sectionLabel,
    children: node.children.map((child) =>
      convertNode(child, sectionKey, sectionLabel),
    ),
  });

  const grouped = new Map<string, EditableMenuItem[]>();

  sections.forEach((section) => {
    const sectionKey = section.id ?? DEFAULT_SECTION_KEY;
    if (!grouped.has(sectionKey)) {
      grouped.set(sectionKey, []);
      if (!sectionOrderSet.has(sectionKey)) {
        sectionOrder.push(sectionKey);
        sectionOrderSet.add(sectionKey);
      }
    }
    const nodes = section.items.map((node) =>
      convertNode(
        node,
        sectionKey,
        resolveSectionLabel(sectionLabels, sectionKey),
      ),
    );
    grouped.get(sectionKey)?.push(...nodes);
  });

  customBySection.forEach((items, sectionKey) => {
    if (!grouped.has(sectionKey)) {
      grouped.set(sectionKey, []);
      if (!sectionOrderSet.has(sectionKey)) {
        sectionOrder.push(sectionKey);
        sectionOrderSet.add(sectionKey);
      }
    }
    grouped.get(sectionKey)?.push(...items);
  });

  const flattened: EditableMenuItem[] = [];
  sectionOrder.forEach((key) => {
    const items = grouped.get(key) ?? [];
    const orderList = orderBySection[key];
    const ordered =
      orderList && orderList.length > 0
        ? sortEditableItems(items, orderList)
        : items;
    flattened.push(...ordered);
  });

  return flattened;
};

const parseAdminMenuOverrides = (value: unknown): AdminMenuOverrides | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as AdminMenuOverrides;
};

const sortEditableItems = (items: EditableMenuItem[], orderList: string[]) => {
  const orderMap = new Map(orderList.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const aRank = orderMap.get(a.id);
    const bRank = orderMap.get(b.id);
    if (typeof aRank === "number" && typeof bRank === "number") {
      return aRank - bRank;
    }
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;
    return a.label.localeCompare(b.label);
  });
};

const buildOverridesFromMenu = (
  menuItems: EditableMenuItem[],
): AdminMenuOverrides => {
  const hiddenIds = new Set<string>();
  const orderBySection = new Map<string, string[]>();
  const sectionOrder: string[] = [];
  const customItems: CustomAdminMenuItem[] = [];

  const registerOrder = (sectionKey: string, itemId: string) => {
    const list = orderBySection.get(sectionKey) ?? [];
    list.push(itemId);
    orderBySection.set(sectionKey, list);
  };

  const processNode = (node: EditableMenuItem) => {
    if (node.hidden) {
      hiddenIds.add(node.id);
    }
    if (node.isCustom) {
      customItems.push({
        id: node.id,
        label: node.label,
        href: node.href,
        icon: node.icon,
        sectionKey:
          node.sectionKey === DEFAULT_SECTION_KEY ? undefined : node.sectionKey,
      });
    }
    node.children.forEach(processNode);
  };

  menuItems.forEach((item) => {
    if (!sectionOrder.includes(item.sectionKey)) {
      sectionOrder.push(item.sectionKey);
    }
    registerOrder(item.sectionKey, item.id);
    processNode(item);
  });

  const overrides: AdminMenuOverrides = {};
  if (hiddenIds.size > 0) {
    overrides.hiddenIds = Array.from(hiddenIds);
  }
  if (orderBySection.size > 0) {
    overrides.orderBySection = Object.fromEntries(orderBySection);
  }
  if (sectionOrder.length > 0) {
    overrides.sectionOrder = sectionOrder;
  }
  if (customItems.length > 0) {
    overrides.customItems = customItems;
  }

  return overrides;
};
const findMenuItemById = (
  items: EditableMenuItem[],
  targetId: string,
): EditableMenuItem | null => {
  for (const item of items) {
    if (item.id === targetId) {
      return item;
    }
    if (item.children.length > 0) {
      const match = findMenuItemById(item.children, targetId);
      if (match) {
        return match;
      }
    }
  }
  return null;
};

const reorderChildItems = (
  items: EditableMenuItem[],
  parentId: string,
  activeId: string,
  overId: string,
): EditableMenuItem[] =>
  items.map((item) => {
    if (item.id === parentId) {
      const oldIndex = item.children.findIndex(
        (child) => child.id === activeId,
      );
      const newIndex = item.children.findIndex((child) => child.id === overId);
      if (oldIndex === -1 || newIndex === -1) {
        return item;
      }
      const nextChildren = arrayMove(item.children, oldIndex, newIndex);
      return {
        ...item,
        children: nextChildren,
      };
    }
    if (item.children.length > 0) {
      return {
        ...item,
        children: reorderChildItems(item.children, parentId, activeId, overId),
      };
    }
    return item;
  });

const MenuItemRow = ({
  item,
  onToggleHidden,
  onEditCustom,
  onDeleteCustom,
  onToggleChildHidden,
}: {
  item: EditableMenuItem;
  onToggleHidden: (visible: boolean) => void;
  onEditCustom: () => void;
  onDeleteCustom: () => void;
  onToggleChildHidden: (childId: string, visible: boolean) => void;
}) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 font-medium">
            {item.label}
            {item.isCustom && (
              <span className="bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs tracking-wide uppercase">
                Custom
              </span>
            )}
          </div>
          <div className="text-muted-foreground text-xs">{item.href}</div>
          <div className="text-muted-foreground text-xs">
            {item.sectionLabel ??
              (item.sectionKey === DEFAULT_SECTION_KEY
                ? "General"
                : item.sectionKey)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Visible</Label>
            <Switch checked={!item.hidden} onCheckedChange={onToggleHidden} />
          </div>
          {item.isCustom && (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onEditCustom}
                aria-label="Edit custom link"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onDeleteCustom}
                aria-label="Delete custom link"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      {item.children.length > 0 && (
        <SortableContext
          items={item.children.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="bg-muted/50 space-y-2 rounded-md border p-3 text-xs">
            <div className="text-muted-foreground font-semibold uppercase">
              Child links
            </div>
            {item.children.map((child) => (
              <SortableItem
                key={child.id}
                id={child.id}
                data={{ type: "child", parentId: item.id }}
                className="bg-background flex flex-col gap-2 rounded-md p-3 md:flex-row md:items-center md:justify-between"
              >
                <ChildMenuContent
                  item={child}
                  onToggleHidden={(visible) =>
                    onToggleChildHidden(child.id, visible)
                  }
                />
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
};

const ChildMenuContent = ({
  item,
  onToggleHidden,
}: {
  item: EditableMenuItem;
  onToggleHidden: (visible: boolean) => void;
}) => {
  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-medium">{item.label}</div>
        <div className="text-muted-foreground">{item.href}</div>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs">Visible</Label>
        <Switch checked={!item.hidden} onCheckedChange={onToggleHidden} />
      </div>
    </div>
  );
};

const AdminMenuEditorPage = () => {
  const tenant = useTenant();
  const tenantId = tenant?._id;
  const organizationId = getTenantOrganizationId(tenant);
  const scopedOrgId = organizationId ?? tenantId;

  const postTypesQuery = usePostTypes(true);
  const taxonomiesQuery = useTaxonomies();
  const pluginOptions = useQuery(
    api.core.options.getByType,
    scopedOrgId ? { orgId: scopedOrgId, type: "site" } : "skip",
  ) as Doc<"options">[] | undefined;
  const overridesDoc = useQuery(
    api.core.options.get,
    scopedOrgId
      ? {
          orgId: scopedOrgId,
          type: "site",
          metaKey: ADMIN_MENU_OPTION_KEY,
        }
      : "skip",
  ) as Doc<"options"> | null | undefined;

  const setOption = useMutation(api.core.options.set);
  const removeOption = useMutation(api.core.options.remove);

  const contentTypes = useMemo<Doc<"postTypes">[]>(() => {
    const types = postTypesQuery.data;
    return tenantId
      ? types.filter((type) => canAccessPostType(type, tenantId))
      : types;
  }, [postTypesQuery.data, tenantId]);

  const taxonomyDefs = useMemo<TaxonomyNavDefinition[]>(() => {
    return (taxonomiesQuery.data ?? []).map((taxonomy: Doc<"taxonomies">) => ({
      slug: taxonomy.slug,
      name: taxonomy.name,
      postTypeSlugs: Array.isArray(taxonomy.postTypeSlugs)
        ? taxonomy.postTypeSlugs
        : undefined,
    }));
  }, [taxonomiesQuery.data]);

  const normalizedTaxonomies = useMemo<TaxonomyNavDefinition[]>(() => {
    const list = taxonomyDefs.map((taxonomy) => ({
      slug: taxonomy.slug,
      name: taxonomy.name,
      postTypeSlugs: taxonomy.postTypeSlugs,
    }));

    BUILTIN_TAXONOMIES.forEach((fallback) => {
      if (!list.some((entry) => entry.slug === fallback.slug)) {
        list.push({
          slug: fallback.slug,
          name: fallback.name,
          postTypeSlugs: fallback.postTypeSlugs,
        });
      }
    });

    return list;
  }, [taxonomyDefs]);

  const pluginOptionMap = useMemo(() => {
    if (!Array.isArray(pluginOptions)) {
      return new Map<string, boolean>();
    }
    return new Map(
      pluginOptions.map((option) => [
        String(option.metaKey),
        Boolean(option.metaValue),
      ]),
    );
  }, [pluginOptions]);

  const taxonomyAssignments = useMemo(() => {
    const map = new Map<string, TaxonomyNavDefinition[]>();
    const allPostTypeSlugs = contentTypes.map((type) => type.slug);

    normalizedTaxonomies.forEach((taxonomy) => {
      const targets =
        taxonomy.postTypeSlugs && taxonomy.postTypeSlugs.length > 0
          ? taxonomy.postTypeSlugs
          : allPostTypeSlugs;
      targets.forEach((slug) => {
        if (!map.has(slug)) {
          map.set(slug, []);
        }
        map.get(slug)?.push(taxonomy);
      });
    });

    contentTypes.forEach((type) => {
      if (!type.supports?.taxonomy) return;
      const current = map.get(type.slug) ?? [];
      const missingBuiltins = BUILTIN_TAXONOMIES.filter((fallback) =>
        current.every((assigned) => assigned.slug !== fallback.slug),
      );
      if (missingBuiltins.length > 0) {
        map.set(type.slug, [...current, ...missingBuiltins]);
      } else if (!map.has(type.slug) && current.length === 0) {
        map.set(type.slug, BUILTIN_TAXONOMIES.slice());
      }
    });

    return map;
  }, [normalizedTaxonomies, contentTypes]);

  const isPluginEnabled = useMemo(() => {
    const lookup = (pluginId: string) => {
      const plugin = pluginDefinitions.find(
        (definition) => definition.id === pluginId,
      );
      if (!plugin) {
        return true;
      }
      const hasAllPostTypes =
        plugin.postTypes.length === 0 ||
        plugin.postTypes.every((definition) =>
          contentTypes.some((type) => type.slug === definition.slug),
        );
      if (!hasAllPostTypes) {
        return false;
      }
      if (!plugin.activation) {
        return true;
      }
      const stored = pluginOptionMap.get(plugin.activation.optionKey);
      if (stored === undefined) {
        return plugin.activation.defaultEnabled ?? false;
      }
      return stored;
    };
    return lookup;
  }, [contentTypes, pluginOptionMap]);

  const pluginParentMap = useMemo(() => {
    const map: Record<string, { parentId: string; customPath?: string }> = {};
    pluginDefinitions.forEach((plugin) => {
      if (!plugin.settingsPages?.length) {
        return;
      }
      if (!isPluginEnabled(plugin.id)) {
        return;
      }
      plugin.postTypes.forEach((definition) => {
        map[definition.slug] = {
          parentId: `plugin:${plugin.id}`,
          customPath: definition.adminMenu?.slug,
        };
      });
    });
    return map;
  }, [isPluginEnabled]);

  const registrySections = useMemo(() => {
    return adminMenuRegistry.getMenuSections({
      postTypes: contentTypes,
      taxonomyAssignments,
      isPluginEnabled,
      pluginParents: pluginParentMap,
    });
  }, [contentTypes, taxonomyAssignments, isPluginEnabled, pluginParentMap]);

  const overrides = parseAdminMenuOverrides(overridesDoc?.metaValue ?? null);
  const sectionLabelMap = useMemo(
    () => buildSectionLabelMap(registrySections, overrides),
    [registrySections, overrides],
  );
  const initialMenuItems = useMemo(
    () => buildEditableMenuItems(registrySections, overrides, sectionLabelMap),
    [registrySections, overrides, sectionLabelMap],
  );

  const [menuItems, setMenuItems] =
    useState<EditableMenuItem[]>(initialMenuItems);
  const [dialogState, setDialogState] = useState<CustomDialogState | null>(
    null,
  );
  const [dialogLabel, setDialogLabel] = useState("");
  const [dialogHref, setDialogHref] = useState("");
  const [dialogIcon, setDialogIcon] = useState("");
  const [dialogSectionKey, setDialogSectionKey] =
    useState<string>(DEFAULT_SECTION_KEY);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);

  useEffect(() => {
    setMenuItems(initialMenuItems);
  }, [initialMenuItems]);

  const sectionOptions = useMemo(
    () =>
      Array.from(sectionLabelMap.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    [sectionLabelMap],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active);
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!active?.id || !over?.id || active.id === over.id) {
      return;
    }

    const activeType = active.data.current?.type as string | undefined;
    const overType = over.data.current?.type as string | undefined;

    if (activeType === "child") {
      const activeParentId = active.data.current?.parentId as
        | string
        | undefined;
      const overParentId = over.data.current?.parentId as string | undefined;
      if (!activeParentId || !overParentId || activeParentId !== overParentId) {
        return;
      }
      setMenuItems((prev) =>
        reorderChildItems(
          prev,
          activeParentId,
          String(active.id),
          String(over.id),
        ),
      );
      return;
    }

    if (overType && overType !== "section") {
      return;
    }

    setMenuItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const resolveOverlayItem = useCallback(
    (active: Active) => {
      const target = findMenuItemById(menuItems, String(active.id));
      if (!target) {
        return null;
      }
      return {
        id: target.id,
        label: target.label,
        className: "rounded border bg-card px-3 py-2 text-sm shadow-lg",
      };
    },
    [menuItems],
  );

  const updateItemById = (
    items: EditableMenuItem[],
    itemId: string,
    updater: (item: EditableMenuItem) => EditableMenuItem,
  ): EditableMenuItem[] =>
    items.map((item) => {
      if (item.id === itemId) {
        return updater(item);
      }
      if (item.children.length > 0) {
        return {
          ...item,
          children: updateItemById(item.children, itemId, updater),
        };
      }
      return item;
    });

  const removeItemById = (
    items: EditableMenuItem[],
    itemId: string,
  ): EditableMenuItem[] =>
    items
      .filter((item) => item.id !== itemId)
      .map((item) => ({
        ...item,
        children: removeItemById(item.children, itemId),
      }));

  const handleToggleHidden = (itemId: string, visible: boolean) => {
    setMenuItems((prev) =>
      updateItemById(prev, itemId, (item) => ({ ...item, hidden: !visible })),
    );
  };

  const handleDeleteCustom = (itemId: string) => {
    setMenuItems((prev) => removeItemById(prev, itemId));
  };

  const openDialog = (state: CustomDialogState | null) => {
    setDialogState(state);
    if (state?.item) {
      setDialogLabel(state.item.label);
      setDialogHref(state.item.href);
      setDialogIcon(state.item.icon ?? "");
      setDialogSectionKey(state.item.sectionKey);
    } else {
      setDialogLabel("");
      setDialogHref("");
      setDialogIcon("");
      setDialogSectionKey(state?.sectionKey ?? DEFAULT_SECTION_KEY);
    }
  };

  const handleDialogSubmit = () => {
    if (!dialogState) {
      return;
    }
    if (!dialogLabel.trim() || !dialogHref.trim()) {
      toast.error("Label and URL are required.");
      return;
    }

    if (dialogState.mode === "add") {
      const newItem: EditableMenuItem = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? `custom-${crypto.randomUUID()}`
            : `custom-${Date.now()}`,
        label: dialogLabel.trim(),
        href: dialogHref.trim(),
        icon: dialogIcon.trim() || undefined,
        hidden: false,
        isCustom: true,
        sectionKey: dialogSectionKey,
        sectionLabel: resolveSectionLabel(sectionLabelMap, dialogSectionKey),
        children: [],
      };
      setMenuItems((prev) => [...prev, newItem]);
    } else if (dialogState.item) {
      const targetId = dialogState.item.id;
      setMenuItems((prev) =>
        updateItemById(prev, targetId, (item) => ({
          ...item,
          label: dialogLabel.trim(),
          href: dialogHref.trim(),
          icon: dialogIcon.trim() || undefined,
        })),
      );
    }

    openDialog(null);
  };

  const handleSave = async () => {
    if (!scopedOrgId) {
      toast.error("Unable to determine organization.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildOverridesFromMenu(menuItems);
      await setOption({
        metaKey: ADMIN_MENU_OPTION_KEY,
        metaValue: payload,
        type: "site",
        orgId: scopedOrgId,
      });
      toast.success("Admin menu updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save admin menu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!scopedOrgId) {
      toast.error("Unable to determine organization.");
      return;
    }
    setIsSaving(true);
    try {
      await removeOption({
        metaKey: ADMIN_MENU_OPTION_KEY,
        type: "site",
        orgId: scopedOrgId,
      });
      toast.success("Admin menu reset to defaults.");
      setMenuItems(
        buildEditableMenuItems(registrySections, null, sectionLabelMap),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to reset admin menu.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading =
    postTypesQuery.isLoading ||
    taxonomiesQuery.isLoading ||
    !registrySections.length;

  if (isLoading) {
    return (
      <div className="container py-6">
        <p className="text-muted-foreground">Loading admin menu…</p>
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/settings/menus">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Admin Menu</h1>
          <p className="text-muted-foreground text-sm">
            Reorder built-in entries, hide items, or add custom links to the
            admin sidebar. Built-in entries can be hidden but not deleted.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Navigation Items</CardTitle>
            <p className="text-muted-foreground text-sm">
              Drag to reorder top-level links. Toggle visibility to hide an item
              without deleting it.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const selectedSection =
                dialogSectionKey ??
                sectionOptions[0]?.value ??
                DEFAULT_SECTION_KEY;
              openDialog({
                mode: "add",
                sectionKey: selectedSection,
              });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Link
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <BuilderDndProvider
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={menuItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {menuItems.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  data={{ type: "section", sectionId: item.id }}
                  className="bg-card flex w-full flex-col gap-3 rounded-md border p-4 text-sm shadow-sm md:flex-row md:items-start"
                >
                  <MenuItemRow
                    item={item}
                    onToggleHidden={(visible) =>
                      handleToggleHidden(item.id, visible)
                    }
                    onEditCustom={() =>
                      openDialog({
                        mode: "edit",
                        sectionKey: item.sectionKey,
                        item,
                      })
                    }
                    onDeleteCustom={() => handleDeleteCustom(item.id)}
                    onToggleChildHidden={(childId, visible) =>
                      handleToggleHidden(childId, visible)
                    }
                  />
                </SortableItem>
              ))}
            </SortableContext>
            <DragOverlayPreview
              active={activeDragItem}
              resolveItem={resolveOverlayItem}
            />
          </BuilderDndProvider>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground text-sm">
          Need a fresh start? Resetting restores the built-in layout.
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            type="button"
          >
            Reset to defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving} type="button">
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogState !== null}
        onOpenChange={(open) => openDialog(open ? dialogState : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === "edit"
                ? "Edit Custom Link"
                : "Add Custom Link"}
            </DialogTitle>
            <DialogDescription>
              {dialogState?.mode === "edit"
                ? "Update the label, URL, or icon."
                : "Create a custom entry in this section."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialogState?.mode === "add" && (
              <div className="space-y-2">
                <Label htmlFor="custom-section">Section</Label>
                <Select
                  value={dialogSectionKey}
                  onValueChange={(value) => setDialogSectionKey(value)}
                >
                  <SelectTrigger id="custom-section">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="custom-label">Label</Label>
              <Input
                id="custom-label"
                value={dialogLabel}
                onChange={(e) => setDialogLabel(e.target.value)}
                placeholder="e.g., Support Docs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-url">URL</Label>
              <Input
                id="custom-url"
                value={dialogHref}
                onChange={(e) => setDialogHref(e.target.value)}
                placeholder="/admin/support"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-icon">Icon (Lucide name, optional)</Label>
              <Input
                id="custom-icon"
                value={dialogIcon}
                onChange={(e) => setDialogIcon(e.target.value)}
                placeholder="BookOpen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => openDialog(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleDialogSubmit}>
              {dialogState?.mode === "edit" ? "Save Changes" : "Add Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenuEditorPage;
