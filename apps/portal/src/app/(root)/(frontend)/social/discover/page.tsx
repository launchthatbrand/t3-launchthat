"use client";

import { Compass, Hash, Sparkles, TrendingUp } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { SearchBar } from "../../../../../components/shared/SearchBar";
import { RecommendedContentSection } from "../../../../../components/social/RecommendedContentSection";
import { TopicsBrowser } from "../../../../../components/social/TopicsBrowser";
import { TrendingContentSection } from "../../../../../components/social/TrendingContentSection";

export default function DiscoverPage() {
  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Compass className="h-8 w-8" />
          Discover
        </h1>

        <div className="w-full max-w-md">
          <SearchBar placeholder="Search posts, topics, users..." />
        </div>
      </div>

      <Tabs defaultValue="trending" className="mb-8">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="trending" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            For You
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            Topics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-0">
          <TrendingContentSection limit={10} />
        </TabsContent>

        <TabsContent value="recommended" className="mt-0">
          <RecommendedContentSection limit={10} />
        </TabsContent>

        <TabsContent value="topics" className="mt-0">
          <TopicsBrowser limit={16} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
