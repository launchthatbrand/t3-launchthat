"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import type { TeamSwitcherOrganization } from "@acme/ui/general/team-switcher";

import type { CoreTenantOrganizationsUiApi } from "./organizations/types";

import { buildOrganizationSwitchUrl, stripProtocol } from "./org-switching";

export interface OrganizationTeamSwitcherProps {
  api: CoreTenantOrganizationsUiApi;
  userId: string | null | undefined;

  /**
   * If provided, prefer this slug when determining the "active" org in the UI.
   * Useful when the current tenant is derived from the hostname/subdomain.
   */
  activeTenantSlug?: string | null;

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
   * Optional "root tenant" slug that should resolve to the apex domain (no subdomain).
   * Portal uses this for its internal tenant.
   */
  rootTenantSlug?: string;

  /**
   * If true, preserve the current path/query/hash on redirect. If false, redirect to `/`.
   */
  preservePath?: boolean;

  /**
   * Optional base path to force on redirect (e.g. "/admin"). Ignored if preservePath=true.
   */
  redirectBasePath?: string;

  /**
   * Optional "Add organization" link shown at the bottom of the menu.
   */
  createHref?: string;

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
      logoUrl: m.org.logoUrl ?? null,
    }));
  }, [memberships]);

  const activeOrganizationId = React.useMemo(() => {
    if (!Array.isArray(memberships) || memberships.length === 0) return null;

    const activeTenantSlug = (props.activeTenantSlug ?? "").trim().toLowerCase();
    if (activeTenantSlug) {
      const bySlug = memberships.find(
        (m) => m.org?.slug?.trim().toLowerCase() === activeTenantSlug,
      );
      if (bySlug?.organizationId) return bySlug.organizationId;
    }

    return memberships.find((m) => m.isActive)?.organizationId ?? memberships[0]?.organizationId ?? null;
  }, [memberships, props.activeTenantSlug]);

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

      const nextUrl = buildOrganizationSwitchUrl({
        currentUrl: window.location.href,
        currentHost: window.location.host,
        currentHostname: window.location.hostname,
        currentPort: window.location.port,
        currentProtocol: window.location.protocol,
        slug: slug || null,
        customDomain: customDomain || null,
        rootDomain: props.rootDomain,
        preferLocalhostSubdomains,
        preservePath,
        redirectBasePath: props.redirectBasePath,
        rootTenantSlug: props.rootTenantSlug,
      });

      if (!nextUrl) return;
      window.location.assign(nextUrl);
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
        createHref={props.createHref}
      />
    </div>
  );
};

