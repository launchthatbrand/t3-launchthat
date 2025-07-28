"use client";

import { ClipboardList, PieChart, Settings, Users } from "lucide-react";

import Link from "next/link";
import { ReactNode } from "react";
import { Separator } from "@acme/ui/separator";
import { cn } from "@acme/ui";
import { usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminOrdersLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const baseUrl = "/admin/store";

  const navItems = [
    {
      title: "Orders",
      href: "/admin/orders",
      icon: ClipboardList,
      active: pathname === "/admin/orders",
    },
    {
      title: "Analytics",
      href: "/admin/orders/analytics",
      icon: PieChart,
      active: pathname === "/admin/orders/analytics",
    },
    {
      title: "Settings",
      href: "/admin/orders/settings",
      icon: Settings,
      active: pathname === "/admin/orders/settings",
    },
  ];

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="mb-8 border-b">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <Link
            href={`${baseUrl}`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname === `${baseUrl}/courses` ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Dashboard
          </Link>
          <Link
            href={`${baseUrl}/orders`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/lessons`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Orders
          </Link>
          <Link
            href={`${baseUrl}/products`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/topics`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Products
          </Link>
          <Link
            href={`${baseUrl}/products/categories`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/quizzes`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Product Categories
          </Link>
          <Link
            href={`${baseUrl}/products/tags`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/quizzes`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Product Tags
          </Link>
        </nav>
      </div>
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">
          Manage your store orders, customers, and settings
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {children}
      </div>
    </div>
  );
}
