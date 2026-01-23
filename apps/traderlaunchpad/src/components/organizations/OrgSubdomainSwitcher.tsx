"use client";

import * as React from "react";

import type { CoreTenantOrganizationsUiApi } from "launchthat-plugin-core-tenant/frontend";
import { OrganizationTeamSwitcher } from "launchthat-plugin-core-tenant/frontend";
import { api } from "@convex-config/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useQueries, useQuery } from "convex/react";

import type { TeamSwitcherOrganization } from "@acme/ui/general/team-switcher";

import { env } from "~/env";
import { useHostContext } from "~/context/HostContext";

const isLocalHostHost = (host: string): boolean => {
  const hostname = (host.split(":")[0] ?? "").toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".127.0.0.1")
  );
};

const APP_KEY = "traderlaunchpad";

export function OrgSubdomainSwitcher(props: { className?: string }) {
  const { isAuthHost } = useHostContext();

  // Tenant/custom hosts do not mount Clerk. Until this switcher is converted to tenant-session
  // identity (Convex auth), only render it on the auth host.
  if (!isAuthHost) return null;

  const { userId } = useAuth();

  // Load orgs so we can build a domain lookup map.
  const memberships = useQuery(
    api.coreTenant.organizations.listOrganizationsByUserId,
    userId ? { userId } : "skip",
  );

  const orgIds = React.useMemo(() => {
    if (!Array.isArray(memberships)) return [];
    return memberships
      .map((m) => (m && typeof m === "object" ? (m as any).organizationId : null))
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  }, [memberships]);

  const domainQueries = React.useMemo(() => {
    const queries: Record<string, { query: any; args: any }> = {};
    for (const orgId of orgIds) {
      queries[orgId] = {
        query: api.coreTenant.organizations.listDomainsForOrg,
        args: { organizationId: orgId, appKey: APP_KEY },
      };
    }
    return queries;
  }, [orgIds]);

  const domainsByOrgId = useQueries(domainQueries) as Record<string, unknown>;

  const getCustomDomainForOrg = React.useCallback(
    (org: TeamSwitcherOrganization): string | undefined => {
      // Local dev: always use <slug>.localhost:<port> style hosts even if a custom domain is configured.
      if (typeof window !== "undefined" && isLocalHostHost(window.location.host)) {
        return undefined;
      }

      const orgId = String(org.id);
      const rows = domainsByOrgId[orgId];
      if (!Array.isArray(rows)) return undefined;

      const verified = rows.find((row) => {
        if (!row || typeof row !== "object") return false;
        const status = (row as any).status;
        return status === "verified";
      }) as any;

      const hostname =
        verified && typeof verified.hostname === "string" ? verified.hostname.trim() : "";
      return hostname || undefined;
    },
    [domainsByOrgId],
  );

  const orgUiApi = React.useMemo(() => {
    return {
      launchthat_core_tenant: {
        queries: {
          listOrganizationsByUserId: api.coreTenant.organizations.listOrganizationsByUserId,
        },
        mutations: {
          setActiveOrganizationForUser: api.coreTenant.organizations.setActiveOrganizationForUser,
        },
      },
    };
  }, []);

  if (!userId) return null;

  return (
    <OrganizationTeamSwitcher
      className={props.className}
      api={orgUiApi as unknown as CoreTenantOrganizationsUiApi}
      userId={userId}
      rootDomain={env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com"}
      preferLocalhostSubdomains={true}
      preservePath={false}
      redirectBasePath="/"
      getCustomDomainForOrg={getCustomDomainForOrg}
    />
  );
}

