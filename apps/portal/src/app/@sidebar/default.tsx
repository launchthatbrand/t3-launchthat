"use client";

import {
  AudioWaveform,
  Book,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  HelpCircle,
  Map,
  PieChart,
  Settings2,
  ShoppingCart,
  TerminalSquare,
  Twitter,
  User,
  Users,
} from "lucide-react";

import { SidebarHeader } from "@acme/ui/components/sidebar";
import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";

// import { useLearndash } from "../hooks/useLearndash";

// This is sample data.
const data = {
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
      title: "Resources",
      url: "/admin/downloads",
      icon: Bot,
      // items: courses.map((course) => ({
      //   title: course.title,
      //   url: `/course/${course.id}`,
      // })),
    },
    {
      title: "Campaign Calendar",
      url: "/admin/calendar",
      icon: BookOpen,
    },
    {
      title: "Document Library",
      url: "/admin/documents",
      icon: Users,
    },
    {
      title: "Shop",
      url: "/admin/products",
      icon: User,
    },
    {
      title: "Districts",
      url: "/admin/groups",
      icon: ShoppingCart,
    },
    {
      title: "Blog",
      url: "/admin/blog",
      icon: BookOpen,
    },
    {
      title: "Helpdesk",
      url: "/admin/helpdesk",
      icon: HelpCircle,
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
  ];

  return (
    <>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <NavMain items={navMain} />
      {/* <div className="px-2 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Discover
        </h2>
        <div className="space-y-1">
          <nav
            className={cn("flex flex-1 flex-col gap-1 p-1")}
            data-orientation="vertical"
          >
            <Link
              href="/wordpress"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith("/wordpress")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003V11H8.50003H9.00003V12H8.50003H7.50003H6.50003H6.00003V11H6.50003H7.50003V6.99999H6.50003H6.00003V5.99999Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
              WordPress
            </Link>
            <Link
              href="/monday"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith("/monday")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H3.5ZM2 2.5C2 1.67157 2.67157 1 3.5 1H11.5C12.3284 1 13 1.67157 13 2.5V12.5C13 13.3284 12.3284 14 11.5 14H3.5C2.67157 14 2 13.3284 2 12.5V2.5ZM4.5 4C4.22386 4 4 4.22386 4 4.5C4 4.77614 4.22386 5 4.5 5H10.5C10.7761 5 11 4.77614 11 4.5C11 4.22386 10.7761 4 10.5 4H4.5ZM4.5 7C4.22386 7 4 7.22386 4 7.5C4 7.77614 4.22386 8 4.5 8H10.5C10.7761 8 11 7.77614 11 7.5C11 7.22386 10.7761 7 10.5 7H4.5ZM4.5 10C4.22386 10 4 10.2239 4 10.5C4 10.7761 4.22386 11 4.5 11H10.5C10.7761 11 11 10.7761 11 10.5C11 10.2239 10.7761 10 10.5 10H4.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
              Monday
            </Link>
          </nav>
        </div>
      </div> */}
    </>
  );
}
