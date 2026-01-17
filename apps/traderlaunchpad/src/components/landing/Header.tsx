import React from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@acme/ui/button";

export async function Header() {
  const { userId } = await auth();

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

        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-400 md:flex">
          <Link href="#features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link href="#about" className="transition-colors hover:text-white">
            About
          </Link>
          <Link href="#blog" className="transition-colors hover:text-white">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {userId ? (
            <Button
              asChild
              variant="default"
              className="rounded-full bg-white px-6 text-black hover:bg-gray-200"
            >
              <Link href="/admin/dashboard">Journal</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-white px-6 text-black hover:bg-gray-200"
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
