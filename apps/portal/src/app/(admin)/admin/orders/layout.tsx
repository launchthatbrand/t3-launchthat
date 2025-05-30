"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, PieChart, Settings, Users } from "lucide-react";

import { cn } from "@acme/ui";
import { Separator } from "@acme/ui/separator";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminOrdersLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

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
      title: "Customers",
      href: "/admin/orders/customers",
      icon: Users,
      active: pathname === "/admin/orders/customers",
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
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">
          Manage your store orders, customers, and settings
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                  item.active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
