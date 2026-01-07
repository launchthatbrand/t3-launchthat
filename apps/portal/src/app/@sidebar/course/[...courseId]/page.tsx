"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { CourseNav } from "launchthat-plugin-lms";
import { ArrowLeft, LayoutDashboardIcon } from "lucide-react";

import type {
  TeamSwitcherOrganization} from "@acme/ui/general/team-switcher";
import {
  TeamSwitcher
} from "@acme/ui/general/team-switcher";
import {
  Sidebar,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
} from "@acme/ui/sidebar";

import { useTenant } from "~/context/TenantContext";

const convexIdRegex = /^[a-z0-9]{32}$/;

export default function CourseSidebar() {
  const params = useParams();
  const courseParam = params.courseId;
  const slugOrId = Array.isArray(courseParam) ? courseParam[0] : courseParam;
  const pathname = usePathname();
  const tenant = useTenant();

  const handleGoToDashboard = useCallback(() => {
    if (!tenant) {
      return;
    }
    window.location.href = `/`;
  }, [tenant]);

  const [switchingOrganizationId, setSwitchingOrganizationId] = useState<
    string | null
  >(null);

  const organizationsResult = useQuery(
    api.core.organizations.queries.myOrganizations,
    {},
  );

  const organizations = useMemo<TeamSwitcherOrganization[]>(() => {
    if (!organizationsResult || !Array.isArray(organizationsResult)) {
      return [];
    }

    return organizationsResult
      .map((org) => {
        if (!org || typeof org !== "object") {
          return null;
        }

        const idValue =
          typeof (org as { _id?: unknown })._id === "string"
            ? (org as { _id: string })._id
            : null;
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

        if (!idValue) {
          return null;
        }

        return {
          id: idValue,
          name: nameValue,
          slug: slugValue,
          customDomain: customDomainValue,
          role: roleValue,
        };
      })
      .filter((org): org is TeamSwitcherOrganization => Boolean(org));
  }, [organizationsResult]);

  const tenantFallbackOrganization =
    useMemo<TeamSwitcherOrganization | null>(() => {
      if (!tenant) {
        return null;
      }

      const slug = typeof tenant.slug === "string" ? tenant.slug : undefined;
      const fallbackId =
        typeof tenant._id === "string" ? tenant._id : (slug ?? "tenant");
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

      let host: string;

      if (org.customDomain) {
        host = org.customDomain;
      } else {
        const isLocalHost =
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.endsWith(".localhost") ||
          hostname.endsWith(".127.0.0.1");

        if (isLocalHost) {
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
          host = `${org.slug}.${rootDomain}`;
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

  if (!slugOrId || typeof slugOrId !== "string") {
    return null;
  }
  const courseId = convexIdRegex.test(slugOrId)
    ? (slugOrId as Id<"posts">)
    : undefined;

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden"
      // {...props}
    >
      <SidebarHeader>
        <TeamSwitcher
          organizations={effectiveOrganizations}
          activeOrganizationId={activeOrganizationId}
          onSelect={handleOrganizationSelect}
          isLoading={organizationsResult === undefined}
          switchingOrganizationId={switchingOrganizationId}
          createHref="/admin/settings/organizations"
        />
      </SidebarHeader>
      <SidebarGroup>
        <SidebarMenuButton onClick={handleGoToDashboard}>
          <ArrowLeft />
          Go to Dashboard
        </SidebarMenuButton>
      </SidebarGroup>

      <CourseNav
        courseId={courseId}
        courseSlug={slugOrId}
        organizationId={activeOrganizationId}
      />
    </Sidebar>
  );
}
