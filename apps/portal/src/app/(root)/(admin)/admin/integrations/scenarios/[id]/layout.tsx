import React, { use } from "react";
import { headers } from "next/headers";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
} from "~/components/admin/AdminLayout";
import AdminSinglePost, {
  AdminSinglePostHeader,
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostTabs,
  AdminSinglePostTabsContent,
  AdminSinglePostTabsList,
  AdminSinglePostTabsTrigger,
  AdminSinglePostTabsTriggerut,
} from "~/components/admin/AdminSinglePostLayout";
import { NavigationContext } from "~/components/admin/NavigationContext";

const SCENARIO_TABS = [
  {
    label: "Scenario",
    value: "details",
    navigationContext: NavigationContext.ENTITY_LEVEL,
  },
  {
    label: "Logs",
    value: "media",
    navigationContext: NavigationContext.ENTITY_LEVEL,
  },
  {
    label: "Incomplete Executions",
    value: "incomplete",
    navigationContext: NavigationContext.ENTITY_LEVEL,
  },
];

const ScenarioLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) => {
  const headersList = headers();
  const pathname = (await headersList).get("x-pathname"); // this is the requested path
  console.log("pathname", pathname);

  console.log("Full path:", pathname);
  const baseUrl = "/admin/integrations/scenarios";

  const pageConfig = {
    title: "Scenarios",
    description: "Scenarios",
    showTabs: true,
    activeTab: "content",
    tabs: SCENARIO_TABS,
    baseUrl: "/admin/integrations/scenarios",
    pathname: "/admin/integrations/scenarios",
    navigationContext: NavigationContext.SECTION_LEVEL,
  };
  return (
    <AdminLayout
      title={pageConfig.title}
      description={pageConfig.description}
      showTabs={pageConfig.showTabs}
      activeTab={pageConfig.activeTab}
      tabs={pageConfig.tabs}
      baseUrl={baseUrl}
      pathname={pathname} // Enable auto-detection
      forceNavigationContext={pageConfig.navigationContext} // Override detection if needed
    >
      <AdminLayoutHeader />
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminLayout>
  );
};

export default ScenarioLayout;
