"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Search, Upload } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

interface MediaItemWithUrl {
  _id: Id<"mediaItems">;
  _creationTime: number;
  url?: string | null;
  title?: string | null;
  status?: "draft" | "published" | null;
  mimeType?: string | null;
}

interface MediaLibrarySingleSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: Id<"organizations">;
  title?: string;
  description?: string;
  accept?: string;
  onSelectUrl: (url: string) => Promise<void> | void;
}

export function MediaLibrarySingleSelectDialog({
  open,
  onOpenChange,
  organizationId,
  title = "Select media",
  description = "Upload a new file or select from your media library.",
  accept = "image/*",
  onSelectUrl,
}: MediaLibrarySingleSelectDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const generateUploadUrl = useMutation(api.core.media.mutations.generateUploadUrl);
  const saveMedia = useMutation(api.core.media.mutations.saveMedia);

  const normalizedSearch = search.trim();
  const mediaQueryArgs = useMemo(
    () =>
      normalizedSearch
        ? {
            paginationOpts: { numItems: 60, cursor: null },
            searchTerm: normalizedSearch,
            organizationId,
          }
        : {
            paginationOpts: { numItems: 60, cursor: null },
            organizationId,
          },
    [normalizedSearch, organizationId],
  );

  const mediaResponse = useQuery(
    api.core.media.queries.listMediaItemsWithUrl,
    mediaQueryArgs,
  );
  const items: MediaItemWithUrl[] = (mediaResponse?.page ?? []) as MediaItemWithUrl[];
  const isLoading = mediaResponse === undefined;

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) return;

      setUploadError(null);
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
        const { storageId } = (await uploadResponse.json()) as { storageId: string };
        const saved = await saveMedia({
          organizationId,
          storageId: storageId as Id<"_storage">,
          title: file.name,
          status: "published",
        });

        await onSelectUrl(saved.url);
        toast.success("Logo updated");
        onOpenChange(false);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [generateUploadUrl, onOpenChange, onSelectUrl, organizationId, saveMedia],
  );

  const handleSelect = useCallback(
    async (item: MediaItemWithUrl) => {
      if (!item.url) {
        toast.error("Selected media item has no URL.");
        return;
      }
      if (isSelecting) return;
      setIsSelecting(true);
      try {
        await onSelectUrl(item.url);
        toast.success("Logo updated");
        onOpenChange(false);
      } finally {
        setIsSelecting(false);
      }
    },
    [isSelecting, onOpenChange, onSelectUrl],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                placeholder="Search media"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button
              type="button"
              className="gap-2"
              variant="outline"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFilesSelected}
            />
          </div>

          {uploadError ? (
            <p className="text-destructive text-sm">{uploadError}</p>
          ) : null}

          <Separator />

          {isLoading ? (
            <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading media…
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground flex h-48 flex-col items-center justify-center text-center text-sm">
              <p>No media yet. Upload an image to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => void handleSelect(item)}
                  disabled={isSelecting}
                  className="group overflow-hidden rounded-md border text-left transition hover:border-primary disabled:opacity-60"
                >
                  <div className="bg-muted relative aspect-video">
                    {item.url ? (
                      <Image
                        src={item.url}
                        alt={item.title ?? "Media item"}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {item.title ?? "Untitled"}
                      </p>
                      <Badge
                        variant={item.status === "published" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {item.status ?? "draft"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(item._creationTime, { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

















