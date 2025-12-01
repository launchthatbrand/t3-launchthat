"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PortalSocialFeedProvider } from "@/src/providers/SocialFeedProvider";
import { BookMarked, Home, Plus, Search, User } from "lucide-react";

interface SocialNavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems: SocialNavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Feed",
      href: "/social/feed",
      active: pathname === "/social/feed",
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: "Explore",
      href: "/social/explore",
      active: pathname === "/social/explore",
    },
    {
      icon: <Plus className="h-5 w-5" />,
      label: "Create",
      href: "/social/create",
      active: pathname === "/social/create",
    },
    {
      icon: <BookMarked className="h-5 w-5" />,
      label: "Saved",
      href: "/social/saved",
      active: pathname === "/social/saved",
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Profile",
      href: "/social/profile",
      active: pathname === "/social/profile",
    },
  ];

  return (
    <PortalSocialFeedProvider>
      <div className="min-h-screen">
        <div className="pb-16 md:pb-0 md:pl-16">{children}</div>

        <nav className="bg-background fixed bottom-0 left-0 z-10 flex w-full justify-around border-t p-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.active
                  ? "text-primary flex flex-col items-center justify-center rounded-md p-2 text-xs"
                  : "text-muted-foreground hover:text-foreground flex flex-col items-center justify-center rounded-md p-2 text-xs"
              }
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}
        </nav>

        <nav className="bg-background absolute top-0 left-0 z-10 hidden h-full w-16 flex-col border-r md:flex">
          <div className="flex flex-1 flex-col items-center justify-start gap-4 pt-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.active
                    ? "text-primary flex w-full flex-col items-center justify-center p-3 text-xs"
                    : "text-muted-foreground hover:text-foreground flex w-full flex-col items-center justify-center p-3 text-xs"
                }
              >
                {item.icon}
                <span className="mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </PortalSocialFeedProvider>
  );
}
