import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Metadata } from "next";
import MondayIntegrationManager from "@/components/integrations/monday/MondayIntegrationManager";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Monday.com Integration",
  description:
    "Manage your Monday.com integration and synchronization settings",
};

export default function MondayIntegrationPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-4">
      <PageHeader
        title="Monday.com Integration"
        description="Configure and manage your Monday.com integration"
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="board-mappings">Board Mappings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<IntegrationSkeleton />}>
            <MondayIntegrationManager defaultTab="overview" />
          </Suspense>
        </TabsContent>

        <TabsContent value="board-mappings" className="space-y-4">
          <Suspense fallback={<IntegrationSkeleton />}>
            <MondayIntegrationManager defaultTab="board-mappings" />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Suspense fallback={<IntegrationSkeleton />}>
            <MondayIntegrationManager defaultTab="settings" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IntegrationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div>
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
