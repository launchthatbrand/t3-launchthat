"use client";

import * as React from "react";

import {
  IconApi,
  IconBrandTabler,
  IconBuilding,
  IconBulb,
  IconChartBar,
  IconCreditCard,
  IconDatabase,
  IconLink,
  IconNotebook,
  IconPlug,
  IconSettings,
  IconTargetArrow,
  IconTestPipe,
  IconUsers,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@acme/ui/sidebar";

import Image from "next/image";
import Link from "next/link";
import { OrgSubdomainSwitcher } from "~/components/organizations/OrgSubdomainSwitcher";
import { TraderLaunchpadAdminTeamSwitcher } from "~/components/organizations/TraderLaunchpadAdminTeamSwitcher";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  subItems?: Array<{ label: string; href: string }>;
}

const NAV_ICON_CLASS =
  "text-foreground/80 transition-colors group-hover/menu-button:text-foreground group-data-[active=true]/menu-button:text-orange-700 dark:group-data-[active=true]/menu-button:text-orange-100";
// Keep nav icons the same size in both expanded + collapsed (icon) modes.
const NAV_ICON_SIZE_CLASS = "h-6 w-6";

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/platform",
    icon: (
      <IconBrandTabler
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Users",
    href: "/platform/users",
    icon: (
      <IconUsers
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
    subItems: [
      { label: "Directory", href: "/platform/users" },
      { label: "Roles", href: "/platform/users/roles" },
    ],
  },
  {
    label: "Affiliates",
    href: "/platform/affiliates",
    icon: (
      <IconLink
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Billing",
    href: "/platform/billing",
    icon: (
      <IconCreditCard
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
    subItems: [
      { label: "Overview", href: "/platform/billing" },
      { label: "Orders", href: "/platform/billing/orders" },
      { label: "Products", href: "/platform/billing/products" },
      { label: "Coupons", href: "/platform/billing/coupons" },
    ],
  },
  {
    label: "Organizations",
    href: "/platform/organizations",
    icon: (
      <IconBuilding
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "CRM",
    href: "/platform/crm",
    icon: (
      <IconNotebook
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
    subItems: [
      { label: "Contacts", href: "/platform/crm/contacts" },
      { label: "Join codes", href: "/platform/crm/joincodes" },
    ],
  },
  {
    label: "Integrations",
    href: "/platform/integrations",
    icon: (
      <IconApi
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Connections",
    href: "/platform/connections",
    icon: (
      <IconPlug
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Data",
    href: "/platform/data",
    icon: (
      <IconDatabase
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Analytics",
    href: "/platform/analytics",
    icon: (
      <IconChartBar
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Tests",
    href: "/platform/tests",
    icon: (
      <IconTestPipe
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Settings",
    href: "/platform/settings",
    icon: (
      <IconSettings
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
] as const;

export default function AdminSidebarDefault() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden border-border/40 bg-background/70 text-foreground backdrop-blur-md"
    >
      {/* Remove default header padding so logo aligns with nav menu inset. */}
      <SidebarHeader className="p-0">
        <TraderLaunchpadAdminTeamSwitcher />
        {/* Match the nav menu inset so the logo aligns with items. */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-3 gap-2 group-data-[collapsible=icon]:items-center">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin/dashboard"
                ? pathname === "/admin/dashboard" || pathname === "/admin"
                : pathname.startsWith(item.href);
            const isExpanded =
              Boolean(item.subItems?.length) &&
              item.href !== "/platform" &&
              pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={isActive}
                  size="default"
                  // Default SidebarMenuButton collapses smaller in icon mode; keep it roomy.
                  // Also override the default `[&>svg]:size-4` so icons stay bigger.
                  className="h-11 rounded-xl text-foreground/80 hover:bg-foreground/5 hover:text-foreground data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-700 dark:data-[active=true]:text-orange-100 group-data-[collapsible=icon]:size-11! [&>svg]:size-6!"
                >
                  <Link
                    href={item.href}
                    className="gap-3 font-medium tracking-tight group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                  >
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {isExpanded ? (
                  <div className="ml-4 mt-2 space-y-1 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                    {item.subItems.map((subItem) => {
                      const subActive = pathname.startsWith(subItem.href);
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block rounded-lg px-2 py-1 transition ${subActive
                              ? "bg-orange-500/10 text-orange-700 dark:text-orange-100"
                              : "hover:bg-foreground/5 hover:text-foreground"
                            }`}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}