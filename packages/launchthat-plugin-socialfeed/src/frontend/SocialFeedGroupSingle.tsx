"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Id } from "../lib/types";
import { FeedStream } from "../components/FeedStream";
import { useSocialFeedAuth } from "../context/SocialFeedClientProvider";

export interface SocialFeedGroupPost {
  _id: Id<"posts">;
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  slug?: string | null;
  organizationId?: Id<"organizations"> | string | null;
}

interface SocialFeedGroupSingleProps {
  post: SocialFeedGroupPost;
}

export function SocialFeedGroupSingle({ post }: SocialFeedGroupSingleProps) {
  const { isAuthenticated } = useSocialFeedAuth();
  const [activeTab, setActiveTab] = useState<"discussion" | "about">(
    "discussion",
  );

  const title =
    post.title && post.title.trim().length > 0
      ? post.title
      : "Untitled Social Group";
  const excerpt =
    post.excerpt ??
    "Connect with peers, share updates, and collaborate inside this group.";
  const description =
    typeof post.content === "string" && post.content.trim().length > 0
      ? post.content
      : excerpt;

  return (
    <div className="bg-background">
      <section className="border-border/30 from-primary/5 via-background to-background border-b bg-linear-to-br">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="space-y-4">
            <div className="text-primary/70 border-primary/30 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              <Users className="h-4 w-4" />
              Social Group
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {excerpt}
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setActiveTab("discussion")}
                >
                  View discussions
                </Button>
              ) : (
                <Card className="bg-muted/30 border-dashed">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">
                      Sign in to join the conversation
                    </CardTitle>
                    <CardDescription>
                      You need an account to post updates to this group.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
          <div className="text-muted-foreground text-sm">
            <p>
              <strong>Slug:</strong> {post.slug ?? "n/a"}
            </p>
            {post.organizationId ? (
              <p>
                <strong>Organization:</strong> {post.organizationId}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="discussion" className="space-y-6">
            <FeedStream feedType="group" targetId={post._id} limit={12} />
          </TabsContent>
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About this group</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextBlock content={description} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function RichTextBlock({ content }: { content?: string | null }) {
  if (!content) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return <p className="text-muted-foreground whitespace-pre-line">{content}</p>;
}
