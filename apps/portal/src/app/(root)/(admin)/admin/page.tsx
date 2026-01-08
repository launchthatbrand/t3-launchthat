"use client";

import React, { useMemo } from "react";

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
import { MetaBoxPanel } from "./edit/_components/metaBoxes/MetaBoxPanel";
import { useMetaBoxState } from "./edit/_state/useMetaBoxState";

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

const DashboardMainTwoColumn = ({ tenantSlug }: { tenantSlug: string }) => {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const { metaBoxStates, setMetaBoxState } = useMetaBoxState();

  const ctx = useMemo(() => {
    if (!organizationId) return null;
    return { organizationId, tenantSlug };
  }, [organizationId, tenantSlug]);

  const metaBoxes = useMemo(() => {
    if (!ctx) return [];
    return collectDashboardMetaBoxes("main", ctx);
  }, [ctx]);

  if (!organizationId || !ctx) {
    return (
      <div className="text-muted-foreground text-sm">
        Missing organization context.
      </div>
    );
  }

  const ecommerceBox = metaBoxes.find(
    (box) => box.id === "ecommerce:dashboard",
  );
  const crmBox = metaBoxes.find((box) => box.id === "crm:dashboard");
  const remaining = metaBoxes.filter(
    (box) => box.id !== "ecommerce:dashboard" && box.id !== "crm:dashboard",
  );

  const renderBox = (box: (typeof metaBoxes)[number]) => {
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
        variant="main"
      >
        {box.render(ctx)}
      </MetaBoxPanel>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          {ecommerceBox ? renderBox(ecommerceBox) : null}
        </div>
        <div className="space-y-3">{crmBox ? renderBox(crmBox) : null}</div>
      </div>

      {remaining.length > 0 ? (
        <div className="space-y-3">{remaining.map(renderBox)}</div>
      ) : null}
    </div>
  );
};

export default function AdminDashboardPage() {
  const tenant = useTenant();
  const tenantSlug = tenant?.slug ?? "portal-root";

  return (
    <AdminLayout title="Dashboard" description="Organization overview.">
      <AdminLayoutHeader />
      <AdminLayoutContent withSidebar className="flex-1 gap-6 p-6">
        <AdminLayoutMain className="space-y-4">
          <DashboardMainTwoColumn tenantSlug={tenantSlug} />
        </AdminLayoutMain>
        <AdminLayoutSidebar className="space-y-4">
          <DashboardMetaBoxes location="sidebar" tenantSlug={tenantSlug} />
        </AdminLayoutSidebar>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
