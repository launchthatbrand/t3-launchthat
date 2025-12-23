"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Sparkles } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";

import { getConfiguredVimeoHooks } from "../config";

type VimeoVideoRow = {
  _id: string;
  videoId: string;
  title: string;
  description?: string;
  embedUrl: string;
  thumbnailUrl?: string;
  publishedAt: number;
};

function VimeoVideosList({
  organizationId,
  listVideosQuery,
  usePaginatedQuery,
}: {
  organizationId: string;
  listVideosQuery: unknown;
  usePaginatedQuery: NonNullable<
    NonNullable<ReturnType<typeof getConfiguredVimeoHooks>>["usePaginatedQuery"]
  >;
}): React.ReactElement {
  const [search, setSearch] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 30;

  const vimeoVideos = usePaginatedQuery(
    listVideosQuery as any,
    {
      organizationId: organizationId as any,
      paginationOpts: { cursor: null, numItems: pageSize },
      search: search.trim().length > 0 ? search.trim() : undefined,
    },
    { initialNumItems: pageSize },
  );

  const rows: VimeoVideoRow[] = (vimeoVideos.results ?? []) as any;
  const isLoading = vimeoVideos.status === "LoadingFirstPage";
  const isLoadingMore = vimeoVideos.status === "LoadingMore";
  const canLoadMore = vimeoVideos.status === "CanLoadMore";

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (vimeoVideos.status !== "CanLoadMore") return;
        vimeoVideos.loadMore(pageSize);
      },
      {
        root: null,
        rootMargin: "600px 0px",
        threshold: 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageSize, vimeoVideos]);

  const columns = useMemo<ColumnDefinition<VimeoVideoRow>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        accessorKey: "title",
        cell: (item: VimeoVideoRow) => (
          <div className="flex items-center gap-3">
            <div className="bg-muted relative h-10 w-16 overflow-hidden rounded">
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-muted-foreground truncate text-xs">
                {item.videoId}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "publishedAt",
        header: "Published",
        cell: (item: VimeoVideoRow) => (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vimeo</CardTitle>
        <CardDescription>
          Browse synced Vimeo videos. Click a card to open the video in a new
          tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Vimeo videos…"
            className="w-full max-w-sm"
          />
          {isLoadingMore ? (
            <span className="text-muted-foreground text-sm">Loading more…</span>
          ) : null}
        </div>

        <EntityList
          data={rows}
          columns={columns}
          isLoading={isLoading}
          enableFooter={false}
          viewModes={["grid", "list"]}
          defaultViewMode="grid"
          enableSearch={false}
          gridColumns={{ sm: 1, md: 2, lg: 3 }}
          onRowClick={(item) => {
            window.open(item.embedUrl, "_blank", "noopener,noreferrer");
          }}
          emptyState={
            <div className="text-muted-foreground flex h-40 flex-col items-center justify-center text-center">
              <Sparkles className="mb-2 h-6 w-6" />
              <p>No Vimeo videos found.</p>
            </div>
          }
          className="p-0"
          itemRender={(item) => (
            <Card key={item._id}>
              <CardContent className="space-y-3 p-4">
                <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                      No thumbnail
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        />

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="h-10 w-full" />
        {canLoadMore && !isLoadingMore ? (
          <div className="text-muted-foreground text-center text-sm">
            Scroll to load more…
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function VimeoAttachmentsTab({
  organizationId,
}: {
  organizationId?: string;
}): React.ReactElement {
  const hooks = getConfiguredVimeoHooks();
  const listVideosQuery = hooks?.listVideosQuery;
  const usePaginatedQuery = hooks?.usePaginatedQuery;

  if (!hooks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vimeo</CardTitle>
          <CardDescription>
            Vimeo plugin has not been configured. Ensure the Portal registers
            Vimeo client hooks.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vimeo</CardTitle>
          <CardDescription>
            Switch to an organization to browse its Vimeo library.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!listVideosQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vimeo</CardTitle>
          <CardDescription>
            Vimeo list query is not wired. Please refresh the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!usePaginatedQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vimeo</CardTitle>
          <CardDescription>
            Vimeo plugin is missing Convex paginated query hooks. Ensure the
            Portal registers Vimeo client hooks.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <VimeoVideosList
      organizationId={organizationId}
      listVideosQuery={listVideosQuery}
      usePaginatedQuery={usePaginatedQuery}
    />
  );
}
