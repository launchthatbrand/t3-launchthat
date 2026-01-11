// @ts-nocheck
"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { FileText, ImageIcon, Upload, Video } from "lucide-react";

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
import { toast } from "@acme/ui/toast";

import { renderPdfFirstPageToPngBlob } from "~/lib/media/pdfPreview.client";

export type MediaItem = Doc<"mediaItems"> & {
  url?: string | null;
  previewImageUrl?: string | null;
};

type MediaQueryResult =
  | {
      page: MediaItem[];
    }
  | undefined;

export interface MediaLibraryProps {
  mode?: "select" | "browse";
  onSelect?: (media: MediaItem) => void;
  className?: string;
  organizationId?: Doc<"organizations">["_id"];
}

export function MediaLibrary({
  mode = "browse",
  onSelect,
  className,
  organizationId,
}: MediaLibraryProps) {
  // Convex function reference types can get extremely deep in larger apps.
  // Casting here keeps TS snappy and avoids "Type instantiation is excessively deep" errors.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = api as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useQueryAny = useQuery as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useMutationAny = useMutation as any;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const response = useQueryAny(
    apiAny.core.media.queries.listMediaItemsWithUrl,
    {
      paginationOpts: { numItems: 60, cursor: null },
      organizationId,
    },
  ) as unknown as MediaQueryResult;
  const mediaItems: MediaItem[] = response?.page ?? [];
  const isLoading = response === undefined;
  const isSelectable = mode === "select" && typeof onSelect === "function";

  const generateUploadUrl = useMutationAny(
    apiAny.core.media.mutations.generateUploadUrl,
  );
  const saveMedia = useMutationAny(apiAny.core.media.mutations.saveMedia);
  const setMediaPreviewImage = useMutationAny(
    apiAny.core.media.mutations.setMediaPreviewImage,
  );

  const canUpload = Boolean(organizationId);

  const handleUploadClick = useCallback(() => {
    if (!canUpload) {
      toast.error("Missing organization context for uploads.");
      return;
    }
    fileInputRef.current?.click();
  }, [canUpload]);

  const handleFilesSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) return;
      if (!organizationId) {
        toast.error("Missing organization context for uploads.");
        return;
      }

      setIsUploading(true);
      try {
        const uploadUrl = await generateUploadUrl({});
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
        const saved = await saveMedia({
          organizationId,
          storageId: storageId as unknown as Id<"_storage">,
          title: file.name,
          mimeType: file.type || undefined,
          status: "published",
        });

        // Best-effort: generate PDF preview client-side so we don't ship pdfjs
        // into Convex Node (which can exceed Convex module size limits).
        const isPdf =
          file.type === "application/pdf" || /\.pdf$/i.test(file.name);
        if (isPdf) {
          try {
            const pngBlob = await renderPdfFirstPageToPngBlob(
              await file.arrayBuffer(),
            );
            const thumbUploadUrl = await generateUploadUrl({});
            const thumbRes = await fetch(thumbUploadUrl, {
              method: "POST",
              headers: { "Content-Type": "image/png" },
              body: pngBlob,
            });
            if (thumbRes.ok) {
              const uploadedJson = (await thumbRes.json()) as {
                storageId?: Id<"_storage">;
              };
              if (uploadedJson.storageId) {
                await setMediaPreviewImage({
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  mediaItemId: (saved as any)._id as Id<"mediaItems">,
                  previewImageStorageId: uploadedJson.storageId,
                });
              }
            }
          } catch {
            // ignore (fallback previews still work)
          }
        }

        toast.success("Uploaded");
        if (isSelectable) {
          // Convex query will refresh; but we can also select immediately.
          onSelect(saved as unknown as MediaItem);
        }
      } catch (error) {
        toast.error("Upload failed", {
          description:
            error instanceof Error ? error.message : "Unexpected error.",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [
      generateUploadUrl,
      isSelectable,
      onSelect,
      organizationId,
      saveMedia,
      setMediaPreviewImage,
    ],
  );

  const headerActions = useMemo(() => {
    if (!canUpload) return null;
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>
    );
  }, [canUpload, handleFilesSelected, handleUploadClick, isUploading]);

  if (isLoading) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader>
          <CardTitle>Loading media…</CardTitle>
          <CardDescription>Fetching your latest uploads.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Please wait while we load your media items.
        </CardContent>
      </Card>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="bg-background sticky top-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>No media yet</CardTitle>
              <CardDescription>
                Upload media here, or manage it in the Attachments archive.
              </CardDescription>
            </div>
            {headerActions}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Once you upload files, they will appear in this picker
            automatically.
          </p>
          <Button asChild variant="outline" size="sm">
            <a
              href="/admin/edit?post_type=attachments"
              target="_blank"
              rel="noreferrer"
            >
              Open Attachments
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {headerActions}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {mediaItems.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => isSelectable && onSelect(item)}
            className={cn(
              "group hover:border-primary overflow-hidden rounded-md border text-left transition",
              !isSelectable && "cursor-default",
            )}
            disabled={!isSelectable}
          >
            <div className="bg-muted relative aspect-video">
              {(() => {
                const mime = item.mimeType ?? "";
                const title = item.title ?? "";
                const looksLikeImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(
                  title,
                );
                const looksLikeVideo = /\.(mp4|webm|mov|m4v|ogg)$/i.test(title);
                const looksLikePdf = /\.pdf$/i.test(title);

                const isImage = mime.startsWith("image/") || looksLikeImage;
                const isVideo = mime.startsWith("video/") || looksLikeVideo;
                const isPdf = mime === "application/pdf" || looksLikePdf;

                const previewSrc =
                  isVideo && item.previewImageUrl
                    ? item.previewImageUrl
                    : isPdf && item.previewImageUrl
                      ? item.previewImageUrl
                      : isImage
                        ? item.url
                        : null;

                if (previewSrc) {
                  return (
                    <Image
                      src={previewSrc}
                      alt={item.title ?? "Media item"}
                      fill
                      sizes="320px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  );
                }

                if (isVideo && item.url) {
                  return (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  );
                }

                if (isPdf && item.url) {
                  return (
                    <div className="relative h-full w-full">
                      <iframe
                        title={item.title ?? "PDF preview"}
                        src={`${item.url}#page=1&view=FitH`}
                        className="h-full w-full"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">PDF</Badge>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                    {isVideo ? (
                      <Video className="h-5 w-5" />
                    ) : isPdf ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-medium">
                {item.title ?? "Untitled"}
              </p>
              <p className="text-muted-foreground text-xs">
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
