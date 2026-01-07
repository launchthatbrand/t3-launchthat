"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { rootDomain } from "@/lib/utils";
import { useQuery } from "convex/react";
import { BookOpen, TerminalSquare } from "lucide-react";

import type { TeamSwitcherOrganization } from "@acme/ui/general/team-switcher";
import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { Sidebar, SidebarContent, SidebarHeader } from "@acme/ui/sidebar";

import { useTenant } from "~/context/TenantContext";

const MENU_LOCATION = "primary";

const FALLBACK_NAV = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: TerminalSquare,
  },
] as const;

type MenuItemDoc = Doc<"menuItems">;

interface SidebarNavItem {
  title: string;
  url: string;
  icon?: typeof BookOpen;
  isActive?: boolean;
  items?: SidebarNavItem[];
}

const normalizeUrl = (url: string) => {
  if (!url) return "/";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
};

const getOrderValue = (value: number | null | undefined) =>
  typeof value === "number" ? value : 0;

const buildMenuTree = (
  items: MenuItemDoc[],
  pathname: string | null,
  parentId: Id<"menuItems"> | null = null,
): SidebarNavItem[] => {
  return items
    .filter((item) => {
      if (item.parentId === undefined || item.parentId === null) {
        return parentId === null;
      }
      return item.parentId === parentId;
    })
    .sort((a, b) => getOrderValue(a.order) - getOrderValue(b.order))
    .map((item) => {
      const url = normalizeUrl(item.url);
      const isActive =
        pathname !== null &&
        (pathname === url || pathname.startsWith(`${url}/`));
      return {
        title: item.label,
        url,
        icon: BookOpen,
        isActive,
        items: buildMenuTree(items, pathname, item._id),
      };
    });
};

export default function DefaultSidebar() {
  const pathname = usePathname();
  const tenant = useTenant();
  const [switchingOrganizationId, setSwitchingOrganizationId] = useState<
    string | null
  >(null);
  // Tenant-scoped menus: if we don't have a tenant org id (e.g. auth host),
  // fall back to default nav instead of showing a global menu.
  const organizationId =
    tenant && typeof (tenant as { _id?: unknown })._id === "string"
      ? ((tenant as { _id: string })._id as Id<"organizations">)
      : null;

  const menuData = useQuery(
    api.core.menus.queries.getMenuWithItemsByLocation,
    organizationId ? { organizationId, location: MENU_LOCATION } : "skip",
  ) as
    | {
        menu: Doc<"menus">;
        items: MenuItemDoc[];
      }
    | null
    | undefined;

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

  const navItems = useMemo(() => {
    if (!menuData || menuData.items.length === 0) {
      return FALLBACK_NAV;
    }
    const tree = buildMenuTree(menuData.items, pathname);
    return tree.length ? tree : FALLBACK_NAV;
  }, [menuData, pathname]);

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
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
    </Sidebar>
  );
}
