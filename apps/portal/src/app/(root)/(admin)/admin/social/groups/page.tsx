"use client";

import Link from "next/link";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

export default function SocialGroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Social Groups
          </h1>
          <p className="text-muted-foreground text-sm">
            Lightweight groups let you create private or themed streams inside
            the broader social feed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/edit?post_type=social-feed-group">
              Manage Groups
            </Link>
          </Button>
          <Button asChild>
            <Link
              href="/admin/edit?post_type=social-feed-group&action=create"
              prefetch={false}
            >
              New Group
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need a detailed list?</CardTitle>
          <CardDescription>
            The classic editor gives you full access to metadata, custom fields,
            and advanced filtering for each group post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link href="/admin/edit?post_type=social-feed-group">
              Open Classic Group Editor
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
