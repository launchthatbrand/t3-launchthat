"use client";

import type { GenericId } from "convex/values";
import type { Id, PluginMediaPickerContext } from "launchthat-plugin-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { Label } from "@acme/ui/label";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
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
  videoId: string;
  title: string;
  status: "synced";
  publishedAtLabel: string;
  thumbnail: string;
  embedUrl: string;
  description?: string;
}

type AssignmentType = "lesson" | "topic";

interface CourseSummary {
  _id: Id<"posts">;
  title: string;
  slug?: string;
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
const VIMEO_PLAYER_BASE_URL = "https://player.vimeo.com/video/";

const asConvexId = <TableName extends string>(
  value: Id<TableName>,
): GenericId<TableName> => value as unknown as GenericId<TableName>;

const asOptionalConvexId = <TableName extends string>(
  value: Id<TableName> | undefined,
): GenericId<TableName> | undefined =>
  value ? (value as unknown as GenericId<TableName>) : undefined;

const formatPublishedAt = (timestamp: number) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const pickNumericSegment = (value: string | undefined) => {
  if (!value) {
    return null;
  }
  const segments = value.split(/[/?#]/).filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (/^\d+$/.test(segments[i] ?? "")) {
      return segments[i] ?? null;
    }
  }
  return null;
};

const deriveVideoId = (video: VimeoApiVideo) => {
  const candidates = [video.id, video.uri, video.link].filter(
    (candidate): candidate is string => Boolean(candidate),
  );
  for (const candidate of candidates) {
    const numeric = pickNumericSegment(candidate);
    if (numeric) {
      return numeric;
    }
  }
  return candidates[0] ?? crypto.randomUUID();
};

const normalizeVimeoEmbedUrl = (videoId: string, rawUrl?: string) => {
  const fallbackUrl = `${VIMEO_PLAYER_BASE_URL}${encodeURIComponent(videoId)}`;
  if (!rawUrl) {
    return fallbackUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "player.vimeo.com") {
      if (!parsed.pathname.includes(videoId)) {
        parsed.pathname = `/video/${encodeURIComponent(videoId)}`;
      }
      return parsed.toString();
    }

    if (!hostname.endsWith("vimeo.com")) {
      return fallbackUrl;
    }

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const idIndex = pathSegments.findIndex((segment) => /^\d+$/.test(segment));
    const hashFromPath =
      idIndex >= 0 && idIndex + 1 < pathSegments.length
        ? pathSegments[idIndex + 1]
        : undefined;

    const normalized = new URL(
      `${VIMEO_PLAYER_BASE_URL}${encodeURIComponent(videoId)}`,
    );
    const hashParam = parsed.searchParams.get("h") ?? hashFromPath;

    if (hashParam) {
      normalized.searchParams.set("h", hashParam);
    }

    parsed.searchParams.forEach((value, key) => {
      if (key === "h") {
        return;
      }
      normalized.searchParams.set(key, value);
    });

    return normalized.toString();
  } catch {
    return fallbackUrl;
  }
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
  const useMutationHook =
    hooks?.useMutation ?? configuredHooks?.useMutation ?? useMutation;

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

    const mappedVideos: VimeoVideoRow[] = [];
    for (const video of rawVideos) {
      if (!video || typeof video !== "object") {
        continue;
      }
      const v = video as VimeoApiVideo;
      if (!v.name) {
        continue;
      }
      const publishedAt = v.created_time
        ? Date.parse(v.created_time)
        : Date.now();
      const thumbnail =
        v.pictures?.sizes?.[0]?.link ?? v.pictures?.sizes?.at?.(-1)?.link;
      const videoId = deriveVideoId(v);
      const embedUrl = normalizeVimeoEmbedUrl(videoId, v.link);
      mappedVideos.push({
        id: videoId,
        videoId,
        title: v.name,
        status: "synced",
        publishedAtLabel: formatPublishedAt(
          Number.isNaN(publishedAt) ? Date.now() : publishedAt,
        ),
        thumbnail: thumbnail ?? FALLBACK_THUMBNAIL,
        embedUrl,
        description: v.description ?? undefined,
      });
    }
    return mappedVideos;
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
  const [assignmentType, setAssignmentType] =
    useState<AssignmentType>("lesson");
  const [selectedCourseId, setSelectedCourseId] = useState<Id<"posts"> | "">(
    "",
  );
  const [selectedLessonId, setSelectedLessonId] = useState<Id<"posts"> | "">(
    "",
  );
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [desiredStatus, setDesiredStatus] = useState<"draft" | "published">(
    "published",
  );

  const handleSelectVideo = useCallback(
    (video: VimeoVideoRow) => {
      pickerContext?.onSelectMedia?.({
        kind: "embed",
        embed: {
          url: video.embedUrl,
          providerName: "Vimeo",
          title: video.title,
          thumbnailUrl: video.thumbnail,
          videoId: video.videoId ?? video.id,
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

  const coursesResult = useQueryHook(
    api.plugins.lms.queries.listCourses,
    organizationId
      ? {
          organizationId: asConvexId(organizationId),
        }
      : "skip",
  ) as CourseSummary[] | undefined;

  const courses = coursesResult ?? [];
  const isCoursesLoading =
    Boolean(organizationId) && coursesResult === undefined;

  const selectedCourseLessonsResult = useQueryHook(
    api.plugins.lms.queries.getCourseStructureWithItems,
    selectedCourseId
      ? {
          courseId: asConvexId(selectedCourseId),
          organizationId: asOptionalConvexId(organizationId),
        }
      : "skip",
  ) as
    | {
        attachedLessons: Array<{
          _id: Id<"posts">;
          title: string;
        }>;
      }
    | null
    | undefined;

  const lessonOptions = selectedCourseLessonsResult?.attachedLessons ?? [];
  const lessonsLoading =
    Boolean(selectedCourseId) && selectedCourseLessonsResult === undefined;

  const createLessonFromVimeoMutation = useMutationHook(
    api.plugins.lms.mutations.createLessonFromVimeo,
  );
  const createTopicFromVimeoMutation = useMutationHook(
    api.plugins.lms.mutations.createTopicFromVimeo,
  );

  useEffect(() => {
    if (!isCourseDialogOpen) {
      setSelectedCourseId("");
      setSelectedLessonId("");
      setAssignmentType("lesson");
      setIsSubmittingAssignment(false);
      setDesiredStatus("published");
    }
  }, [isCourseDialogOpen]);

  useEffect(() => {
    if (!isCourseDialogOpen || selectedCourseId || isCoursesLoading) {
      return;
    }
    const firstCourseId = courses[0]?._id;
    if (firstCourseId) {
      setSelectedCourseId(firstCourseId);
    }
  }, [courses, isCourseDialogOpen, isCoursesLoading, selectedCourseId]);

  useEffect(() => {
    if (!isCourseDialogOpen) {
      return;
    }
    if (assignmentType !== "topic") {
      setSelectedLessonId("");
      return;
    }
    if (selectedLessonId || lessonsLoading) {
      return;
    }
    const firstLessonId = lessonOptions[0]?._id;
    if (firstLessonId) {
      setSelectedLessonId(firstLessonId);
    }
  }, [
    assignmentType,
    isCourseDialogOpen,
    lessonOptions,
    lessonsLoading,
    selectedLessonId,
  ]);

  const handleAddVideoToCourse = useCallback(async () => {
    if (
      !courseDialogVideo ||
      !organizationId ||
      !selectedCourseId ||
      (assignmentType === "topic" && !selectedLessonId)
    ) {
      return;
    }
    setIsSubmittingAssignment(true);
    const status = desiredStatus;
    const videoPayload = {
      videoId: courseDialogVideo.videoId ?? courseDialogVideo.id,
      title: courseDialogVideo.title,
      description: courseDialogVideo.description,
      embedUrl: courseDialogVideo.embedUrl,
      thumbnailUrl: courseDialogVideo.thumbnail,
    };

    try {
      if (assignmentType === "lesson") {
        await createLessonFromVimeoMutation({
          courseId: asConvexId(selectedCourseId),
          organizationId: asConvexId(organizationId),
          video: videoPayload,
          status,
        });
        toast.success("Video added to course as a lesson.");
      } else if (selectedLessonId) {
        await createTopicFromVimeoMutation({
          lessonId: asConvexId(selectedLessonId),
          organizationId: asConvexId(organizationId),
          video: videoPayload,
          status,
        });
        toast.success("Video added to selected lesson as a topic.");
      }
      closeCourseDialog();
    } catch (error) {
      toast.error("Unable to add video to course.", {
        description:
          error instanceof Error ? error.message : "Unexpected error occurred.",
      });
    } finally {
      setIsSubmittingAssignment(false);
    }
  }, [
    assignmentType,
    closeCourseDialog,
    courseDialogVideo,
    createLessonFromVimeoMutation,
    createTopicFromVimeoMutation,
    organizationId,
    selectedCourseId,
    selectedLessonId,
  ]);

  const canSubmitAssignment =
    Boolean(courseDialogVideo) &&
    Boolean(organizationId) &&
    Boolean(selectedCourseId) &&
    (assignmentType === "lesson" || Boolean(selectedLessonId)) &&
    !isSubmittingAssignment &&
    !isCoursesLoading &&
    !(assignmentType === "topic" && lessonsLoading);

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
        <DialogContent className="max-w-xl space-y-4">
          <DialogHeader>
            <DialogTitle>
              Add “{courseDialogVideo?.title ?? "selected video"}” to a course
            </DialogTitle>
            <DialogDescription>
              Choose the target course and how this Vimeo video should be
              inserted.
            </DialogDescription>
          </DialogHeader>
          {!organizationId ? (
            <Alert>
              <AlertTitle>Select an organization</AlertTitle>
              <AlertDescription>
                Switch to an organization to assign this video to a course.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Course</Label>
                {isCoursesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : courses.length ? (
                  <Select
                    value={selectedCourseId}
                    onValueChange={(value) => setSelectedCourseId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <AlertTitle>No courses available</AlertTitle>
                    <AlertDescription>
                      Create a course first, then return to attach this video.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Placement</Label>
                <RadioGroup
                  value={assignmentType}
                  onValueChange={(value) =>
                    setAssignmentType(value as AssignmentType)
                  }
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <div className="rounded-md border p-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="lesson" id="assignment-lesson" />
                      <div className="space-y-1">
                        <Label htmlFor="assignment-lesson">New lesson</Label>
                        <p className="text-muted-foreground text-xs">
                          Create a lesson that embeds this Vimeo video in its
                          content automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="topic" id="assignment-topic" />
                      <div className="space-y-1">
                        <Label htmlFor="assignment-topic">New topic</Label>
                        <p className="text-muted-foreground text-xs">
                          Choose an existing lesson and add a topic underneath
                          it with this video.
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {assignmentType === "topic" ? (
                <div className="space-y-2">
                  <Label>Lesson destination</Label>
                  {!selectedCourseId ? (
                    <p className="text-muted-foreground text-xs">
                      Select a course first.
                    </p>
                  ) : lessonsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : lessonOptions.length ? (
                    <Select
                      value={selectedLessonId}
                      onValueChange={(value) => setSelectedLessonId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a lesson" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessonOptions.map((lesson) => (
                          <SelectItem key={lesson._id} value={lesson._id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertTitle>No lessons found</AlertTitle>
                      <AlertDescription>
                        This course has no lessons yet. Add one first or switch
                        placement to “New lesson”.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}

              <div className="bg-muted/40 space-y-2 rounded-md p-3 text-sm">
                <p className="font-medium">Video details</p>
                <p className="text-muted-foreground">
                  {courseDialogVideo?.description
                    ? courseDialogVideo.description
                    : "No description provided from Vimeo."}
                </p>
                <p className="text-muted-foreground text-xs">
                  URL:{" "}
                  <span className="font-mono break-all">
                    {courseDialogVideo?.embedUrl ?? "n/a"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <p className="font-medium">Publish immediately</p>
                    <p className="text-muted-foreground text-xs">
                      Toggle to save the new{" "}
                      {assignmentType === "lesson" ? "lesson" : "topic"} as{" "}
                      <span className="font-medium">{desiredStatus}</span>.
                    </p>
                  </div>
                  <Switch
                    checked={desiredStatus === "published"}
                    onCheckedChange={(checked) =>
                      setDesiredStatus(checked ? "published" : "draft")
                    }
                    aria-label="Toggle publish status"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeCourseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAddVideoToCourse}
              disabled={!canSubmitAssignment}
            >
              {isSubmittingAssignment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                `Add as ${assignmentType === "lesson" ? "lesson" : "topic"}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
