"use client";

import * as React from "react";

import { api } from "@convex-config/_generated/api";
import { env } from "~/env";
import { useTenant } from "~/context/TenantContext";

import { AdminTeamSwitcher } from "launchthat-plugin-core-tenant/frontend";

export function TraderLaunchpadAdminTeamSwitcher() {
  const tenant = useTenant();
  const rootDomain = String(env.NEXT_PUBLIC_ROOT_DOMAIN);
  // TraderLaunchpad: keep the default/core org at the top of the switcher list.
  // This is intentionally a client-safe constant (avoid server-only env access here).
  const pinnedTenantSlug = "default";

  return (
    <AdminTeamSwitcher
      tenant={tenant}
      rootDomain={rootDomain}
      organizationsQuery={api.coreTenant.organizations.myOrganizations}
      redirectBasePath="/admin"
      pinnedTenantSlug={pinnedTenantSlug}
    />
  );
}

