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

export default function HeaderLayout({
  children: _children,
}: {
  children: React.ReactNode;
  appName?: string;
  sidebarToggle?: boolean;
  className?: string;
}) {
  return (
    <header className="flex w-full flex-col">
      <TopHeader />
      {/* <MainHeader /> */}
      <Breadcrumbs />
    </header>
  );
}

const TopHeader = () => {
  return (
    <AppHeader
      appName="WallStreet Academy"
      sidebarToggle={true}
      image="https://app.wsatraining.com/wp-content/uploads/2018/03/wsa_logo-01.png"
    />
  );
};

const MainHeader = () => {
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
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          About the Team
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Learn about the Target Zero initiative and our team
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/target-zero-team/members"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Team Members
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
    <Breadcrumb className="hidden items-center bg-gray-100 px-6 py-2 md:flex">
      <BreadcrumbList>{getBreadcrumbItems()}</BreadcrumbList>
    </Breadcrumb>
  );
};
