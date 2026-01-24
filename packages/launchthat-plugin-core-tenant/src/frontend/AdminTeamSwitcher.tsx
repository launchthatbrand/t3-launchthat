"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import type { TeamSwitcherOrganization } from "@acme/ui/general/team-switcher";

import { buildOrganizationSwitchUrl } from "./org-switching";

export type TenantLike = {
  _id?: string;
  slug?: string;
  name?: string;
  customDomain?: string | null;
} | null;

export function AdminTeamSwitcher(props: {
  tenant: TenantLike;
  rootDomain: string;
  organizationsQuery: Parameters<typeof useQuery>[0];
  /**
   * Platform mode shows all orgs the user belongs to (discovery / switching).
   * Whitelabel mode only shows the current org + Global.
   */
  mode?: "platform" | "whitelabel";
  /**
   * Root tenant slug that should resolve to apex (no subdomain).
   * Portal passes `PORTAL_TENANT_SLUG`; TraderLaunchpad can omit.
   */
  rootTenantSlug?: string;
  redirectBasePath?: string; // default: /admin
  /**
   * Optional slug to pin to the top of the list (e.g. TraderLaunchpad's default org).
   */
  pinnedTenantSlug?: string;
}) {
  // Avoid leaking `any` from Convex hook generics; we validate shape below.
  const organizationsResult = useQuery(props.organizationsQuery, {}) as unknown;
  const [switchingOrganizationId, setSwitchingOrganizationId] = useState<string | null>(null);
  const platformRootTenantSlug = String(props.rootTenantSlug ?? "platform")
    .trim()
    .toLowerCase();

  const organizations = useMemo<TeamSwitcherOrganization[]>(() => {
    if (!organizationsResult || !Array.isArray(organizationsResult)) return [];

    return organizationsResult.flatMap((org: unknown) => {
      if (!org || typeof org !== "object") return [];
      const obj = org as Record<string, unknown>;
      const idValue = typeof obj._id === "string" ? obj._id : undefined;
      if (!idValue) return [];

      const nameValue = typeof obj.name === "string" ? obj.name : "Untitled";
      const slugValue = typeof obj.slug === "string" ? obj.slug : undefined;
      const customDomainValue = typeof obj.customDomain === "string" ? obj.customDomain : undefined;
      const logoUrlValue =
        typeof obj.logoUrl === "string"
          ? obj.logoUrl
          : obj.logoUrl === null
            ? null
            : undefined;
      const roleValue =
        typeof obj.userRole === "string"
          ? obj.userRole
          : typeof obj.role === "string"
            ? obj.role
            : undefined;

      return [
        {
          id: idValue,
          name: nameValue,
          slug: slugValue,
          customDomain: customDomainValue,
          role: roleValue,
          logoUrl: logoUrlValue,
        },
      ];
    });
  }, [organizationsResult]);

  const platformEntry = useMemo<TeamSwitcherOrganization>(() => {
    return {
      id: "__platform",
      name: "TraderLaunchpad (Global)",
      slug: platformRootTenantSlug,
      role: "Platform",
      // App brand mark (served from the app). If the consuming app doesn't have this asset
      // it's harmless: TeamSwitcher falls back to icon/initials.
      logoUrl: "/images/tl-logo-1.png",
    };
  }, [platformRootTenantSlug]);

  const tenantFallbackOrganization = useMemo<TeamSwitcherOrganization | null>(() => {
    const tenant = props.tenant;
    if (!tenant) return null;

    const slug = typeof tenant.slug === "string" ? tenant.slug : undefined;
    const fallbackId = (typeof tenant._id === "string" ? tenant._id : slug) ?? "tenant";
    const fallbackName =
      typeof tenant.name === "string" ? tenant.name : (slug ?? "Current Organization");
    const fallbackDomain = typeof tenant.customDomain === "string" ? tenant.customDomain : undefined;

    return { id: fallbackId, name: fallbackName, slug, customDomain: fallbackDomain, role: undefined };
  }, [props.tenant]);

  const effectiveOrganizations = useMemo(() => {
    const mode = props.mode ?? "platform";

    if (mode === "whitelabel") {
      if (tenantFallbackOrganization?.slug) return [platformEntry, tenantFallbackOrganization];
      return [platformEntry];
    }

    if (organizations.length > 0) return [platformEntry, ...organizations];
    // If we're on a tenant host and the query is still loading (or returns empty),
    // keep a stable list that still allows navigating back to apex/global.
    if (tenantFallbackOrganization?.slug) {
      return [platformEntry, tenantFallbackOrganization];
    }
    return tenantFallbackOrganization ? [tenantFallbackOrganization] : [];
  }, [organizations, platformEntry, props.mode, tenantFallbackOrganization]);

  const orderedOrganizations = useMemo(() => {
    const pinned = String(props.pinnedTenantSlug ?? "").trim().toLowerCase();
    if (!pinned) return effectiveOrganizations;
    if (effectiveOrganizations.length < 2) return effectiveOrganizations;

    const idx = effectiveOrganizations.findIndex(
      (org) => (org.slug ?? "").trim().toLowerCase() === pinned,
    );
    if (idx <= 0) return effectiveOrganizations;

    const next = effectiveOrganizations.slice();
    const [item] = next.splice(idx, 1);
    if (item) next.unshift(item);
    return next;
  }, [effectiveOrganizations, props.pinnedTenantSlug]);

  const activeOrganizationId = useMemo(() => {
    if (!orderedOrganizations.length) return null;
    const tenantSlug = props.tenant?.slug;
    if (tenantSlug) {
      const match = orderedOrganizations.find((org) => org.slug === tenantSlug);
      if (match) return match.id;
    }
    // If we have real orgs, default to the platform entry when on apex/global.
    const hasRealOrgs = organizations.length > 0;
    if (hasRealOrgs) return platformEntry.id;
    return orderedOrganizations[0]?.id ?? null;
  }, [orderedOrganizations, organizations.length, platformEntry.id, props.tenant]);

  const handleOrganizationSelect = useCallback(
    (org: TeamSwitcherOrganization) => {
      if (!org.slug && !org.customDomain) return;
      if (switchingOrganizationId === org.id) return;

      setSwitchingOrganizationId(org.id);
      if (typeof window === "undefined") return;

      const nextUrl = buildOrganizationSwitchUrl({
        currentUrl: window.location.href,
        currentHost: window.location.host,
        currentHostname: window.location.hostname,
        currentPort: window.location.port,
        currentProtocol: window.location.protocol,
        slug: typeof org.slug === "string" ? org.slug : null,
        customDomain: typeof org.customDomain === "string" ? org.customDomain : null,
        rootDomain: props.rootDomain,
        preferLocalhostSubdomains: true,
        preservePath: false,
        redirectBasePath: props.redirectBasePath ?? "/admin",
        rootTenantSlug: props.rootTenantSlug,
      });
      if (!nextUrl) return;
      window.location.assign(nextUrl);
    },
    [props.redirectBasePath, props.rootDomain, props.rootTenantSlug, switchingOrganizationId],
  );

  return (
    <TeamSwitcher
      organizations={orderedOrganizations}
      activeOrganizationId={activeOrganizationId}
      onSelect={handleOrganizationSelect}
      isLoading={organizationsResult === undefined}
      switchingOrganizationId={switchingOrganizationId}
      createHref={undefined}
    />
  );
}

