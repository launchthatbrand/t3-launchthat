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
      url: "/dashboard",
      icon: TerminalSquare,
      isActive: true,
    },
    {
      title: "Courses",
      url: "/courses",
      icon: Users,
    },
    {
      title: "Downloads",
      url: "/downloads",
      icon: Bot,
    },
    {
      title: "Campaign Calendar",
      url: "/calendar",
      icon: BookOpen,
    },
    {
      title: "Document Library",
      url: "/documents",
      icon: Users,
    },
    {
      title: "Shop",
      url: "/store",
      icon: User,
    },
    {
      title: "Districts",
      url: "/groups",
      icon: ShoppingCart,
    },
    {
      title: "Blog",
      url: "/posts",
      icon: BookOpen,
    },
    {
      title: "Helpdesk",
      url: "/helpdesk",
      icon: HelpCircle,
    },
    {
      title: "Social",
      url: "/social/feed",
      icon: Twitter,
    },
  ];

  const loginSegment = useSelectedLayoutSegment("sidebar");
  console.log("loginSegment", loginSegment);

  return (
    <>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <NavMain items={navMain} />
    </>
  );
}
