"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

function RolesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const baseUrl = "/admin/settings/roles";

  return (
    <div className="container py-6">
      {/* Heading & Tabs */}
      <h1 className="mb-4 text-3xl font-bold">Roles and Permissions</h1>

      <div className="mb-8 border-b">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <Link
            href={`${baseUrl}`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname === `${baseUrl}/courses` ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Roles
          </Link>
          <Link
            href={`${baseUrl}/permissions`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/lessons`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Permissions
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

export default RolesLayout;
