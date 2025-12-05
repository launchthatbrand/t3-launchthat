"use client";

import { useCallback, useMemo, useState } from "react";

import { PORTAL_TENANT_SLUG } from "~/lib/tenant-fetcher";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import type { TeamSwitcherOrganization } from "@acme/ui/general/team-switcher";
import { api } from "@convex-config/_generated/api";
import { rootDomain } from "~/lib/utils";
import { useQuery } from "convex/react";
import { useTenant } from "~/context/TenantContext";

export function AdminTeamSwitcher() {
  const tenant = useTenant();
  const organizationsResult = useQuery(
    api.core.organizations.queries.myOrganizations,
    {},
  );
  const [switchingOrganizationId, setSwitchingOrganizationId] = useState<
    string | null
  >(null);

  const organizations = useMemo<TeamSwitcherOrganization[]>(() => {
    if (!organizationsResult || !Array.isArray(organizationsResult)) {
      return [];
    }

    return organizationsResult.flatMap((org) => {
      if (!org || typeof org !== "object") {
        return [];
      }
      const idValue =
        typeof (org as { _id?: unknown })._id === "string"
          ? (org as { _id: string })._id
          : undefined;
      if (!idValue) {
        return [];
      }
      const nameValue =
        typeof (org as { name?: unknown }).name === "string"
          ? (org as { name: string }).name
          : "Untitled";
      const slugValue =
        typeof (org as { slug?: unknown }).slug === "string"
          ? (org as { slug: string }).slug
          : undefined;
      const customDomainValue =
        typeof (org as { customDomain?: unknown }).customDomain === "string"
          ? (org as { customDomain: string }).customDomain
          : undefined;
      const roleValue =
        typeof (org as { userRole?: unknown }).userRole === "string"
          ? (org as { userRole: string }).userRole
          : undefined;

      return [
        {
          id: idValue,
          name: nameValue,
          slug: slugValue,
          customDomain: customDomainValue,
          role: roleValue,
        },
      ];
    });
  }, [organizationsResult]);

  const tenantFallbackOrganization =
    useMemo<TeamSwitcherOrganization | null>(() => {
      if (!tenant) {
        return null;
      }

      const slug = typeof tenant.slug === "string" ? tenant.slug : undefined;
      const fallbackId =
        (typeof tenant._id === "string" ? tenant._id : slug) ?? "tenant";
      const fallbackName =
        typeof tenant.name === "string"
          ? tenant.name
          : (slug ?? "Current Organization");
      const fallbackDomain =
        typeof tenant.customDomain === "string"
          ? tenant.customDomain
          : undefined;

      return {
        id: fallbackId,
        name: fallbackName,
        slug,
        customDomain: fallbackDomain,
        role: undefined,
      };
    }, [tenant]);

  const effectiveOrganizations = useMemo(() => {
    if (organizations.length > 0) {
      return organizations;
    }
    return tenantFallbackOrganization ? [tenantFallbackOrganization] : [];
  }, [organizations, tenantFallbackOrganization]);

  const activeOrganizationId = useMemo(() => {
    if (!effectiveOrganizations.length) {
      return null;
    }

    if (tenant?.slug) {
      const match = effectiveOrganizations.find(
        (org) => org.slug === tenant.slug,
      );
      if (match) return match.id;
    }

    return effectiveOrganizations[0]?.id ?? null;
  }, [effectiveOrganizations, tenant]);

  const handleOrganizationSelect = useCallback(
    (org: TeamSwitcherOrganization) => {
      if (!org.slug && !org.customDomain) {
        return;
      }
      if (switchingOrganizationId === org.id) {
        return;
      }
      setSwitchingOrganizationId(org.id);
      if (typeof window === "undefined") {
        return;
      }

      const { protocol: currentProtocol, hostname, port } = window.location;
      const normalizedProtocol = currentProtocol.replace(":", "") || "http";
      const portSegment = port ? `:${port}` : "";

      const stripProtocol = (domain: string) =>
        domain.replace(/^https?:\/\//, "");

      let host: string;

      if (org.customDomain) {
        host = org.customDomain;
      } else {
        const isLocalHost =
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.endsWith(".localhost") ||
          hostname.endsWith(".127.0.0.1");

        const isPortalSlug =
          typeof org.slug === "string" && org.slug === PORTAL_TENANT_SLUG;

        if (isPortalSlug) {
          if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.endsWith(".localhost") ||
            hostname.endsWith(".127.0.0.1")
          ) {
            const baseLocal =
              hostname === "localhost" || hostname.endsWith(".localhost")
                ? "localhost"
                : "127.0.0.1";
            host = `${baseLocal}${portSegment}`;
          } else {
            host = stripProtocol(rootDomain);
          }
        } else if (isLocalHost) {
          const localSuffix = (() => {
            if (hostname.includes(".localhost")) {
              return hostname.substring(hostname.indexOf(".localhost"));
            }
            if (hostname.includes(".127.0.0.1")) {
              return hostname.substring(hostname.indexOf(".127.0.0.1"));
            }
            if (hostname === "localhost") {
              return ".localhost";
            }
            if (hostname === "127.0.0.1") {
              return ".127.0.0.1";
            }
            return ".localhost";
          })();
          host = `${org.slug}${localSuffix}${portSegment}`;
        } else {
          host = `${org.slug}.${stripProtocol(rootDomain)}`;
        }
      }

      const targetProtocol =
        org.customDomain && normalizedProtocol === "http"
          ? "https"
          : normalizedProtocol;

      const targetUrl = `${targetProtocol}://${host}/admin`;
      window.location.assign(targetUrl);
    },
    [switchingOrganizationId],
  );

  return (
    <TeamSwitcher
      organizations={effectiveOrganizations}
      activeOrganizationId={activeOrganizationId}
      onSelect={handleOrganizationSelect}
      isLoading={organizationsResult === undefined}
      switchingOrganizationId={switchingOrganizationId}
      createHref="/admin/settings/organizations"
    />
  );
}
