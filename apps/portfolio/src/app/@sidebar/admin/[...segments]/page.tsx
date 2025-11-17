"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  HelpCircle,
  Image,
  Map,
  PieChart,
  Settings2,
  Share2,
  ShoppingCart,
  TerminalSquare,
  Twitter,
  User,
  Users,
} from "lucide-react";

import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { SidebarHeader } from "@acme/ui/sidebar";

import { navItems } from "../../_components/nav-items";

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
