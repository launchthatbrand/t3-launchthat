"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import { TraderLaunchpadNavUser } from "~/components/auth/TraderLaunchpadNavUser";
import { NavItems } from "~/components/ui/resizable-navbar";

export function Header() {
  const navItems = [
    {
      name: "Features",
      link: "/#features",
    },
    {
      name: "Brokers",
      link: "/brokers",
    },
    {
      name: "Prop Firms",
      link: "/firms",
    },
    {
      name: "Leaderboards",
      link: "/leaderboards",
    },
    {
      name: "Blog",
      link: "#blog",
    },
  ];

  return (
    <header className="sticky z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo Icon */}
            <Image
              src="/images/tl-logo-1.png"
              alt="Trader Launchpad"
              width={100}
              height={100}
              className="h-12 w-12"
              priority
            />
            <span className="bg-linear-to-b from-white from-40% via-orange-200 via-60% to-orange-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Trader Launchpad
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <NavItems items={navItems} className="relative hidden w-auto md:flex" />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Portal parity: tenant hosts derive auth state from /api/me; auth host uses Clerk session */}
          <TraderLaunchpadNavUser />
        </div>
      </div>
    </header>
  );
}
