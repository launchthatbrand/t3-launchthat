"use client";

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
  MoveLeftIcon,
  PieChart,
  Settings2,
  Share2,
  ShoppingCart,
  TerminalSquare,
  Twitter,
  User,
  Users,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@acme/ui/sidebar";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";

import { Doc } from "@convex-config/_generated/dataModel";
import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

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
      title: "Media",
      url: "/admin/media",
      icon: Image,
    },
    {
      title: "Courses",
      url: "/admin/lms/courses",
      icon: Users,
      items: [
        {
          title: "Lessons",
          url: "/admin/lessons",
          icon: BookOpen,
        },
        {
          title: "Topics",
          url: "/admin/topics",
          icon: BookOpen,
        },
        {
          title: "Quizzes",
          url: "/admin/quizzes",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Downloads",
      url: "/admin/downloads",
      icon: Bot,
      items: [
        {
          title: "Create",
          url: "/admin/downloads/create",
          icon: BookOpen,
        },
        {
          title: "Categories",
          url: "/admin/downloads/category",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Campaign Calendar",
      url: "/admin/calendar",
      icon: BookOpen,
      items: [
        {
          title: "Create Calendar",
          url: "/admin/calendar/create",
          icon: BookOpen,
        },
        {
          title: "Create Event",
          url: "/admin/calendar/event/create",
          icon: BookOpen,
        },
        {
          title: "Categories",
          url: "/admin/calendar/category",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Document Library",
      url: "/admin/documents",
      icon: Users,
      items: [
        {
          title: "Create",
          url: "/admin/documents/create",
          icon: BookOpen,
        },
        {
          title: "Categories",
          url: "/admin/documents/category",
          icon: BookOpen,
        },
      ],
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
          url: "/admin/products/category",
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
      title: "Districts",
      url: "/admin/groups",
      icon: ShoppingCart,
    },
    {
      title: "Blog",
      url: "/admin/posts",
      icon: BookOpen,
      items: [
        {
          title: "Dashboard",
          url: "/admin/posts",
          icon: BookOpen,
        },
        {
          title: "Create Post",
          url: "/admin/posts/create",
          icon: BookOpen,
        },
        {
          title: "Categories",
          url: "/admin/posts/category",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Helpdesk",
      url: "/admin/helpdesk",
      icon: HelpCircle,
      items: [
        {
          title: "Tickets",
          url: "/admin/helpdesk/tickets",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Social",
      url: "/social/feed",
      icon: Twitter,
      items: [
        {
          title: "Feed",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
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
          title: "Post types",
          url: "/admin/settings/post-types",
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
    {
      title: "Integrations",
      url: "/admin/integrations",
      icon: Share2,
      items: [
        {
          title: "Apps",
          url: "/admin/integrations",
        },
        {
          title: "Connections",
          url: "/admin/integrations?tab=connections",
        },
        {
          title: "Scenarios",
          url: "/admin/integrations?tab=scenarios",
        },
      ],
    },
  ];
  const boards: Doc<"taskBoards">[] | undefined = useQuery(
    api.tasks.boards.listBoards,
    {},
  );

  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              onClick={() => router.push("/admin")}
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <MoveLeftIcon />
              <span>Back To Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain
          items={(boards ?? []).map((board) => ({
            title: board.name,
            url: `/admin/tasks/board/${board._id}`,
            key: board._id,
          }))}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
