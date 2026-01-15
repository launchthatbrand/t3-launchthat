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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            TL
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            TraderLaunchpad
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-400 md:flex">
          <Link href="#features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link href="#pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
          <Link
            href="#testimonials"
            className="transition-colors hover:text-white"
          >
            Reviews
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {userId ? (
            <Button
              asChild
              variant="default"
              className="border-0 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/admin/dashboard">Go to Journal</Link>
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
                className="border-0 bg-white text-black hover:bg-gray-200"
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
