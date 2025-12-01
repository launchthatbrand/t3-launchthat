"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FeedStream,
  PostCreator,
} from "launchthat-plugin-socialfeed/components";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

export default function SocialHubDashboardPage() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Social Hub</h1>
          <p className="text-muted-foreground text-sm">
            Monitor organization-wide conversations, publish announcements, and
            keep tabs on engagement without leaving the admin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/social/feed" target="_blank">
              View Public Feed
            </Link>
          </Button>
          <Button onClick={() => setIsComposerOpen(true)}>New Post</Button>
        </div>
      </div>

      {isComposerOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a Social Feed Post</CardTitle>
            <CardDescription>
              Share updates, shout-outs, and announcements directly with your
              members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PostCreator
              autoFocus
              onSuccess={() => setIsComposerOpen(false)}
              onCancel={() => setIsComposerOpen(false)}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Active Posts
            </CardTitle>
            <CardTitle>—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Comments Today
            </CardTitle>
            <CardTitle>—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Pending Reports
            </CardTitle>
            <CardTitle>—</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Latest Activity</CardTitle>
            <CardDescription>
              A real-time view of everything happening across the feed.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/social/feed">Manage Feed Items</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/social/groups">Manage Social Groups</Link>
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <FeedStream feedType="universal" limit={15} />
        </CardContent>
      </Card>
    </div>
  );
}
