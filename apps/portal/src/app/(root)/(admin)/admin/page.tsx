"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { AdminDashboardMetaBoxLocation } from "~/lib/adminDashboard/metaBoxes";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";
import { collectDashboardMetaBoxes } from "~/lib/adminDashboard/metaBoxes";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { api } from "@portal/convexspec";
import type { Active, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { BuilderDndProvider, DragOverlayPreview, SortableItem } from "@acme/dnd";
import { Button } from "@acme/ui/button";
import { MetaBoxPanel } from "./edit/_components/metaBoxes/MetaBoxPanel";
import { useMetaBoxState } from "./edit/_state/useMetaBoxState";

type Width = "half" | "full";
interface LayoutItem {
  id: string;
  width: Width;
}

const mergeMainLayout = (
  registered: { id: string; defaultWidth?: Width }[],
  saved: LayoutItem[] | null | undefined,
): LayoutItem[] => {
  const defaultWidthById = new Map<string, Width>();
  for (const box of registered) {
    defaultWidthById.set(box.id, box.defaultWidth ?? "full");
  }

  const seen = new Set<string>();
  const merged: LayoutItem[] = [];

  for (const item of saved ?? []) {
    const id = item.id;
    if (!defaultWidthById.has(id) || seen.has(id)) continue;
    seen.add(id);
    const fallback = defaultWidthById.get(id) ?? "full";
    merged.push({ id, width: item.width === "half" ? "half" : fallback });
  }

  for (const box of registered) {
    if (seen.has(box.id)) continue;
    merged.push({ id: box.id, width: box.defaultWidth ?? "full" });
  }

  return merged;
};

const DashboardMetaBoxes = ({
  location,
  tenantSlug,
}: {
  location: AdminDashboardMetaBoxLocation;
  tenantSlug: string;
}) => {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const { metaBoxStates, setMetaBoxState } = useMetaBoxState();

  const ctx = useMemo(() => {
    if (!organizationId) return null;
    return { organizationId, tenantSlug };
  }, [organizationId, tenantSlug]);

  const metaBoxes = useMemo(() => {
    if (!ctx) return [];
    return collectDashboardMetaBoxes(location, ctx);
  }, [ctx, location]);

  if (!organizationId || !ctx) {
    return (
      <div className="text-muted-foreground text-sm">
        Missing organization context.
      </div>
    );
  }

  if (metaBoxes.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No dashboard widgets registered.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {metaBoxes.map((box) => {
        const key = `dashboard:${tenantSlug}:${box.id}`;
        const isOpen = metaBoxStates[key] ?? true;
        return (
          <MetaBoxPanel
            key={box.id}
            id={box.id}
            title={box.title}
            description={box.description}
            isOpen={isOpen}
            onToggle={(nextOpen) => setMetaBoxState(key, nextOpen)}
            variant={location === "sidebar" ? "sidebar" : "main"}
          >
            {box.render(ctx)}
          </MetaBoxPanel>
        );
      })}
    </div>
  );
};

const DashboardMainSortable = ({
  tenantSlug,
  isEditing,
}: {
  tenantSlug: string;
  isEditing: boolean;
}) => {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const { metaBoxStates, setMetaBoxState } = useMetaBoxState();
  const [mainLayout, setMainLayout] = useState<LayoutItem[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  const ctx = useMemo(() => {
    if (!organizationId) return null;
    return { organizationId, tenantSlug };
  }, [organizationId, tenantSlug]);

  const metaBoxes = useMemo(() => {
    if (!ctx) return [];
    return collectDashboardMetaBoxes("main", ctx);
  }, [ctx]);

  // NOTE: The `api` import can be lint/TS-hostile in this repo; keep `any` usage localized.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = api as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const getMyAdminUiLayoutQuery = apiAny.core.adminUiLayouts.queries.getMyAdminUiLayout;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const upsertMyAdminUiLayoutMutation = apiAny.core.adminUiLayouts.mutations.upsertMyAdminUiLayout;

  const savedLayout = useQuery(
    getMyAdminUiLayoutQuery as never,
    organizationId
      ? {
          organizationId,
          scope: "dashboard",
          postTypeSlug: null,
        }
      : "skip",
  ) as
    | {
        areas: { main: LayoutItem[]; sidebar: { id: string }[] };
        version: number;
        updatedAt: number;
      }
    | null
    | undefined;

  const upsertLayout = useMutation(upsertMyAdminUiLayoutMutation as never) as (
    args: {
      organizationId: string;
      scope: "dashboard";
      postTypeSlug: null;
      areas: { main: LayoutItem[]; sidebar: { id: string }[] };
    },
  ) => Promise<null>;

  const registeredForLayout = useMemo(
    () => metaBoxes.map((box) => ({ id: box.id, defaultWidth: box.defaultWidth })),
    [metaBoxes],
  );

  const defaultSidebar = useMemo(
    () => collectDashboardMetaBoxes("sidebar", ctx).map((box) => ({ id: box.id })),
    [ctx],
  );

  const mergedFromSaved = useMemo(
    () => mergeMainLayout(registeredForLayout, savedLayout?.areas.main ?? null),
    [registeredForLayout, savedLayout?.areas.main],
  );

  useEffect(() => {
    // Initialize once, and also handle newly-registered metaboxes by merging.
    if (!hasInitializedRef.current) {
      setMainLayout(mergedFromSaved);
      hasInitializedRef.current = true;
      return;
    }
    setMainLayout((prev) => mergeMainLayout(registeredForLayout, prev));
  }, [mergedFromSaved, registeredForLayout]);

  const scheduleSave = useCallback(
    (nextMain: LayoutItem[]) => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        const sidebarForSave = savedLayout?.areas.sidebar ?? defaultSidebar;
        if (!organizationId) return;
        void upsertLayout({
          organizationId,
          scope: "dashboard",
          postTypeSlug: null,
          areas: {
            main: nextMain,
            sidebar: sidebarForSave,
          },
        });
      }, 400);
    },
    [
      defaultSidebar,
      organizationId,
      savedLayout?.areas.sidebar,
      upsertLayout,
    ],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const renderBox = (box: (typeof metaBoxes)[number], width: Width) => {
    const key = `dashboard:${tenantSlug}:${box.id}`;
    const isOpen = metaBoxStates[key] ?? true;

    const panel = (
      <MetaBoxPanel
        id={box.id}
        title={box.title}
        description={box.description}
        isOpen={isOpen}
        onToggle={(nextOpen) => setMetaBoxState(key, nextOpen)}
        variant="main"
        headerActions={
          isEditing ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setMainLayout((prev) => {
                  const next = prev.map((item) =>
                    item.id === box.id
                      ? {
                          ...item,
                          width: item.width === "half" ? "full" : "half",
                        }
                      : item,
                  );
                  scheduleSave(next);
                  return next;
                });
              }}
            >
              {width === "half" ? "Full width" : "Half width"}
            </Button>
          ) : null
        }
      >
        {box.render(ctx)}
      </MetaBoxPanel>
    );

    return (
      <div className={width === "half" ? "md:col-span-6" : "md:col-span-12"}>
        {isEditing ? (
          <SortableItem
            id={box.id}
            className="border-0 bg-transparent shadow-none items-stretch p-0"
            handleClassName="h-12 px-1"
          >
            {panel}
          </SortableItem>
        ) : (
          panel
        )}
      </div>
    );
  };

  if (!organizationId || !ctx) {
    return (
      <div className="text-muted-foreground text-sm">
        Missing organization context.
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="grid gap-6 md:grid-cols-12">
        {mainLayout.map((item) => {
          const box = metaBoxes.find((b) => b.id === item.id);
          if (!box) return null;
          return (
            <React.Fragment key={item.id}>
              {renderBox(box, item.width)}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <BuilderDndProvider
      onDragStart={(event: DragStartEvent) => setActiveDragItem(event.active)}
      onDragCancel={() => setActiveDragItem(null)}
      onDragEnd={(event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over?.id || active.id === over.id) return;
        setMainLayout((prev) => {
          const oldIndex = prev.findIndex((item) => item.id === String(active.id));
          const newIndex = prev.findIndex((item) => item.id === String(over.id));
          if (oldIndex === -1 || newIndex === -1) return prev;
          const next = arrayMove(prev, oldIndex, newIndex);
          scheduleSave(next);
          return next;
        });
      }}
    >
      <SortableContext
        items={mainLayout.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-6 md:grid-cols-12">
          {mainLayout.map((item) => {
            const box = metaBoxes.find((b) => b.id === item.id);
            if (!box) return null;
            return <React.Fragment key={item.id}>{renderBox(box, item.width)}</React.Fragment>;
          })}
        </div>
      </SortableContext>
      <DragOverlayPreview
        active={activeDragItem}
        resolveItem={(active: Active) => {
          const box = metaBoxes.find((b) => b.id === String(active.id));
          if (!box) return null;
          return {
            id: box.id,
            label: box.title,
            className: "rounded border bg-card px-3 py-2 text-sm shadow-lg",
          };
        }}
      />
    </BuilderDndProvider>
  );
};

export default function AdminDashboardPage() {
  const tenant = useTenant();
  const tenantSlug = tenant?.slug ?? "portal-root";
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("editLayout") === "1";

  return (
    <AdminLayout title="Dashboard" description="Organization overview.">
      <AdminLayoutHeader />
      <AdminLayoutContent withSidebar className="flex-1 gap-6 p-6">
        <AdminLayoutMain className="space-y-4">
          <DashboardMainSortable tenantSlug={tenantSlug} isEditing={isEditing} />
        </AdminLayoutMain>
        <AdminLayoutSidebar className="space-y-4">
          <DashboardMetaBoxes location="sidebar" tenantSlug={tenantSlug} />
        </AdminLayoutSidebar>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
