"use client";

import React from "react";
import Link from "next/link";
import {
  Cog,
  Database,
  Globe,
  ListTree,
  MenuSquare,
  Settings,
  Tag,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

interface SettingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function SettingCard({ title, description, icon, href }: SettingCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {/* Content can be added here if needed */}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={href}>Manage {title}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function SettingsPage() {
  const settingsCategories: SettingCardProps[] = [
    {
      title: "Menu Items",
      description:
        "Manage navigation menus and their structure across the site",
      icon: <MenuSquare className="h-6 w-6" />,
      href: "/admin/settings/menus",
    },
    {
      title: "Custom Fields",
      description:
        "Configure custom fields for courses, products, and other content types",
      icon: <Tag className="h-6 w-6" />,
      href: "/admin/settings/custom-fields",
    },
    {
      title: "SEO Settings",
      description:
        "Configure site-wide SEO settings, meta tags, and social sharing",
      icon: <Globe className="h-6 w-6" />,
      href: "/admin/settings/seo",
    },
    {
      title: "Site Configuration",
      description: "Manage global site settings, branding, and appearance",
      icon: <Cog className="h-6 w-6" />,
      href: "/admin/settings/site",
    },
    {
      title: "Post Types",
      description: "Define and manage custom post types and their structure",
      icon: <ListTree className="h-6 w-6" />,
      href: "/admin/settings/post-types",
    },
    {
      title: "Advanced",
      description: "Access advanced configuration options and system settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/admin/settings/advanced",
    },
    {
      title: "Mock Data",
      description: "Generate test data for development and testing purposes",
      icon: <Database className="h-6 w-6" />,
      href: "/admin/settings/mockdata",
    },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage site-wide configuration and settings
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => (
          <SettingCard
            key={category.title}
            title={category.title}
            description={category.description}
            icon={category.icon}
            href={category.href}
          />
        ))}
      </div>
    </div>
  );
}

export default SettingsPage;
