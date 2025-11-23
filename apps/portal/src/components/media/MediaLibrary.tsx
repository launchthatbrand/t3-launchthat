"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import * as React from "react";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ImageIcon } from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

type MediaQueryResult = ReturnType<
  typeof useQuery<typeof api.media.queries.listMediaItemsWithUrl>
>;

export type MediaItem = Doc<"mediaItems"> & { url?: string | null };

export interface MediaLibraryProps {
  mode?: "select" | "browse";
  onSelect?: (media: MediaItem) => void;
  className?: string;
}

export function MediaLibrary({
  mode = "browse",
  onSelect,
  className,
}: MediaLibraryProps) {
  const response: MediaQueryResult = useQuery(
    api.media.queries.listMediaItemsWithUrl,
    {
      paginationOpts: { numItems: 60, cursor: null },
    },
  );
  const mediaItems: MediaItem[] = response?.page ?? [];
  const isLoading = response === undefined;
  const isSelectable = mode === "select" && typeof onSelect === "function";

  if (isLoading) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader>
          <CardTitle>Loading media…</CardTitle>
          <CardDescription>Fetching your latest uploads.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Please wait while we load your media items.
        </CardContent>
      </Card>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>No media yet</CardTitle>
          <CardDescription>
            Upload media in Attachments to pick it here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Once you upload files, they will appear in this picker
            automatically.
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/edit/attachments" target="_blank" rel="noreferrer">
              Open Attachments
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {mediaItems.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => isSelectable && onSelect?.(item)}
            className={cn(
              "group overflow-hidden rounded-md border text-left transition hover:border-primary",
              !isSelectable && "cursor-default",
            )}
            disabled={!isSelectable}
          >
            <div className="relative aspect-video bg-muted">
              {item.url ? (
                <Image
                  src={item.url}
                  alt={item.title ?? "Media item"}
                  fill
                  sizes="320px"
                  className="object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-medium">
                {item.title ?? "Untitled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(item._creationTime, { addSuffix: true })}
              </p>
              <Badge variant="outline" className="text-xs uppercase">
                {item.status ?? "draft"}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
