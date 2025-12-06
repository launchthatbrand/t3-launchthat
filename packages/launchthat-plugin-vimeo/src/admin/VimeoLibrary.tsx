"use client";

import type { Id, PluginMediaPickerContext } from "launchthat-plugin-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useAction, useQuery } from "convex/react";
import { Loader2, MoreHorizontal } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { toast } from "@acme/ui/toast";

import type { VimeoHookBag } from "../types";
import { getConfiguredVimeoHooks } from "../config";

interface VimeoLibraryProps {
  organizationId?: Id<"organizations">;
  hooks?: VimeoHookBag;
  pickerContext?: PluginMediaPickerContext;
}

interface VimeoVideoRow extends Record<string, unknown> {
  id: string;
  title: string;
  status: "synced";
  publishedAtLabel: string;
  thumbnail: string;
  embedUrl: string;
}

interface VimeoApiVideo {
  uri?: string;
  id?: string;
  name?: string;
  description?: string;
  link?: string;
  created_time?: string;
  pictures?: {
    sizes?: Array<{ link?: string }>;
  };
}

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?q=80";

const formatPublishedAt = (timestamp: number) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

export function VimeoLibrary({
  organizationId,
  hooks,
  pickerContext,
}: VimeoLibraryProps) {
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveRows, setLiveRows] = useState<VimeoVideoRow[]>([]);

  const configuredHooks = getConfiguredVimeoHooks();
  const useQueryHook = hooks?.useQuery ?? configuredHooks?.useQuery ?? useQuery;
  const useActionHook =
    hooks?.useAction ?? configuredHooks?.useAction ?? useAction;

  const connectionArgs = organizationId
    ? { nodeType: "vimeo", ownerId: organizationId }
    : "skip";

  const connectionsResult = useQueryHook(
    api.integrations.connections.queries.list,
    connectionArgs,
  );
  const connections = Array.isArray(connectionsResult) ? connectionsResult : [];
  const isLoadingConnections =
    connectionArgs !== "skip" && connectionsResult === undefined;
  const connection = connections[0] ?? null;

  const fetchLiveVideos = useActionHook(api.vimeo.actions.getCachedVimeoVideos);

  const mapApiVideos = useCallback((payload: unknown): VimeoVideoRow[] => {
    const rawVideos = (() => {
      if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { data?: unknown[] }).data)
      ) {
        return (payload as { data: unknown[] }).data;
      }
      if (Array.isArray(payload)) {
        return payload;
      }
      return [];
    })();

    return rawVideos
      .map((video) => {
        if (!video || typeof video !== "object") {
          return null;
        }
        const v = video as VimeoApiVideo;
        const publishedAt = v.created_time
          ? Date.parse(v.created_time)
          : Date.now();
        const thumbnail =
          v.pictures?.sizes?.[0]?.link ?? v.pictures?.sizes?.at?.(-1)?.link;
        const idCandidate = v.uri ?? v.id ?? v.link;
        if (!idCandidate || !v.name || !v.link) {
          return null;
        }
        return {
          id: idCandidate,
          title: v.name,
          status: "synced",
          publishedAtLabel: formatPublishedAt(
            Number.isNaN(publishedAt) ? Date.now() : publishedAt,
          ),
          thumbnail: thumbnail ?? FALLBACK_THUMBNAIL,
          embedUrl: v.link,
        } satisfies VimeoVideoRow;
      })
      .filter((row): row is VimeoVideoRow => Boolean(row));
  }, []);

  const loadLiveVideos = useCallback(async () => {
    if (!organizationId) {
      setLiveRows([]);
      return;
    }
    setIsFetchingLive(true);
    try {
      const payload = await fetchLiveVideos({ ownerId: organizationId });
      setLiveRows(mapApiVideos(payload));
    } catch (error) {
      toast.error("Unable to fetch Vimeo videos", {
        description:
          error instanceof Error ? error.message : "Unexpected error occurred.",
      });
    } finally {
      setIsFetchingLive(false);
    }
  }, [fetchLiveVideos, mapApiVideos, organizationId]);

  useEffect(() => {
    if (!connection || !organizationId) {
      setLiveRows([]);
      return;
    }
    void loadLiveVideos();
  }, [connection, loadLiveVideos, organizationId]);

  const handleRefresh = useCallback(async () => {
    if (!connection) {
      toast.error("Connect Vimeo before fetching videos.");
      return;
    }
    await loadLiveVideos();
  }, [connection, loadLiveVideos]);

  const rows = useMemo(() => liveRows, [liveRows]);
  const isLoadingVideos = isFetchingLive;
  const isPickerMode = Boolean(pickerContext?.onSelectMedia);
  const [courseDialogVideo, setCourseDialogVideo] =
    useState<VimeoVideoRow | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);

  const handleSelectVideo = useCallback(
    (video: VimeoVideoRow) => {
      pickerContext?.onSelectMedia?.({
        kind: "embed",
        embed: {
          url: video.embedUrl,
        },
      });
    },
    [pickerContext],
  );

  const handleOpenCourseDialog = useCallback((video: VimeoVideoRow) => {
    setCourseDialogVideo(video);
    setIsCourseDialogOpen(true);
  }, []);

  const closeCourseDialog = useCallback(() => {
    setIsCourseDialogOpen(false);
    setCourseDialogVideo(null);
  }, []);

  const listColumns = useMemo<ColumnDefinition<VimeoVideoRow>[]>(() => {
    return [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: (item: VimeoVideoRow) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.title}</span>
            <span className="text-muted-foreground text-xs">
              Published {item.publishedAtLabel}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: (item: VimeoVideoRow) => (
          <Badge variant="default">{item.status}</Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (item: VimeoVideoRow) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenCourseDialog(item)}>
                Add To Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }, [handleOpenCourseDialog]);

  if (!organizationId) {
    return (
      <Alert>
        <AlertTitle>Select an organization</AlertTitle>
        <AlertDescription>
          Switch to a tenant from the team switcher to browse its Vimeo library.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Vimeo Library</h2>
          <p className="text-muted-foreground text-sm">
            View synced videos from your organization&apos;s connected Vimeo
            workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/media/settings?tab=vimeo">
              Manage connection
            </Link>
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={!connection || isFetchingLive}
            aria-disabled={!connection}
          >
            {isFetchingLive ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing…
              </>
            ) : (
              "Refresh from Vimeo"
            )}
          </Button>
        </div>
      </div>

      {isLoadingConnections ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </CardContent>
        </Card>
      ) : null}

      {!isLoadingConnections && !connection ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect Vimeo</CardTitle>
            <CardDescription>
              Link a Vimeo account from the Media settings page to import assets
              into the library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/media/settings?tab=vimeo">
                Go to Media settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {connection ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent uploads</CardTitle>
                <CardDescription>
                  {rows.length
                    ? "These videos were loaded directly from your Vimeo workspace."
                    : "No videos were returned from Vimeo. Try refreshing to pull the latest uploads."}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {connection.status ?? "connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 && !isLoadingVideos ? (
              <div className="text-muted-foreground p-6 text-sm">
                No videos returned from Vimeo. Upload new content or click
                &quot;Refresh from Vimeo&quot; to check again.
              </div>
            ) : (
              <EntityList<VimeoVideoRow>
                data={rows}
                columns={listColumns}
                enableSearch
                isLoading={isLoadingVideos}
                enableFooter={false}
                viewModes={["grid", "list"]}
                defaultViewMode="grid"
                gridColumns={{ sm: 3, md: 5 }}
                className="p-4"
                itemRender={(item: VimeoVideoRow) => (
                  <Card key={item.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{item.title}</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="default">{item.status}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Open actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenCourseDialog(item)}
                                >
                                  Add To Course
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Published {item.publishedAtLabel}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={item.embedUrl} target="_blank">
                              View on Vimeo
                            </Link>
                          </Button>
                          {isPickerMode ? (
                            <Button
                              size="sm"
                              onClick={() => handleSelectVideo(item)}
                            >
                              Insert
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={isCourseDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCourseDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add “{courseDialogVideo?.title ?? "selected video"}” to a course
            </DialogTitle>
            <DialogDescription>
              Select a target course and placement. (Mock dialog content.)
            </DialogDescription>
          </DialogHeader>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              This is placeholder content for the future course-assignment UI.
            </p>
            <p>
              Video URL:{" "}
              <span className="font-mono text-xs break-all">
                {courseDialogVideo?.embedUrl ?? "n/a"}
              </span>
            </p>
            <Button onClick={closeCourseDialog}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
