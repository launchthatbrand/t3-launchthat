"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Please Sign In</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            You need to be signed in to access settings.
          </p>
          <Link
            href="/sign-in"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/settings", label: "General" },
    { href: "/settings/connections", label: "Connections" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account and application settings
          </p>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64">
            <nav className="overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isActive
                            ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
