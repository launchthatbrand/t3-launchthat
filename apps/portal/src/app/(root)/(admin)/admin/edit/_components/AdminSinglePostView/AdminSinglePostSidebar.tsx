"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import type { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { PenSquare } from "lucide-react";
import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";

interface AdminSinglePostSidebarProps {
  supportsPostsTable: boolean;
  puckEditorHref: string | null;
  isNewRecord: boolean;
  saveButton: ReactNode;
  headerLabel: string;
  post?: Doc<"posts"> | null;
}

export function AdminSinglePostSidebar({
  supportsPostsTable,
  puckEditorHref,
  isNewRecord,
  saveButton,
  headerLabel,
  post,
}: AdminSinglePostSidebarProps) {
  return (
    <div className="space-y-4 border-l flex flex-col flex-1 h-full p-4">
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Save or publish this entry.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {saveButton}
          <Link
            href={puckEditorHref ?? "#"}
            target={puckEditorHref && !isNewRecord ? "_blank" : undefined}
            rel={puckEditorHref && !isNewRecord ? "noreferrer" : undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
              puckEditorHref && !isNewRecord
                ? "text-primary hover:bg-primary/10"
                : "cursor-not-allowed text-muted-foreground"
            }`}
            aria-disabled={!puckEditorHref || isNewRecord}
          >
            <PenSquare className="h-4 w-4" />
            Edit with Puck
          </Link>
          {!supportsPostsTable ? (
            <p className="text-xs text-muted-foreground">
              Saving is not available for this post type.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Saved content is available across all tabs.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>
            High-level attributes for this entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Post Type</p>
            <p>{headerLabel}</p>
          </div>
          {!isNewRecord && post ? (
            <>
              <div>
                <p className="font-medium text-foreground">Status</p>
                <p className="capitalize">{post.status ?? "draft"}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Updated</p>
                <p>
                  {post.updatedAt
                    ? formatDistanceToNow(post.updatedAt, { addSuffix: true })
                    : "Not updated"}
                </p>
              </div>
            </>
          ) : (
            <p>This entry has not been saved yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

