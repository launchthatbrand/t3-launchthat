"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { TabConfig } from "./NavigationContext";
import { NavigationContext } from "./NavigationContext";

type AdminLayoutContextValue = {
  title: string;
  description: string;
  tabs: TabConfig[];
  showTabs: boolean;
  activeTab?: string;
  setActiveTab: (next: string) => void;
  navigationContext: NavigationContext;
};

const AdminLayoutContext = createContext<AdminLayoutContextValue | undefined>(
  undefined,
);

export const useAdminLayout = () => {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) {
    throw new Error("useAdminLayout must be used within AdminLayout");
  }
  return ctx;
};

export type { TabConfig } from "./NavigationContext";

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  description: string;
  tabs?: TabConfig[];
  activeTab?: string;
  showTabs?: boolean;
  baseUrl?: string;
  pathname?: string;
  forceNavigationContext?: NavigationContext;
  navigation?: NavigationContext;
};

export const AdminLayout = ({
  children,
  title,
  description,
  tabs = [],
  activeTab,
  showTabs = true,
  forceNavigationContext,
  navigation = NavigationContext.SECTION_LEVEL,
}: AdminLayoutProps) => {
  const pathname = usePathname();
  const initialTab = activeTab ?? tabs[0]?.value;
  const [currentTab, setCurrentTab] = useState(initialTab);

  useEffect(() => {
    setCurrentTab((prev) => activeTab ?? tabs[0]?.value ?? prev);
  }, [activeTab, tabs]);

  const value: AdminLayoutContextValue = {
    title,
    description,
    tabs,
    showTabs,
    activeTab: currentTab,
    setActiveTab: setCurrentTab,
    navigationContext: forceNavigationContext ?? navigation,
  };

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
};

type AdminLayoutHeaderProps = {
  className?: string;
  tabsOverride?: TabConfig[];
};

export const AdminLayoutHeader = ({
  className = "",
  tabsOverride,
}: AdminLayoutHeaderProps) => {
  const router = useRouter();
  const { title, description, showTabs, activeTab, tabs, setActiveTab } =
    useAdminLayout();
  const finalTabs = tabsOverride ?? tabs;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        {showTabs && finalTabs.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {finalTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  asChild={Boolean(tab.href)}
                  disabled={tab.disabled}
                >
                  {tab.href ? (
                    <Link href={tab.href}>{tab.label}</Link>
                  ) : (
                    <button type="button">{tab.label}</button>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
    </Card>
  );
};

type AdminLayoutContentProps = {
  children: ReactNode;
  withSidebar?: boolean;
};

export const AdminLayoutContent = ({
  children,
  withSidebar,
}: AdminLayoutContentProps) => {
  if (withSidebar) {
    return <div className="grid gap-4 md:grid-cols-4">{children}</div>;
  }
  return <div className="space-y-4">{children}</div>;
};

type SectionProps = {
  children: ReactNode;
  className?: string;
};

export const AdminLayoutMain = ({ children, className = "" }: SectionProps) => (
  <Card className={className}>
    <CardContent className="p-6">{children}</CardContent>
  </Card>
);

export const AdminLayoutSidebar = ({
  children,
  className = "",
}: SectionProps) => (
  <div className={`flex flex-col gap-4 ${className}`}>{children}</div>
);

export { NavigationContext, STORE_TABS, ORDER_TABS } from "./NavigationContext";
