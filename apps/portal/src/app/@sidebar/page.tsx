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

import { cn, NavItem, SidebarContent } from "@acme/ui";
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
} from "@acme/ui/components/sidebar";
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

export default function WordPressSidebar() {
  const pathname = usePathname();

  // Fetch courses
  // const { data: coursesData, isLoading } = useQuery({
  //   queryKey: ["courses"],
  //   queryFn: async () => {
  //     const response = await fetch(
  //       process.env.NEXT_PUBLIC_WSA_WORDPRESS_API_URL2!,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Accept: "application/json",
  //         },
  //         body: JSON.stringify({
  //           query: GET_COURSES,
  //         }),
  //       },
  //     );

  //     if (!response.ok) {
  //       throw new Error(`API responded with status ${response.status}`);
  //     }

  //     const data = await response.json();
  //     return data.data.courses;
  //   },
  // });

  // const courses = coursesData?.nodes ?? [];

  return (
    <>
      <SidebarHeader className="h-14 justify-center bg-red-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
    </>
  );
}
