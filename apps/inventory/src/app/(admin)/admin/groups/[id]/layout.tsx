"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";
import {
  Calendar,
  FileText,
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";

import { cn } from "@acme/ui";
import {
  AdminOnly,
  ModeratorOnly,
  PermissionGuard,
} from "@acme/ui/advanced/permission-guard";

interface GroupProfileLayoutProps {
  children: ReactNode;
  params: { id: string };
}

// Define the tab structure
const tabs = [
  {
    name: "Dashboard",
    href: "dashboard",
    icon: LayoutDashboard,
    permission: null, // null means accessible to everyone
  },
  {
    name: "About",
    href: "about",
    icon: FileText,
    permission: null,
  },
  {
    name: "Members",
    href: "members",
    icon: Users,
    permission: null,
  },
  {
    name: "Discussion",
    href: "discussion",
    icon: MessageSquare,
    permission: null,
  },
  {
    name: "Events",
    href: "events",
    icon: Calendar,
    permission: null,
  },
  {
    name: "Requests",
    href: "requests",
    icon: UserPlus,
    permission: "moderator", // Only moderators and above can see this
  },
];

export default function GroupProfileLayout({
  children,
  params,
}: GroupProfileLayoutProps) {
  const { id } = params;
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);

  // Get the current active tab from the URL path segments
  // The path will be like /admin/groups/[id]/[tab]
  // We need to extract the last segment
  const pathSegments = pathname.split("/");
  // If the last segment is empty (e.g., trailing slash), get the segment before
  const activeTab =
    pathSegments[pathSegments.length - 1] ||
    pathSegments[pathSegments.length - 2];

  // Fetch group data and user role
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setIsLoading(true);
        const convex = getConvex();
        const groupData = await convex.query(api.groups.queries.getGroupById, {
          groupId: id as Id<"groups">,
        });

        if (!groupData) {
          notFound();
        }

        setGroup(groupData);
        // Set user role based on membership
        setUserRole(groupData.userMembership?.role || null);
      } catch (error) {
        console.error("Failed to fetch group:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchGroup();
    }
  }, [id]);

  // If still loading, show a simple loading state
  if (isLoading) {
    return <div className="p-8">Loading group details...</div>;
  }

  // If no group was found, redirect to 404
  if (!group && !isLoading) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      {/* Group Header would go here, but we're keeping it simple for now */}
      <h1 className="mb-6 text-2xl font-bold">{group?.name}</h1>

      {/* Tab Navigation */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          {tabs.map((tab) => {
            // Skip tabs that require permissions the user doesn't have
            if (
              tab.permission &&
              (!userRole ||
                (tab.permission === "admin" && userRole !== "admin") ||
                (tab.permission === "moderator" &&
                  userRole !== "admin" &&
                  userRole !== "moderator"))
            ) {
              return null;
            }

            return (
              <Link
                key={tab.href}
                href={`/admin/groups/${id}/${tab.href}`}
                className={cn(
                  "inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium",
                  activeTab === tab.href
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      {/* <div className="mt-6">{children}</div> */}
    </div>
  );
}
