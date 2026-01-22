"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { OrganizationMembersManager } from "launchthat-plugin-core-tenant/frontend";
import type {
  AvailableUserOption,
  CoreTenantOrganizationsUiApi,
} from "launchthat-plugin-core-tenant/frontend";

import { api } from "@convex-config/_generated/api";
import { OrganizationTabs } from "../_components/OrganizationTabs";

export default function PlatformOrganizationMembersPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const users = useQuery(api.coreTenant.platformUsers.listUsers, {
    limit: 500,
  });

  const availableUsers = React.useMemo((): AvailableUserOption[] => {
    if (!Array.isArray(users)) return [];
    return users.map((u) => ({
      userId: u.clerkId,
      label: u.name ? `${u.name} (${u.email})` : u.email,
      sublabel: u.clerkId,
    }));
  }, [users]);

  const orgUiApi = React.useMemo(() => {
    return {
      launchthat_core_tenant: {
        queries: {
          listOrganizationsByUserId: api.coreTenant.organizations.listOrganizationsByUserId,
          listDomainsForOrg: api.coreTenant.organizations.listDomainsForOrg,
          listMembersByOrganizationId: api.coreTenant.organizations.listMembersByOrganizationId,
        },
        mutations: {
          createOrganization: api.coreTenant.organizations.createOrganization,
          setActiveOrganizationForUser:
            api.coreTenant.organizations.setActiveOrganizationForUser,
          upsertOrganizationDomain: api.coreTenant.organizations.upsertOrganizationDomain,
          removeOrganizationDomain: api.coreTenant.organizations.removeOrganizationDomain,
          ensureMembership: api.coreTenant.organizations.ensureMembership,
          removeMembership: api.coreTenant.organizations.removeMembership,
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
        <OrganizationMembersManager
          api={orgUiApi as unknown as CoreTenantOrganizationsUiApi}
          organizationId={organizationId}
          availableUsers={availableUsers}
        />
      ) : (
        <div className="text-muted-foreground text-sm">Missing organization id.</div>
      )}
    </div>
  );
}

