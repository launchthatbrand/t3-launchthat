"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import React, { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";

interface LayoutConfig {
  title: string;
  description: string;
  tabs?: { label: string; value: string; href: string }[];
  activeTab?: string;
}

const toTitleCase = (value: string) =>
  value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");

const getSettingsLayoutConfig = (
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
): LayoutConfig => {
  const raw = pathname.replace(/^\/admin\/settings\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  const section = parts[0] ?? "";

  if (!section) {
    return {
      title: "Settings",
      description: "Manage site-wide configuration and settings",
    };
  }

  if (section === "emails") {
    const isTemplates =
      parts[1] === "templates" ||
      parts[1] === "template" ||
      parts[1] === "test";
    const activeTab =
      parts[1] === "templates" || parts[1] === "template"
        ? "templates"
        : parts[1] === "test"
          ? "test"
          : "sender";

    return {
      title: "Emails",
      description: "Email settings",
      tabs: [
        { label: "Sender", value: "sender", href: "/admin/settings/emails" },
        {
          label: "Templates",
          value: "templates",
          href: "/admin/settings/emails/templates",
        },
        { label: "Test", value: "test", href: "/admin/settings/emails/test" },
      ],
      activeTab: isTemplates ? activeTab : activeTab,
    };
  }

  if (section === "roles") {
    const activeTab = parts[1] === "permissions" ? "permissions" : "roles";
    return {
      title: "Roles and Permissions",
      description: "Manage roles and permissions across the portal",
      tabs: [
        { label: "Roles", value: "roles", href: "/admin/settings/roles" },
        {
          label: "Permissions",
          value: "permissions",
          href: "/admin/settings/roles/permissions",
        },
      ],
      activeTab,
    };
  }

  if (section === "site") {
    const rawTab = searchParams.get("tab") ?? "general";
    const allowedTabs = [
      "general",
      "branding",
      "localization",
      "domains",
      "advanced",
    ] as const;
    const activeTab = allowedTabs.includes(
      rawTab as (typeof allowedTabs)[number],
    )
      ? rawTab
      : "general";

    return {
      title: "Site Configuration",
      description: "Manage global site settings, branding, and appearance",
      tabs: [
        {
          label: "General",
          value: "general",
          href: "/admin/settings/site?tab=general",
        },
        {
          label: "Branding",
          value: "branding",
          href: "/admin/settings/site?tab=branding",
        },
        {
          label: "Localization",
          value: "localization",
          href: "/admin/settings/site?tab=localization",
        },
        {
          label: "Domains",
          value: "domains",
          href: "/admin/settings/site?tab=domains",
        },
        {
          label: "Advanced",
          value: "advanced",
          href: "/admin/settings/site?tab=advanced",
        },
      ],
      activeTab,
    };
  }

  if (section === "post-types") {
    const rawTab = searchParams.get("tab") ?? "types";
    const allowedTabs = ["types", "fields", "taxonomies"] as const;
    const activeTab = allowedTabs.includes(
      rawTab as (typeof allowedTabs)[number],
    )
      ? rawTab
      : "types";

    return {
      title: "Post Types",
      description: "Define and manage custom post types and their structure",
      tabs: [
        {
          label: "Post Types",
          value: "types",
          href: "/admin/settings/post-types?tab=types",
        },
        {
          label: "Fields",
          value: "fields",
          href: "/admin/settings/post-types?tab=fields",
        },
        {
          label: "Taxonomies",
          value: "taxonomies",
          href: "/admin/settings/post-types?tab=taxonomies",
        },
      ],
      activeTab,
    };
  }

  if (section === "organizations" && parts[1] && parts[1] !== "seed") {
    const organizationId = parts[1];
    const baseHref = `/admin/settings/organizations/${organizationId}`;
    const rawTab = searchParams.get("tab") ?? "overview";
    const allowedTabs = [
      "overview",
      "settings",
      "domains",
      "members",
      "danger",
    ] as const;

    const derivedTab =
      parts[2] === "users"
        ? "members"
        : allowedTabs.includes(rawTab as (typeof allowedTabs)[number])
          ? rawTab
          : "overview";

    return {
      title: "Organization",
      description: "Manage organization settings, domains, and members",
      tabs: [
        { label: "Overview", value: "overview", href: `${baseHref}?tab=overview` },
        { label: "Settings", value: "settings", href: `${baseHref}?tab=settings` },
        { label: "Domains", value: "domains", href: `${baseHref}?tab=domains` },
        { label: "Members", value: "members", href: `${baseHref}?tab=members` },
        { label: "Danger", value: "danger", href: `${baseHref}?tab=danger` },
      ],
      activeTab: derivedTab,
    };
  }

  const sectionTitleMap: Record<
    string,
    { title: string; description: string }
  > = {
    seo: {
      title: "SEO Settings",
      description: "Configure SEO, meta tags, and social sharing",
    },
    domains: {
      title: "Domains",
      description: "Configure domains and email domain verification",
    },
    notifications: {
      title: "Notifications",
      description: "Configure notification and messaging settings",
    },
    media: {
      title: "Media",
      description: "Manage media settings and uploads",
    },
    menus: {
      title: "Menus",
      description: "Manage navigation menus and their structure",
    },
    "content-types": {
      title: "Content Types",
      description: "Manage content type schemas and configuration",
    },
    taxonomies: {
      title: "Taxonomies",
      description: "Manage taxonomies, categories, and tagging",
    },
    categories: {
      title: "Categories",
      description: "Manage content categories",
    },
    templates: {
      title: "Templates",
      description: "Manage templates and reusable content structures",
    },
    "page-templates": {
      title: "Page Templates",
      description: "Manage page templates and layouts",
    },
    permalinks: {
      title: "Permalinks",
      description: "Configure permalink structure and routing",
    },
    advanced: {
      title: "Advanced",
      description: "Advanced configuration options and system settings",
    },
    mockdata: {
      title: "Mock Data",
      description: "Generate test data for development and QA",
    },
    organizations: {
      title: "Organizations",
      description: "Manage organizations and organization settings",
    },
    plans: {
      title: "Plans",
      description: "Manage subscription plans and access levels",
    },
    auditLog: {
      title: "Audit Log",
      description: "Review administrative activity and system events",
    },
    "marketing-tags": {
      title: "Marketing Tags",
      description: "Manage marketing tags and segmentation",
    },
  };

  const known = sectionTitleMap[section];
  if (known) return known;

  return {
    title: toTitleCase(section),
    description: "Manage settings",
  };
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const config = useMemo(
    () => getSettingsLayoutConfig(pathname, searchParams),
    [pathname, searchParams],
  );

  return (
    <AdminLayout
      title={config.title}
      description={config.description}
      tabs={config.tabs ?? []}
      activeTab={config.activeTab}
      pathname={pathname}
    >
      <AdminLayoutHeader />
      <AdminLayoutContent>
        <AdminLayoutMain>
          <div className="container py-4">{children}</div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
