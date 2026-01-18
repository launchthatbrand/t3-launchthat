"use client";

import { DottedGlowBackground, cn } from "@acme/ui";
import { IconArrowLeft, IconBrandTabler, IconSettings, IconUserBolt } from "@tabler/icons-react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { redirect, usePathname } from "next/navigation";

import Link from "next/link";
import { NavItems } from "~/components/ui/resizable-navbar";
import React from "react";
import { motion } from "motion/react";

const GridLines = () => (
  <div className="pointer-events-none absolute inset-0 z-0 mx-auto h-full max-w-7xl">
    <div className="absolute top-0 left-4 h-full w-px bg-white/5" />
    <div className="absolute top-0 right-4 h-full w-px bg-white/5" />
    <div className="absolute top-0 left-1/4 hidden h-full w-px bg-white/5 md:block" />
    <div className="absolute top-0 left-2/4 hidden h-full w-px bg-white/5 md:block" />
    <div className="absolute top-0 left-3/4 hidden h-full w-px bg-white/5 md:block" />
  </div>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isLoaded } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      link: "/admin/dashboard",
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

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <DottedGlowBackground
          color="rgba(255, 100, 0, 0.15)"
          glowColor="rgba(255, 120, 0, 0.6)"
          gap={24}
          radius={1.5}
          speedMin={0.2}
          speedMax={0.8}
        />

        <div className="absolute top-1/4 left-1/4 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[720px] w-[720px] translate-x-1/3 translate-y-1/3 rounded-full bg-orange-500/10 blur-[160px]" />

        {/* Architectural Curve */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
          preserveAspectRatio="none"
        >
          <path
            d="M-100,0 C200,420 620,0 1200,820 S1780,420 2200,1200"
            fill="none"
            stroke="url(#adminCurveGradient)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient
              id="adminCurveGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(249,115,22,0.5)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
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
            </Link>

            <nav className="mx-6 hidden items-center space-x-4 lg:flex lg:space-x-6">
              <NavItems items={navItems} />
            </nav>
          </div>

          <div className="relative z-10">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <GridLines />
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
