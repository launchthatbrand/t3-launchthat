"use client";

import * as React from "react";

import { useConvexAuth, useQueries, useQuery } from "convex/react";

import type { CoreTenantOrganizationsUiApi } from "launchthat-plugin-core-tenant/frontend";
import { OrganizationTeamSwitcher } from "launchthat-plugin-core-tenant/frontend";
import type { TeamSwitcherOrganization } from "@acme/ui/general/team-switcher";
import { api } from "@convex-config/_generated/api";
import { env } from "~/env";
import { useHostContext } from "~/context/HostContext";
import { usePathname } from "next/navigation";
import { useTenant } from "~/context/TenantContext";
import { isPlatformHost } from "~/lib/host-mode";

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
  const pathname = usePathname();
  const tenant = useTenant();

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const viewer = useQuery(
    api.viewer.queries.getViewerProfile,
    isAuthenticated && !authLoading ? {} : "skip",
  );
  const userId = viewer ? String((viewer as { userId: string }).userId) : "";

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

  const mode = (() => {
    if (typeof window === "undefined") return "platform" as const;
    const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com";
    const isPlatform = isPlatformHost({
      hostOrHostname: window.location.hostname,
      rootDomain,
    });
    if (!isPlatform && tenant?.customDomain) {
      const current = window.location.hostname.toLowerCase();
      if (tenant.customDomain.toLowerCase() === current) return "whitelabel" as const;
    }
    return "platform" as const;
  })();

  // In whitelabel mode we do not mount Clerk UI on the vanity domain; only render switcher on auth host.
  if (mode === "whitelabel" && !isAuthHost) return null;

  const redirectBasePath = pathname.startsWith("/admin")
    ? "/admin"
    : pathname.startsWith("/platform")
      ? "/platform"
      : "/";

  return (
    <OrganizationTeamSwitcher
      className={props.className}
      api={orgUiApi as unknown as CoreTenantOrganizationsUiApi}
      userId={userId}
      mode={mode}
      activeTenantSlug={tenant?.slug ?? null}
      rootDomain={env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com"}
      preferLocalhostSubdomains={true}
      preservePath={false}
      redirectBasePath={redirectBasePath}
      createHref="/platform/organizations"
      getCustomDomainForOrg={getCustomDomainForOrg}
    />
  );
}

