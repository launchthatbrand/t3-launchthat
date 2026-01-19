"use client";

import { IconBrandTabler, IconSettings, IconUserBolt } from "@tabler/icons-react";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "~/components/ui/sidebar";
import { UserButton, useAuth } from "@clerk/nextjs";

import { Grid } from "lucide-react";
import { GridLines } from "~/components/background/GridLines";
import Link from "next/link";
import { NavItems } from "~/components/ui/resizable-navbar";
import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      link: "/admin/dashboard",
    },
    {
      name: "Trading Plan",
      link: "/admin/tradingplan",
    },
    {
      name: "TradeIdeas",
      link: "/admin/tradeideas",
    },
    {
      name: "Orders",
      link: "/admin/orders",
    },
    {
      name: "Analytics",
      link: "/admin/analytics",
    },
    {
      name: "Integrations",
      link: "/admin/integrations",
    },
    {
      name: "Settings",
      link: "/admin/settings",
    },
  ];

  // Protect the route client-side (redundant with middleware but safe)
  React.useEffect(() => {
    if (isLoaded && !userId) {
      redirect("/sign-in");
    }
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) return null;

  const links = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Trading Journal",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Trade Ideas",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Trading Plan",
      href: "/admin/tradingplan",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div className="max-h-screen h-full flex flex-1 overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 min-h-screen z-50 border-white/10! border-r bg-black/40! backdrop-blur-md">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-black">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="tracking-tight">TraderLaunchpad</span>
            </Link> : <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-black">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Manu Arora",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 overflow-y-scroll">

        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <nav className="mx-6 hidden items-center space-x-4 lg:flex lg:space-x-6">
                <NavItems items={navItems} />
              </nav>
            </div>

            <div className="relative z-10">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        <div className="w-full px-4 py-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0">
              <GridLines columns={3} />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
