"use client";

import * as React from "react";

import { api } from "@convex-config/_generated/api";
import { env } from "~/env";
import { useTenant } from "~/context/TenantContext";

import { AdminTeamSwitcher } from "launchthat-plugin-core-tenant/frontend";

export function TraderLaunchpadAdminTeamSwitcher() {
  const tenant = useTenant();
  const rootDomain = String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com");

  return (
    <AdminTeamSwitcher
      tenant={tenant}
      rootDomain={rootDomain}
      organizationsQuery={api.coreTenant.organizations.myOrganizations as any}
      redirectBasePath="/admin"
    />
  );
}

