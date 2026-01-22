"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { OrganizationsManager } from "launchthat-plugin-core-tenant/frontend";
import type { CoreTenantOrganizationsUiApi } from "launchthat-plugin-core-tenant/frontend";

import { api } from "@convex-config/_generated/api";

export default function PlatformOrganizationsPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const orgUiApi = React.useMemo(() => {
    return {
      launchthat_core_tenant: {
        queries: {
          listOrganizationsByUserId: api.coreTenant.organizations.listOrganizationsByUserId,
          listDomainsForOrg: api.coreTenant.organizations.listDomainsForOrg,
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage organizations and their domain mappings.
        </p>
      </div>

      <OrganizationsManager
        api={orgUiApi as unknown as CoreTenantOrganizationsUiApi}
        userId={userId}
        showOrganizationSwitcher={false}
        showSetActiveAction={false}
        showActiveColumn={false}
        onOpenOrganization={(organizationId) => {
          router.push(`/platform/organization/${encodeURIComponent(organizationId)}`);
        }}
      />
    </div>
  );
}

