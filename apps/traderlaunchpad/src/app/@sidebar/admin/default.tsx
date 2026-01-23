"use client";

import * as React from "react";

import {
  IconBrandTabler,
  IconBulb,
  IconMessageCircle,
  IconNotebook,
  IconSettings,
  IconTargetArrow,
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
}

const NAV_ICON_CLASS =
  "text-white/80 transition-colors group-hover/menu-button:text-white group-data-[active=true]/menu-button:text-orange-200";
// Keep nav icons the same size in both expanded + collapsed (icon) modes.
const NAV_ICON_SIZE_CLASS = "h-6 w-6";

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <IconBrandTabler
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Trading Journal",
    href: "/admin/journal",
    icon: (
      <IconNotebook
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Trade Ideas",
    href: "/admin/tradeideas",
    icon: (
      <IconBulb
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Trading Plan",
    href: "/admin/tradingplan",
    icon: (
      <IconTargetArrow
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: (
      <IconMessageCircle
        stroke={1}
        className={`${NAV_ICON_CLASS} ${NAV_ICON_SIZE_CLASS}`}
      />
    ),
  },
  {
    label: "Settings",
    href: "/admin/settings",
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
      className="overflow-hidden border-white/10 bg-black/35 text-white backdrop-blur-md"
    >
      {/* Remove default header padding so logo aligns with nav menu inset. */}
      <SidebarHeader className="p-0">

        <TraderLaunchpadAdminTeamSwitcher />
        {/* Match the nav menu inset so the logo aligns with items. */}
        <SidebarMenu className="p-3 group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="default"
              tooltip={{
                children: "Trader Launchpad",
                hidden: false,
              }}
              // Default SidebarMenuButton collapses to `size-8` in icon mode.
              // Override that here so the brand mark stays larger + square.
              className="md:h-11 w-full p-0 rounded-xl hover:bg-white/8 active:bg-white/10 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
            >
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              >
                <div className="grid size-10 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/3">
                  <Image
                    src="/images/tl-logo-1.png"
                    alt="Trader Launchpad"
                    width={100}
                    height={100}
                    // Logo should always be slightly larger than nav icons.
                    className="h-7 w-7 object-contain"
                    priority
                  />
                </div>
                <span className="bg-linear-to-b from-white via-orange-200 to-orange-500 bg-clip-text text-sm font-semibold text-transparent group-data-[collapsible=icon]:hidden">
                  Trader Launchpad
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-3 gap-2 group-data-[collapsible=icon]:items-center">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin/dashboard"
                ? pathname === "/admin/dashboard" || pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={isActive}
                  size="default"
                  // Default SidebarMenuButton collapses smaller in icon mode; keep it roomy.
                  // Also override the default `[&>svg]:size-4` so icons stay bigger.
                  className="h-11 rounded-xl text-white/80 hover:bg-white/8 hover:text-white data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-100 group-data-[collapsible=icon]:size-11! [&>svg]:size-6!"
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
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}