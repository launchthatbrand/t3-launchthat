"use client";

import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Loader2, Sparkles, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";

type PostTypeDoc = Doc<"postTypes">;
type MediaItemDoc = Doc<"mediaItems"> & { url?: string | null };

export interface AttachmentsArchiveViewProps {
  slug: string;
  postType: PostTypeDoc | null;
  options: PostTypeDoc[];
  onPostTypeChange: (slug: string) => void;
}

export function AttachmentsArchiveView({
  slug,
  postType,
  options,
  onPostTypeChange,
}: AttachmentsArchiveViewProps) {
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

  const mediaResponse = useQuery(api.media.queries.listMediaItemsWithUrl, {
    paginationOpts: { numItems: 60, cursor: null },
  });
  const mediaItems: MediaItemDoc[] =
    (mediaResponse?.page as MediaItemDoc[]) ?? [];
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
          const formData = new FormData();
          formData.append("file", file);
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
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

  const headerDescription = useMemo(
    () =>
      description ??
      "Upload high-resolution assets for the best results. Attachments automatically land in your WordPress-style media library.",
    [description],
  );

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Admin / Media</p>
              <h1 className="text-3xl font-bold">{label}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={slug} onValueChange={onPostTypeChange}>
                <SelectTrigger className="w-[200px]">
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

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Media Grid</CardTitle>
              <CardDescription>
                Preview recently uploaded files. Click “Upload” to add new media
                directly from your computer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading attachments…
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="mb-2 h-6 w-6" />
                  <p>No attachments yet. Upload your first media item.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {mediaItems.map((item) => (
                    <Card key={item._id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                          {item.url ? (
                            <Image
                              src={item.url}
                              alt={item.title ?? "Attachment"}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No preview
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {item.title ?? "Untitled"}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.status ?? "draft"}</span>
                            <span>
                              {formatDistanceToNow(item._creationTime, {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayoutMain>
      <AdminLayoutSidebar>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media tips</CardTitle>
            <CardDescription>{headerDescription}</CardDescription>
          </CardHeader>
        </Card>
      </AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}

