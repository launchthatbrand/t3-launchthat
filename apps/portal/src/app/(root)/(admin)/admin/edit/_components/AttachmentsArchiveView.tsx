"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Sparkles, Trash2, Upload } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
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
import { EntityList } from "@acme/ui/entity-list/EntityList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { useApplyFilters } from "~/lib/hooks";
import { ADMIN_ATTACHMENTS_ARCHIVE_TABS_FILTER } from "~/lib/plugins/hookSlots";

type PostTypeDoc = Doc<"postTypes">;
type MediaItemDoc = Doc<"mediaItems"> & { url?: string | null };
// NOTE: Vimeo tab rendering is provided by the Vimeo plugin via hooks.

interface AttachmentsArchiveTabContext extends Record<string, unknown> {
  postTypeSlug: string;
  organizationId?: Id<"organizations">;
}

interface AttachmentsArchiveTab {
  id: string;
  label: string;
  order?: number;
  condition?: (ctx: AttachmentsArchiveTabContext) => boolean;
  component: React.ComponentType<AttachmentsArchiveTabContext>;
}

export interface AttachmentsArchiveViewProps {
  slug: string;
  postType: PostTypeDoc | null;
  options: PostTypeDoc[];
  onPostTypeChange: (slug: string) => void;
  renderLayout?: boolean;
}

export function AttachmentsArchiveView({
  slug,
  postType,
  options,
  onPostTypeChange,
  renderLayout = true,
}: AttachmentsArchiveViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant) ?? undefined;

  const vimeoOption = useQuery(
    api.core.options.get,
    organizationId
      ? ({
          orgId: organizationId,
          type: "site",
          metaKey: "plugin_vimeo_enabled",
        } as const)
      : "skip",
  );
  const isVimeoEnabled = Boolean(vimeoOption?.metaValue);

  const label = postType?.name ?? "Attachments";
  const description =
    postType?.description ??
    "Upload and manage media files used throughout your site.";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(
    api.core.media.mutations.generateUploadUrl,
  );
  const saveMedia = useMutation(api.core.media.mutations.saveMedia);
  const deleteMedia = useMutation(api.core.media.mutations.deleteMedia);
  const [deleteTarget, setDeleteTarget] = useState<MediaItemDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMediaId, setPreviewMediaId] = useState<string | null>(null);
  const [previewImageFailed, setPreviewImageFailed] = useState(false);

  const searchParamsString = searchParams.toString();
  const activeTab = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const requested = params.get("tab") ?? "library";
    if (requested === "vimeo" && !isVimeoEnabled) {
      return "library";
    }
    return requested;
  }, [isVimeoEnabled, searchParamsString]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParamsString);
      if (value === "library") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      router.replace(`/admin/edit?${params.toString()}`);
    },
    [router, searchParamsString],
  );

  const mediaResponse = useQuery(api.core.media.queries.listMediaItemsWithUrl, {
    paginationOpts: { numItems: 60, cursor: null },
  });
  const mediaItems = useMemo<MediaItemDoc[]>(
    () => mediaResponse?.page ?? [],
    [mediaResponse?.page],
  );
  const isLoading = mediaResponse === undefined;

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploadError(null);
      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          const uploadUrl = await generateUploadUrl();
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload file.");
          }
          const { storageId } = (await uploadResponse.json()) as {
            storageId: string;
          };
          await saveMedia({
            storageId: storageId as Id<"_storage">,
            title: file.name,
            status: "published",
          });
        }
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [generateUploadUrl, saveMedia],
  );

  const headerDescription = useMemo(() => {
    if (typeof description === "string" && description.trim().length > 0) {
      return description;
    }
    return "Upload high-resolution assets for the best results. Attachments automatically land in your WordPress-style media library.";
  }, [description]);

  const previewIndex = useMemo(() => {
    if (!previewMediaId) return -1;
    return mediaItems.findIndex((item) => String(item._id) === previewMediaId);
  }, [mediaItems, previewMediaId]);

  const previewItem = previewIndex >= 0 ? mediaItems[previewIndex] : null;

  useEffect(() => {
    // Reset preview error state whenever the selected item changes.
    setPreviewImageFailed(false);
  }, [previewMediaId]);

  useEffect(() => {
    if (!previewOpen) return;
    if (!previewMediaId) return;
    const exists = mediaItems.some(
      (item) => String(item._id) === previewMediaId,
    );
    if (!exists) {
      setPreviewOpen(false);
      setPreviewMediaId(null);
    }
  }, [mediaItems, previewMediaId, previewOpen]);

  const openPreviewForItem = useCallback((item: MediaItemDoc) => {
    setPreviewMediaId(String(item._id));
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);

  const handlePreviewPrevious = useCallback(() => {
    if (mediaItems.length === 0) return;
    const current = previewIndex >= 0 ? previewIndex : 0;
    const nextIndex = (current - 1 + mediaItems.length) % mediaItems.length;
    setPreviewMediaId(String(mediaItems[nextIndex]?._id));
  }, [mediaItems, previewIndex]);

  const handlePreviewNext = useCallback(() => {
    if (mediaItems.length === 0) return;
    const current = previewIndex >= 0 ? previewIndex : 0;
    const nextIndex = (current + 1) % mediaItems.length;
    setPreviewMediaId(String(mediaItems[nextIndex]?._id));
  }, [mediaItems, previewIndex]);

  useEffect(() => {
    if (!previewOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePreviewPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handlePreviewNext();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview, handlePreviewNext, handlePreviewPrevious, previewOpen]);

  const columns = useMemo<ColumnDefinition<MediaItemDoc>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: (item: MediaItemDoc) => (
          <div className="font-medium">{item.title ?? "Untitled"}</div>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: (item: MediaItemDoc) => (
          <Badge
            variant={item.status === "published" ? "default" : "secondary"}
          >
            {item.status ?? "draft"}
          </Badge>
        ),
      },
      {
        id: "created",
        header: "Uploaded",
        cell: (item: MediaItemDoc) => (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(item._creationTime, {
              addSuffix: true,
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (item: MediaItemDoc) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteTarget(item);
              }}
              title="Delete attachment"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const libraryPanel = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={slug} onValueChange={onPostTypeChange}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select post type" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: PostTypeDoc) => (
              <SelectItem key={option._id} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-3">
          <Button
            className="gap-2"
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading…" : "Upload from computer"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFilesSelected}
          />
        </div>
      </div>

      {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
          <CardDescription>
            Preview recently uploaded files. Switch between grid and list views
            to find the right asset faster.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EntityList
            data={mediaItems}
            columns={columns}
            isLoading={isLoading}
            enableFooter={false}
            viewModes={["grid", "list"]}
            defaultViewMode="grid"
            enableSearch
            gridColumns={{ sm: 2, md: 3, lg: 4 }}
            onRowClick={openPreviewForItem}
            emptyState={
              <div className="text-muted-foreground flex h-48 flex-col items-center justify-center text-center">
                <Sparkles className="mb-2 h-6 w-6" />
                <p>No attachments yet. Upload your first media item.</p>
              </div>
            }
            className="p-4"
            itemRender={(item) => (
              <Card key={item._id}>
                <CardContent className="space-y-3 p-4">
                  <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                    {item.url ? (
                      <Image
                        src={item.url}
                        alt={item.title ?? "Attachment"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {item.title ?? "Untitled"}
                      </p>
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>{item.status ?? "draft"}</span>
                        <span>
                          {formatDistanceToNow(item._creationTime, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      title="Delete attachment"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          />
        </CardContent>
      </Card>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewMediaId(null);
          }
        }}
      >
        <DialogContent className="h-[96vh] w-[96vw] max-w-6xl! p-0">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="truncate">
                    {previewItem?.title ?? "Attachment"}
                  </DialogTitle>
                  <DialogDescription>
                    {previewItem ? (
                      <>
                        {previewItem.status ?? "draft"} ·{" "}
                        {formatDistanceToNow(previewItem._creationTime, {
                          addSuffix: true,
                        })}{" "}
                        {previewIndex >= 0
                          ? `· ${previewIndex + 1} / ${mediaItems.length}`
                          : null}
                      </>
                    ) : (
                      "Select an attachment to preview."
                    )}
                  </DialogDescription>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewPrevious}
                    disabled={mediaItems.length <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewNext}
                    disabled={mediaItems.length <= 1}
                  >
                    Next
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={closePreview}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="bg-muted/30 relative flex min-h-0 flex-1 items-center justify-center">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center px-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="pointer-events-auto h-10 w-10 rounded-full"
                  onClick={handlePreviewPrevious}
                  disabled={mediaItems.length <= 1}
                  aria-label="Previous attachment"
                >
                  ‹
                </Button>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center px-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="pointer-events-auto h-10 w-10 rounded-full"
                  onClick={handlePreviewNext}
                  disabled={mediaItems.length <= 1}
                  aria-label="Next attachment"
                >
                  ›
                </Button>
              </div>

              <div className="bg-background relative mx-4 flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border shadow-sm">
                {previewItem?.url && !previewImageFailed ? (
                  <div className="flex h-full w-full items-center justify-center p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewItem.url}
                      alt={previewItem.title ?? "Attachment preview"}
                      className="max-h-full max-w-full object-contain"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onError={() => setPreviewImageFailed(true)}
                    />
                  </div>
                ) : previewItem?.url ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
                    <p className="text-sm font-medium">Preview not available</p>
                    <p className="text-muted-foreground text-sm">
                      Open this file in a new tab to view it.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={previewItem.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open file
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
                    No URL available.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-background border-t px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Media Library</p>
                <Badge variant="outline" className="text-xs">
                  {mediaItems.length}
                </Badge>
              </div>
              <div className="mt-3 overflow-x-auto pb-2">
                <div className="flex gap-3">
                  {mediaItems.map((item) => {
                    const isActive = String(item._id) === previewMediaId;
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => openPreviewForItem(item)}
                        className={[
                          "group overflow-hidden rounded-xl border text-left transition",
                          isActive
                            ? "ring-primary ring-2"
                            : "hover:border-primary",
                        ].join(" ")}
                      >
                        <div className="bg-muted relative h-20 w-32">
                          {item.url ? (
                            <Image
                              src={item.url}
                              alt={item.title ?? "Attachment"}
                              fill
                              sizes="128px"
                              className="object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                              No preview
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => (open ? null : setDeleteTarget(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attachment and its underlying
              file from storage. This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deleteTarget || isDeleting}
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  setIsDeleting(true);
                  await deleteMedia({ id: deleteTarget._id });
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsDeleting(false);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const tabContext = useMemo<AttachmentsArchiveTabContext>(
    () => ({
      postTypeSlug: slug,
      organizationId,
    }),
    [organizationId, slug],
  );

  const pluginTabs = useApplyFilters<AttachmentsArchiveTab[]>(
    ADMIN_ATTACHMENTS_ARCHIVE_TABS_FILTER,
    [],
    tabContext,
  );

  const tabs = useMemo(() => {
    const base: { id: string; label: string; order: number }[] = [
      { id: "library", label: "Library", order: 0 },
    ];
    const extras = pluginTabs
      .filter((t) => {
        if (t.id === "vimeo" && !isVimeoEnabled) return false;
        return !t.condition || t.condition(tabContext);
      })
      .map((t) => ({
        id: t.id,
        label: t.label,
        order: t.order ?? 10,
      }));
    return [...base, ...extras].sort((a, b) => a.order - b.order);
  }, [isVimeoEnabled, pluginTabs, tabContext]);

  const activePluginTab = useMemo(() => {
    if (activeTab === "library") return null;
    return pluginTabs.find((t) => t.id === activeTab) ?? null;
  }, [activeTab, pluginTabs]);

  const pluginPanel =
    activePluginTab?.component ? (
      <activePluginTab.component {...tabContext} />
    ) : (
      <Card>
        <CardHeader>
          <CardTitle>Tab not available</CardTitle>
          <CardDescription>
            This tab is not registered or cannot be rendered.
          </CardDescription>
        </CardHeader>
      </Card>
    );

  const libraryBody = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="library" className="mt-6">
          {libraryPanel}
        </TabsContent>
        {tabs.some((t) => t.id === activeTab) && activeTab !== "library" ? (
          <TabsContent value={activeTab} className="mt-6">
            {pluginPanel}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );

  if (!renderLayout) {
    return libraryBody;
  }

  return (
    <AdminLayout
      title={`${label} Attachments`}
      description={headerDescription}
      pathname={`/admin/edit/attachments?post_type=${slug}`}
    >
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain>
          <AdminLayoutHeader />
          <div className="container space-y-6 py-6">{libraryBody}</div>
        </AdminLayoutMain>
        <AdminLayoutSidebar className="border-l p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Media tips</CardTitle>
              <CardDescription>{headerDescription}</CardDescription>
            </CardHeader>
          </Card>
        </AdminLayoutSidebar>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
