"use client";

import * as React from "react";

import { api } from "@convex-config/_generated/api";
import { env } from "~/env";
import { useTenant } from "~/context/TenantContext";
import { isPlatformHost } from "~/lib/host-mode";

import { AdminTeamSwitcher } from "launchthat-plugin-core-tenant/frontend";

export function TraderLaunchpadAdminTeamSwitcher() {
  const tenant = useTenant();
  const rootDomain = String(env.NEXT_PUBLIC_ROOT_DOMAIN);
  const rootTenantSlug = "platform";
  const mode = React.useMemo<"platform" | "whitelabel">(() => {
    if (typeof window === "undefined") return "platform";
    const isPlatform = isPlatformHost({
      hostOrHostname: window.location.hostname,
      rootDomain,
    });
    // Only treat as whitelabel when on a non-first-party hostname that matches the tenant custom domain.
    if (!isPlatform && tenant?.customDomain) {
      const current = window.location.hostname.toLowerCase();
      if (tenant.customDomain.toLowerCase() === current) return "whitelabel";
    }
    return "platform";
  }, [rootDomain, tenant?.customDomain]);

  return (
    <AdminTeamSwitcher
      tenant={tenant}
      rootDomain={rootDomain}
      organizationsQuery={api.coreTenant.organizations.myOrganizations}
      redirectBasePath="/admin"
      rootTenantSlug={rootTenantSlug}
      mode={mode}
    />
  );
}

