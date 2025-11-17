"use client";

import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { SidebarHeader } from "@acme/ui/sidebar";

import { navItems } from "../_components/nav-items";

export default function DefaultSidebar() {
  return (
    <>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <NavMain items={navItems} />
    </>
  );
}
