"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpCircleIcon,
  BookOpen,
  ChevronRight,
  Download,
  LayoutDashboard,
} from "lucide-react";

import { cn, NavItem, Separator, SidebarContent } from "@acme/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/components/collapsible";
import { ScrollArea } from "@acme/ui/components/scroll-area";
import {
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@acme/ui/components/sidebar";
import { Logo } from "@acme/ui/general/Logo";
import { NavUser } from "@acme/ui/general/nav-user";
import TopNavbar from "@acme/ui/general/TopNavbar";
import { NavMain } from "@acme/ui/sidebar/nav-main";

// import { GET_COURSES } from "~/app/course/queries";

interface Course {
  id: string;
  title: string;
}

const sidebarNavItems: NavItem[] = [
  { title: "Groups", url: "/admin/groups" },
  { title: "Downloads", url: "/admin/downloads" },
  { title: "Store", url: "/admin/store" },
  { title: "Invitations", url: "/admin/invitations" },
  { title: "Cart", url: "/admin/cart" },
  { title: "User", url: "/admin/users" },
];

export default function AppHeader() {
  return null;
}
