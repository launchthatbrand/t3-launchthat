"use client";

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  HelpCircle,
  Link,
  Map,
  PieChart,
  Settings2,
  ShoppingCart,
  TerminalSquare,
  Twitter,
  User,
  Users,
} from "lucide-react";

import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { SidebarHeader } from "@acme/ui/sidebar";

// import { useLearndash } from "../hooks/useLearndash";

// This is sample data (kept for reference).
const _data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export default function DefaultSidebar() {
  // const { courses } = useLearndash();

  const navMain = [
    {
      title: "Dashboard",
      url: "/admin",
      icon: TerminalSquare,
      isActive: true,
    },
    {
      title: "Shop",
      url: "/admin/store",
      icon: User,
      items: [
        {
          title: "Dashboard",
          url: "/admin/store",
          icon: BookOpen,
        },
        {
          title: "Orders",
          url: "/admin/orders",
          icon: BookOpen,
        },
        {
          title: "Products",
          url: "/admin/products",
          icon: BookOpen,
        },
        {
          title: "Categories",
          url: "/admin/products/categories",
          icon: BookOpen,
        },

        {
          title: "Tags",
          url: "/admin/products/tags",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Integrations",
      url: "/admin/integrations",
      icon: Link,
      items: [
        {
          title: "Monday.com",
          url: "/admin/integrations/monday",
          icon: Link,
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/admin/settings/site",
        },
        {
          title: "Content types",
          url: "/admin/settings/content-types",
        },
        {
          title: "Custom fields",
          url: "/admin/settings/custom-fields",
        },
        {
          title: "Menus",
          url: "/admin/settings/menus",
        },
        {
          title: "Seo",
          url: "/admin/settings/roles",
        },
      ],
    },
  ];

  return (
    <>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <NavMain items={navMain} />
    </>
  );
}
