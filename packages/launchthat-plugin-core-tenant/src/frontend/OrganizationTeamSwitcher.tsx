"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import type { TeamSwitcherOrganization } from "@acme/ui/general/team-switcher";

import type { CoreTenantOrganizationsUiApi } from "./organizations/types";

const isLocalHostHost = (host: string): boolean => {
  const hostname = (host.split(":")[0] ?? "").toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".127.0.0.1")
  );
};

const getLocalSuffix = (hostname: string): string => {
  const lower = hostname.toLowerCase();
  if (lower.includes(".localhost")) return lower.substring(lower.indexOf(".localhost"));
  if (lower.includes(".127.0.0.1")) return lower.substring(lower.indexOf(".127.0.0.1"));
  if (lower === "127.0.0.1") return ".127.0.0.1";
  return ".localhost";
};

const stripProtocol = (domain: string): string => domain.replace(/^https?:\/\//i, "");

export interface OrganizationTeamSwitcherProps {
  api: CoreTenantOrganizationsUiApi;
  userId: string | null | undefined;

  /**
   * Root domain for subdomain routing in production (e.g. "traderlaunchpad.com" or "launchthat.app").
   */
  rootDomain: string;

  /**
   * If true, local dev switches to `${slug}.localhost:${port}` (Portal behavior).
   * If false, local dev also switches to `${slug}.${rootDomain}`.
   */
  preferLocalhostSubdomains?: boolean;

  /**
   * Optional custom domain per org (Portal behavior).
   * If provided (and non-empty), it wins over `${slug}.${rootDomain}`.
   */
  getCustomDomainForOrg?: (org: TeamSwitcherOrganization) => string | undefined;

  /**
   * If true, preserve the current path/query/hash on redirect. If false, redirect to `/`.
   */
  preservePath?: boolean;

  /**
   * Optional base path to force on redirect (e.g. "/admin"). Ignored if preservePath=true.
   */
  redirectBasePath?: string;

  className?: string;
}

export const OrganizationTeamSwitcher = (props: OrganizationTeamSwitcherProps) => {
  const preferLocalhostSubdomains = props.preferLocalhostSubdomains !== false;
  const preservePath = props.preservePath !== false;

  const memberships = useQuery(
    props.api.launchthat_core_tenant.queries.listOrganizationsByUserId,
    props.userId ? { userId: props.userId } : "skip",
  );

  const setActive = useMutation(
    props.api.launchthat_core_tenant.mutations.setActiveOrganizationForUser,
  );

  const organizations = React.useMemo<TeamSwitcherOrganization[]>(() => {
    if (!Array.isArray(memberships)) return [];
    return memberships.map((m) => ({
      id: m.organizationId,
      name: m.org.name,
      slug: m.org.slug,
      customDomain: undefined,
      role: m.role,
    }));
  }, [memberships]);

  const activeOrganizationId = React.useMemo(() => {
    if (!Array.isArray(memberships) || memberships.length === 0) return null;
    return memberships.find((m) => m.isActive)?.organizationId ?? memberships[0]?.organizationId ?? null;
  }, [memberships]);

  const [switchingOrganizationId, setSwitchingOrganizationId] = React.useState<string | null>(
    null,
  );

  const handleSelect = React.useCallback(
    (org: TeamSwitcherOrganization) => {
      const slug = typeof org.slug === "string" ? org.slug.trim() : "";
      const customDomainRaw = props.getCustomDomainForOrg?.(org) ?? org.customDomain;
      const customDomain =
        typeof customDomainRaw === "string" && customDomainRaw.trim()
          ? stripProtocol(customDomainRaw.trim())
          : "";

      if (!slug && !customDomain) return;

      if (switchingOrganizationId === org.id) return;
      setSwitchingOrganizationId(org.id);

      if (typeof window === "undefined") return;

      // Best-effort: persist selection for apps that use active-org.
      if (props.userId) {
        void setActive({ userId: props.userId, organizationId: String(org.id) });
      }

      const { protocol, hostname, port, host } = window.location;
      const normalizedProtocol = protocol.replace(":", "") || "http";
      const portSegment = port ? `:${port}` : "";

      let nextHost: string;
      if (customDomain) {
        nextHost = customDomain;
      } else if (preferLocalhostSubdomains && isLocalHostHost(host) && slug) {
        nextHost = `${slug}${getLocalSuffix(hostname)}${portSegment}`;
      } else {
        nextHost = `${slug}.${stripProtocol(props.rootDomain)}`;
      }

      const targetProtocol =
        customDomain && normalizedProtocol === "http" ? "https" : normalizedProtocol;

      const nextUrl = new URL(window.location.href);
      nextUrl.protocol = `${targetProtocol}:`;
      const [nextHostname, nextPort] = nextHost.split(":");
      nextUrl.hostname = nextHostname ?? nextHost;
      // Preserve localhost port when we generated `slug.localhost:${port}`.
      nextUrl.port = nextPort ?? "";

      if (!preservePath) {
        const base = props.redirectBasePath?.trim() ?? "/";
        nextUrl.pathname = base.startsWith("/") ? base : `/${base}`;
        nextUrl.search = "";
        nextUrl.hash = "";
      }

      window.location.assign(nextUrl.toString());
    },
    [
      preferLocalhostSubdomains,
      preservePath,
      props,
      setActive,
      switchingOrganizationId,
    ],
  );

  if (!props.userId) return null;

  return (
    <div className={props.className}>
      <TeamSwitcher
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
        onSelect={handleSelect}
        isLoading={memberships === undefined}
        switchingOrganizationId={switchingOrganizationId}
        createHref={undefined}
      />
    </div>
  );
};

