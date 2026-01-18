import { ArrowRight } from "lucide-react";
import { Button } from "@acme/ui/moving-border";
import Link from "next/link";
import { NavItems } from "~/components/ui/resizable-navbar";
import React from "react";
import { Button as UiButton } from "@acme/ui/button";
import { auth } from "@clerk/nextjs/server";

export async function Header() {
  const { userId } = await auth();

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
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-black">
            <svg
              width="20"
              height="20"
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
          <span className="text-lg font-bold tracking-tight text-white">
            TraderLaunchpad
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <NavItems items={navItems} className="relative hidden w-auto md:flex" />
        </nav>

        <div className="flex items-center gap-4">
          {userId ? (
            <Link href="/admin/dashboard" className="inline-block">
              <Button
                as="div"
                borderRadius="1.75rem"
                containerClassName="h-10 w-auto min-w-[140px]"
                className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
              >
                <span className="flex w-full items-center justify-between gap-3 px-1">
                  <span className="w-full text-center font-bold">Dashboard</span>
                  <span className="flex min-h-7 min-w-7 items-center justify-center rounded-full bg-black text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </span>
              </Button>
            </Link>
          ) : (
            <>
              <UiButton
                asChild
                variant="ghost"
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Link href="/sign-in">Sign In</Link>
              </UiButton>
              <Link href="/sign-up" className="inline-block">
                <Button
                  as="div"
                  borderRadius="1.75rem"
                  containerClassName="h-10 w-auto min-w-[160px]"
                  className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
                >
                  <span className="flex w-full items-center justify-between gap-3 px-1">
                    <span>Get Started</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
