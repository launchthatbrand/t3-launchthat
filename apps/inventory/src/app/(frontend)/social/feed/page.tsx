"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Id } from "../../../../../convex/_generated/dataModel";
import type { FilterValue } from "~/components/shared/EntityList/types";
import type { FeedType } from "~/components/social";
import { FeedStream } from "~/components/social";
import { FeedFilters } from "~/components/social/FeedFilters";

export default function FeedPage() {
  const { isAuthenticated } = useConvexAuth();
  const { userId } = useAuth();
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
          <FeedFilters onFiltersChange={handleFiltersChange} />
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
                  userId: userId as Id<"users">,
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
