"use client";

import type { Id } from "@portal/convex/_generated/dataModel";
import type { FeedType } from "launchthat-plugin-socialfeed/components";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useConvexAuth } from "convex/react";
import {
  FeedFilters,
  FeedStream,
} from "launchthat-plugin-socialfeed/components";
import { Plus } from "lucide-react";

import type { FilterValue } from "@acme/ui/entity-list/types";
import { Button } from "@acme/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useConvexUser } from "~/hooks/useConvexUser";

// Wrapper component for FeedFilters to handle Suspense
function FeedFiltersWrapper({
  onFiltersChange,
}: {
  onFiltersChange: (filters: Record<string, FilterValue>) => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="bg-muted h-10 w-full animate-pulse rounded-md" />
      }
    >
      <FeedFilters onFiltersChange={onFiltersChange} />
    </Suspense>
  );
}

export default function FeedPage() {
  const { isAuthenticated } = useConvexAuth();
  const { convexId } = useConvexUser();
  const [activeTab, setActiveTab] = useState<FeedType>("universal");
  const [activeFilters, setActiveFilters] = useState<
    Record<string, FilterValue>
  >({});

  const handleFiltersChange = (filters: Record<string, FilterValue>) => {
    setActiveFilters(filters);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Feed</h1>
          <Button asChild>
            <Link href="/social/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Link>
          </Button>
        </div>

        <div className="mb-4">
          <FeedFiltersWrapper onFiltersChange={handleFiltersChange} />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FeedType)}
          className="mb-6"
        >
          <TabsList className="w-full">
            <TabsTrigger value="universal" className="flex-1">
              For You
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="personalized" className="flex-1">
                Following
              </TabsTrigger>
            )}
            <TabsTrigger value="group" className="flex-1" disabled>
              Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="universal">
            <FeedStream
              feedType="universal"
              limit={10}
              className="pt-4"
              filters={activeFilters}
            />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="personalized">
              <FeedStream
                feedType="personalized"
                filters={{
                  ...activeFilters,
                  userId: convexId as Id<"users">,
                }}
                limit={10}
                className="pt-4"
              />
            </TabsContent>
          )}

          <TabsContent value="group">
            <div className="rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                Group feed functionality coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
