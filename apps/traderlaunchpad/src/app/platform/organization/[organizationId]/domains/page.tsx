"use client";

import React from "react";
import { useParams } from "next/navigation";

import { OrganizationDomainsManager } from "launchthat-plugin-core-tenant/frontend";
import type { CoreTenantOrganizationsUiApi } from "launchthat-plugin-core-tenant/frontend";

import { api } from "@convex-config/_generated/api";
import { OrganizationTabs } from "../_components/OrganizationTabs";

export default function PlatformOrganizationDomainsPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const orgUiApi = React.useMemo(() => {
    return {
      launchthat_core_tenant: {
        queries: {
          listDomainsForOrg: api.coreTenant.organizations.listDomainsForOrg,
          listOrganizationsByUserId: api.coreTenant.organizations.listOrganizationsByUserId,
        },
        mutations: {
          createOrganization: api.coreTenant.organizations.createOrganization,
          setActiveOrganizationForUser:
            api.coreTenant.organizations.setActiveOrganizationForUser,
          upsertOrganizationDomain: api.coreTenant.organizations.upsertOrganizationDomain,
          removeOrganizationDomain: api.coreTenant.organizations.removeOrganizationDomain,
        },
      },
    };
  }, []);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <OrganizationTabs />
      </div>

      {organizationId ? (
        <OrganizationDomainsManager
          api={orgUiApi as unknown as CoreTenantOrganizationsUiApi}
          organizationId={organizationId}
          appKeys={["traderlaunchpad", "portal"]}
        />
      ) : (
        <div className="text-muted-foreground text-sm">Missing organization id.</div>
      )}
    </div>
  );
}

