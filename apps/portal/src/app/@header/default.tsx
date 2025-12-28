"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@acme/ui/breadcrumb";
import AppHeader from "@acme/ui/layout/AppHeader";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@acme/ui/navigation-menu";
import { ThemeToggleButton } from "@acme/ui/theme";

import { PortalNavUser } from "~/components/auth/PortalNavUser";
import { NotificationIcon } from "~/components/notifications/NotificationIcon";
import { useTenant } from "~/context/TenantContext";

export default function HeaderLayout({
  children: _children,
}: {
  children: React.ReactNode;
  appName?: string;
  sidebarToggle?: boolean;
  className?: string;
}) {
  return (
    <>
      <div className="bg-background sticky top-0 z-50">
        <TopHeader />
      </div>
      {/* <MainHeader /> */}
      <Breadcrumbs />
    </>
  );
}

const TopHeader = () => {
  const tenant = useTenant();
  const rawLogo: unknown = (tenant as { logo?: unknown } | null)?.logo;
  const logoUrl = typeof rawLogo === "string" ? rawLogo : "";

  return (
    <AppHeader
      appName={tenant?.name ?? "WallStreet Academy"}
      sidebarToggle={true}
      image={logoUrl}
      className="bg-background"
      rightSlot={
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <NotificationIcon />
          </div>
          <PortalNavUser />
        </div>
      }
    />
  );
};

const _MainHeader = () => {
  return (
    <div className="bg-purple-900 px-6 py-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex flex-col items-start">
            <span className="text-2xl font-bold">TARGET ZERO</span>

            <span className="text-sm uppercase">RESOURCE PORTAL</span>
          </Link>
        </div>

        <NavigationMenu className="hidden xl:flex">
          <NavigationMenuList className="space-x-2">
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " text-white"}
              >
                <Link href="/resources">
                  <span className="mr-1">📚</span> Resources
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " text-white"}
              >
                <Link href="/document-library">
                  <span className="mr-1">📄</span> Document Library
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " text-white"}
              >
                <Link href="/request-materials">
                  <span className="mr-1">🛒</span> Request Materials
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " text-white"}
              >
                <Link href="/districts">
                  <span className="mr-1">🏢</span> Districts
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " text-white"}
              >
                <Link href="/tips-tuesday">
                  <span className="mr-1">💡</span> Tips Tuesday
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " text-white"}
              >
                <Link href="/category">
                  <span className="mr-1">📝</span> Blog
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-white">
                <span className="mr-1">👥</span> Target Zero Team
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/target-zero-team/about"
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                      >
                        <div className="text-sm leading-none font-medium">
                          About the Team
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                          Learn about the Target Zero initiative and our team
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/target-zero-team/members"
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                      >
                        <div className="text-sm leading-none font-medium">
                          Team Members
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                          Meet the people working on Target Zero
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " text-white"}
              >
                <Link href="/support">
                  <span className="mr-1">❓</span> Support
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

const Breadcrumbs = () => {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  // Create breadcrumb items from the path
  const getBreadcrumbItems = () => {
    // If we're at the root, just show Home
    if (paths.length === 0) {
      return (
        <>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    }

    // Otherwise build the path hierarchy
    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>

        {paths.map((path, index) => {
          const href = `/${paths.slice(0, index + 1).join("/")}`;
          const isLast = index === paths.length - 1;
          const label =
            path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <Breadcrumb className="hidden items-center border-b bg-gray-100 px-6 py-2 shadow-sm md:flex">
      <BreadcrumbList>{getBreadcrumbItems()}</BreadcrumbList>
    </Breadcrumb>
  );
};
