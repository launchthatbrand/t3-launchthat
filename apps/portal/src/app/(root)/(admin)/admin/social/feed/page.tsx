"use client";

import Link from "next/link";
import { FeedStream } from "launchthat-plugin-socialfeed/components";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function SocialFeedItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Social Feed Items
          </h1>
          <p className="text-muted-foreground text-sm">
            Every post created by members lives here. Use this view to moderate
            content and jump directly into the default editor when needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/edit?post_type=social-feed-item">
              Open Classic Editor
            </Link>
          </Button>
          <Button asChild>
            <Link href="/social/create" target="_blank">
              Create Post
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Feed Preview</CardTitle>
          <CardDescription>
            This is exactly what members see on the public `/social/feed` page.
            Click a post to drill into the detail view and comments.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <FeedStream feedType="universal" limit={20} />
        </CardContent>
      </Card>
    </div>
  );
}
