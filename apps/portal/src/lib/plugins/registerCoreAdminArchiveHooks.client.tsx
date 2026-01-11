/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Pencil,
  Plus,
  Upload,
  Video,
} from "lucide-react";

import type { HookCallback } from "@acme/admin-runtime/hooks";
import type { ColumnDefinition } from "@acme/ui/entity-list";
import { addFilter } from "@acme/admin-runtime/hooks";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import { renderPdfFirstPageToPngBlob } from "~/lib/media/pdfPreview.client";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import {
  ADMIN_ARCHIVE_COLUMNS_FILTER,
  ADMIN_ARCHIVE_CONTENT_BEFORE,
  ADMIN_ARCHIVE_DEFAULT_VIEWMODE_FILTER,
  ADMIN_ARCHIVE_ITEM_RENDER_FILTER,
  ADMIN_ARCHIVE_PRIMARY_ACTION_FILTER,
  ADMIN_ARCHIVE_ROW_CLICK_FILTER,
} from "./hookSlots";

interface ArchiveDisplayRow extends Record<string, unknown> {
  id: string;
  title: string;
  statusLabel: string;
  statusVariant: "default" | "secondary";
  updatedAt: number;
  previewUrl?: string;
  fileUrl?: string;
  isPlaceholder?: boolean;
}

interface ArchiveHookContext {
  postTypeSlug?: string;
  organizationId?: Id<"organizations">;
  rows?: ArchiveDisplayRow[];
}

let openAttachmentsViewer: ((id: string) => void) | null = null;
let focusAttachmentsUpload: (() => void) | null = null;

const isAttachmentsContext = (ctx: ArchiveHookContext) =>
  ctx.postTypeSlug === "attachments";

const inferMediaKind = (title: string | undefined) => {
  const filename = (title ?? "").toLowerCase();
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(filename);
  const isVideo = /\.(mp4|webm|mov|m4v|ogg)$/i.test(filename);
  const isPdf = /\.pdf$/i.test(filename);
  const extRe = /\.([a-z0-9]+)$/i;
  const extMatch = extRe.exec(filename);
  const ext = extMatch?.[1]?.toLowerCase() ?? null;
  return { isImage, isVideo, isPdf, ext };
};

const AttachmentsUploadBox = ({
  organizationId,
}: {
  organizationId?: Id<"organizations">;
}) => {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Convex function reference types can get extremely deep in larger apps.
  // Casting here keeps TS snappy and avoids "Type instantiation is excessively deep" errors.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = api as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useMutationAny = useMutation as any;

  const generateUploadUrl = useMutationAny(
    apiAny.core.media.mutations.generateUploadUrl,
  );
  const saveMedia = useMutationAny(apiAny.core.media.mutations.saveMedia);

  const canUpload = Boolean(organizationId);

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (!canUpload || !organizationId) {
        toast.error("Missing organization context for uploads.");
        return;
      }
      if (files.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of files) {
          const uploadUrl = await generateUploadUrl({});
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}.`);
          }
          const { storageId } = (await uploadResponse.json()) as {
            storageId: string;
          };
          await saveMedia({
            organizationId,
            storageId: storageId as unknown as Id<"_storage">,
            title: file.name,
            mimeType: file.type || undefined,
            status: "published",
          });
        }
        toast.success("Upload complete.");
      } catch (error) {
        toast.error("Upload failed.", {
          description:
            error instanceof Error ? error.message : "Unexpected error.",
        });
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [canUpload, generateUploadUrl, organizationId, saveMedia],
  );

  const handleFilesSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files;
      if (!list || list.length === 0) return;
      void handleUploadFiles(Array.from(list));
    },
    [handleUploadFiles],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const list = event.dataTransfer.files;
      if (list.length === 0) return;
      void handleUploadFiles(Array.from(list));
    },
    [handleUploadFiles],
  );

  const handleBrowseClick = useCallback(() => {
    if (!canUpload) {
      toast.error("Missing organization context for uploads.");
      return;
    }
    inputRef.current?.click();
  }, [canUpload]);

  useEffect(() => {
    focusAttachmentsUpload = () => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      handleBrowseClick();
    };
    return () => {
      focusAttachmentsUpload = null;
    };
  }, [handleBrowseClick]);

  useEffect(() => {
    if (searchParams.get("upload") !== "1") return;
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [searchParams]);

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">Upload files</div>
          <div className="text-muted-foreground text-xs">
            Drag & drop files here, or click Upload.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleBrowseClick}
            disabled={!canUpload || isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={[
          "flex min-h-28 items-center justify-center rounded-md border border-dashed p-4 text-center",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30",
          !canUpload ? "opacity-60" : "",
        ].join(" ")}
      >
        <div className="text-muted-foreground space-y-1 text-sm">
          <div>Drop files to upload</div>
          {!canUpload ? (
            <div className="text-xs">Organization context missing.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const AttachmentsViewerHost = ({ items }: { items: ArchiveDisplayRow[] }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Convex function reference types can get extremely deep in larger apps.
  // Casting here keeps TS snappy and avoids "Type instantiation is excessively deep" errors.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = api as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useMutationAny = useMutation as any;

  const activeIndex = useMemo(() => {
    if (!activeId) return -1;
    return items.findIndex((i) => i.id === activeId);
  }, [activeId, items]);

  const active = activeIndex >= 0 ? items[activeIndex] : null;

  const handleOpenById = useCallback((id: string) => {
    setActiveId(id);
    setOpen(true);
  }, []);

  useEffect(() => {
    openAttachmentsViewer = handleOpenById;
    return () => {
      openAttachmentsViewer = null;
    };
  }, [handleOpenById]);

  const handlePrev = useCallback(() => {
    if (items.length === 0) return;
    if (activeIndex < 0) return;
    const nextIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
    setActiveId(items[nextIndex]?.id ?? null);
  }, [activeIndex, items]);

  const handleNext = useCallback(() => {
    if (items.length === 0) return;
    if (activeIndex < 0) return;
    const nextIndex = activeIndex >= items.length - 1 ? 0 : activeIndex + 1;
    setActiveId(items[nextIndex]?.id ?? null);
  }, [activeIndex, items]);

  const handleEdit = useCallback(() => {
    if (!active) return;
    router.push(`/admin/edit?post_type=attachments&post_id=${active.id}`);
    setOpen(false);
  }, [active, router]);

  const previewUrl = active?.previewUrl; // thumbnail/preview (may be generated poster for videos)
  const fileUrl = active?.fileUrl ?? active?.previewUrl; // actual file URL when available
  const posterUrl =
    previewUrl && previewUrl !== (fileUrl ?? null) ? previewUrl : undefined;
  const { isImage, isVideo, isPdf } = inferMediaKind(active?.title);

  const requestGenerateVideoPreviewImage = useMutationAny(
    apiAny.core.media.mutations.requestGenerateVideoPreviewImage,
  );
  const setMediaPreviewImage = useMutationAny(
    apiAny.core.media.mutations.setMediaPreviewImage,
  );
  const generateUploadUrl = useMutationAny(
    apiAny.core.media.mutations.generateUploadUrl,
  );

  const handleGenerateThumbnail = useCallback(async () => {
    if (!active) return;
    try {
      const isPdfActive = inferMediaKind(active?.title).isPdf;
      toast.success(isPdfActive ? "Generating PDF preview…" : "Generating thumbnail…");

      if (isPdfActive) {
        const pdfUrl = fileUrl;
        if (!pdfUrl) {
          throw new Error("Missing PDF URL.");
        }
        const res = await fetch(pdfUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF (status=${res.status}).`);
        }
        const pngBlob = await renderPdfFirstPageToPngBlob(await res.arrayBuffer());
        const uploadUrl = await generateUploadUrl({});
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: pngBlob,
        });
        if (!uploadRes.ok) {
          throw new Error(`Failed to upload preview (status=${uploadRes.status}).`);
        }
        const uploadedJson = (await uploadRes.json()) as { storageId?: Id<"_storage"> };
        if (!uploadedJson.storageId) {
          throw new Error("Upload response missing storageId.");
        }
        await setMediaPreviewImage({
          mediaItemId: active.id as unknown as Id<"mediaItems">,
          previewImageStorageId: uploadedJson.storageId,
        });
        return;
      }

      await requestGenerateVideoPreviewImage({
        mediaItemId: active.id as unknown as Id<"mediaItems">,
        force: true,
      });
    } catch (error) {
      toast.error("Failed to start preview generation.", {
        description:
          error instanceof Error ? error.message : "Unexpected error.",
      });
    }
  }, [
    active,
    fileUrl,
    generateUploadUrl,
    requestGenerateVideoPreviewImage,
    setMediaPreviewImage,
  ]);

  const handleCopyLink = useCallback(async () => {
    if (!fileUrl) return;
    try {
      await navigator.clipboard.writeText(fileUrl);
      toast.success("Copied link.");
    } catch (error) {
      toast.error("Failed to copy.", {
        description:
          error instanceof Error ? error.message : "Clipboard not available.",
      });
    }
  }, [fileUrl]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            {active?.title ?? "Attachment"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div className="bg-muted relative flex min-h-60 items-center justify-center overflow-hidden rounded-md">
            {isImage && fileUrl ? (
              <Image
                src={fileUrl}
                alt={active?.title ?? "Attachment"}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-contain"
              />
            ) : isPdf && (posterUrl || fileUrl) ? (
              posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={active?.title ?? "PDF preview"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-contain"
                />
              ) : (
              <iframe
                title={active?.title ?? "PDF preview"}
                src={`${fileUrl}#page=1&view=FitH`}
                className="h-[520px] w-full"
              />
              )
            ) : isVideo && fileUrl ? (
              <video
                src={fileUrl}
                poster={posterUrl}
                className="max-h-[520px] w-full object-contain"
                controls
                playsInline
              />
            ) : fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Open file
              </a>
            ) : (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                No preview available
              </div>
            )}

            <div className="absolute top-1/2 left-2 -translate-y-1/2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">
                {activeIndex >= 0
                  ? `${activeIndex + 1} / ${items.length}`
                  : null}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleEdit}
                className="w-full gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <Separator />

            {isVideo || isPdf ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleGenerateThumbnail()}
                disabled={!active || !fileUrl}
                className="w-full gap-2"
              >
                {isVideo ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Generate preview
              </Button>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-medium">File URL</div>
              <div className="flex items-center gap-2">
                <Input value={fileUrl ?? ""} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void handleCopyLink()}
                  disabled={!fileUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground inline-block text-xs underline"
                >
                  Open in new tab
                </a>
              ) : null}
            </div>
          </aside>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

const AttachmentsGridCard = ({ item }: { item: ArchiveDisplayRow }) => {
  const url = item.fileUrl ?? item.previewUrl;
  const thumbUrl =
    item.previewUrl && item.previewUrl !== (item.fileUrl ?? null)
      ? item.previewUrl
      : undefined;
  const { isImage, isVideo, isPdf, ext } = inferMediaKind(item.title);

  return (
    <button
      type="button"
      className="block text-left"
      onClick={(event) => {
        event.stopPropagation();
        openAttachmentsViewer?.(item.id);
      }}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="bg-muted relative aspect-video">
          {isImage && url ? (
            <Image
              src={url}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover"
            />
          ) : isPdf && (thumbUrl || url) ? (
            <div className="relative h-full w-full">
              {thumbUrl ? (
                <Image
                  src={thumbUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : url ? (
                <iframe
                  title={item.title}
                  src={`${url}#page=1&view=FitH`}
                  className="h-full w-full"
                />
              ) : null}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">PDF</Badge>
              </div>
            </div>
          ) : isVideo && (thumbUrl || url) ? (
            <div className="relative h-full w-full">
              {thumbUrl ? (
                <Image
                  src={thumbUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : url ? (
                <video
                  src={url}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : null}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Video className="h-3.5 w-3.5" />
                  Video
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FileText className="text-muted-foreground h-6 w-6" />
                {ext ? (
                  <Badge variant="secondary">{ext.toUpperCase()}</Badge>
                ) : null}
              </div>
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{item.title}</div>
              <div className="text-muted-foreground text-xs">
                {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
              </div>
            </div>
            <Badge variant={item.statusVariant}>{item.statusLabel}</Badge>
          </div>
        </CardContent>
      </Card>
    </button>
  );
};

addFilter(
  ADMIN_ARCHIVE_PRIMARY_ACTION_FILTER,
  ((...args: unknown[]) => {
    const defaultNode = args[0];
    const typedCtx = args[1] as ArchiveHookContext | undefined;
    if (!typedCtx || !isAttachmentsContext(typedCtx)) return defaultNode;
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          if (!focusAttachmentsUpload) {
            toast.error("Upload UI is not ready yet.");
            return;
          }
          focusAttachmentsUpload();
        }}
      >
        <Plus className="h-4 w-4" />
        Upload
      </Button>
    );
  }) as HookCallback,
  10,
  2,
);

addFilter(
  ADMIN_ARCHIVE_CONTENT_BEFORE,
  ((...args: unknown[]) => {
    const nodes = args[0] as React.ReactNode[];
    const typedCtx = args[1] as ArchiveHookContext | undefined;
    const typedNodes = Array.isArray(nodes) ? nodes : [];
    if (!typedCtx || !isAttachmentsContext(typedCtx)) return typedNodes;
    const items = Array.isArray(typedCtx.rows) ? typedCtx.rows : [];
    return [
      ...typedNodes,
      <div key="attachments-upload" className="container py-2">
        <AttachmentsUploadBox organizationId={typedCtx.organizationId} />
        <AttachmentsViewerHost items={items} />
      </div>,
    ];
  }) as HookCallback,
  10,
  2,
);

addFilter(
  ADMIN_ARCHIVE_DEFAULT_VIEWMODE_FILTER,
  ((...args: unknown[]) => {
    const defaultMode = args[0] as "list" | "grid";
    const typedCtx = args[1] as ArchiveHookContext | undefined;
    if (!typedCtx || !isAttachmentsContext(typedCtx)) {
      return defaultMode;
    }
    return "grid";
  }) as HookCallback,
  10,
  2,
);

addFilter(
  ADMIN_ARCHIVE_ITEM_RENDER_FILTER,
  ((...args: unknown[]) => {
    const defaultRender = args[0] as
      | ((item: ArchiveDisplayRow) => React.ReactNode)
      | undefined;
    const typedCtx = args[1] as ArchiveHookContext | undefined;
    if (!typedCtx || !isAttachmentsContext(typedCtx)) return defaultRender;
    return (item: ArchiveDisplayRow) => <AttachmentsGridCard item={item} />;
  }) as HookCallback,
  10,
  2,
);

addFilter(
  ADMIN_ARCHIVE_ROW_CLICK_FILTER,
  ((...args: unknown[]) => {
    const defaultHandler = args[0] as
      | ((item: ArchiveDisplayRow) => void)
      | undefined;
    const typedCtx = args[1] as ArchiveHookContext | undefined;
    if (!typedCtx || !isAttachmentsContext(typedCtx)) return defaultHandler;
    return (item: ArchiveDisplayRow) => {
      if (item.isPlaceholder) return;
      openAttachmentsViewer?.(item.id);
    };
  }) as HookCallback,
  10,
  2,
);

addFilter(
  ADMIN_ARCHIVE_COLUMNS_FILTER,
  ((...args: unknown[]) => {
    const defaultColumns = args[0] as ColumnDefinition<ArchiveDisplayRow>[];
    const typedCtx = args[1] as ArchiveHookContext | undefined;
    if (!typedCtx || !isAttachmentsContext(typedCtx)) return defaultColumns;

    const columns: ColumnDefinition<ArchiveDisplayRow>[] = [
      {
        id: "preview",
        header: "Preview",
        cell: (item: ArchiveDisplayRow) => {
          const previewUrl = item.previewUrl;
          const fileUrl = item.fileUrl ?? item.previewUrl;
          const { isImage, isVideo, isPdf } = inferMediaKind(item.title);
          const posterUrl =
            isVideo && previewUrl && previewUrl !== (fileUrl ?? null)
              ? previewUrl
              : undefined;
          const pdfThumbUrl =
            isPdf && previewUrl && previewUrl !== (fileUrl ?? null)
              ? previewUrl
              : undefined;
          return (
            <button
              type="button"
              className="bg-muted relative h-10 w-16 overflow-hidden rounded"
              onClick={(event) => {
                event.stopPropagation();
                openAttachmentsViewer?.(item.id);
              }}
            >
              {isImage && previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={item.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : isVideo && posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={item.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : isPdf && pdfThumbUrl ? (
                <Image
                  src={pdfThumbUrl}
                  alt={item.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : isVideo && fileUrl ? (
                <video
                  src={fileUrl}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : isPdf ? (
                <div className="relative h-full w-full">
                  <iframe
                    title={item.title}
                    src={`${fileUrl ?? ""}#page=1&view=FitH`}
                    className="h-full w-full"
                  />
                  <div className="absolute top-1 right-1">
                    <Badge variant="secondary">PDF</Badge>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FileText className="text-muted-foreground h-4 w-4" />
                </div>
              )}
            </button>
          );
        },
      },
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        sortable: true,
        cell: (item: ArchiveDisplayRow) => (
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              openAttachmentsViewer?.(item.id);
            }}
          >
            {item.title}
          </button>
        ),
      },
      {
        id: "statusLabel",
        accessorKey: "statusLabel",
        header: "Status",
        cell: (item: ArchiveDisplayRow) => (
          <Badge variant={item.statusVariant}>{item.statusLabel}</Badge>
        ),
      },
      {
        id: "updatedAt",
        header: "Updated",
        sortable: true,
        cell: (item: ArchiveDisplayRow) => (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
          </span>
        ),
      },
    ];

    return columns;
  }) as HookCallback,
  10,
  2,
);
