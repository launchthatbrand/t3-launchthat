"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";

interface MediaItem {
  _id: Id<"mediaItems">;
  _creationTime: number;
  url?: string;
  title?: string;
  caption?: string;
  alt?: string;
  status?: "draft" | "published";
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface AttachmentSingleViewProps {
  mediaItemId: Id<"mediaItems">;
  onBack: () => void;
}

export const AttachmentSingleView: React.FC<AttachmentSingleViewProps> = ({
  mediaItemId,
  onBack,
}) => {
  const mediaItem = useQuery(api.core.media.queries.getMediaItem, {
    id: mediaItemId,
  }) as MediaItem | null | undefined;

  const updateMedia = useMutation(api.core.media.mutations.updateMedia);
  const deleteMedia = useMutation(api.core.media.mutations.deleteMedia);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLoading = mediaItem === undefined;
  const exists = mediaItem !== null && mediaItem !== undefined;

  const previewUrl = exists ? mediaItem.url : undefined;
  const isImage = useMemo(() => {
    if (!exists) return false;
    const mimeType = mediaItem.mimeType ?? "";
    return mimeType.startsWith("image/");
  }, [exists, mediaItem?.mimeType]);

  const hydrateFields = useCallback(() => {
    if (!exists) return;
    setTitle(mediaItem.title ?? "");
    setCaption(mediaItem.caption ?? "");
    setAlt(mediaItem.alt ?? "");
    setStatus(mediaItem.status ?? "published");
  }, [exists, mediaItem]);

  // When the record first loads, hydrate form state.
  // We keep this explicit (not useEffect) to avoid re-hydrating while editing.
  const needsHydrate = exists && title === "" && caption === "" && alt === "";
  if (needsHydrate) {
    hydrateFields();
  }

  const handleSave = useCallback(async () => {
    if (!exists) return;
    setIsSaving(true);
    try {
      await updateMedia({
        id: mediaItemId,
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
        alt: alt.trim() || undefined,
        status,
      });
      toast.success("Saved attachment.");
    } catch (error) {
      toast.error("Save failed.", {
        description:
          error instanceof Error ? error.message : "Unexpected error.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [alt, caption, exists, mediaItemId, status, title, updateMedia]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteMedia({ id: mediaItemId });
      toast.success("Deleted attachment.");
      onBack();
    } catch (error) {
      toast.error("Delete failed.", {
        description:
          error instanceof Error ? error.message : "Unexpected error.",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteMedia, mediaItemId, onBack]);

  return (
    <AdminLayout>
      <AdminLayoutHeader
        title={exists ? (mediaItem.title ?? "Attachment") : "Attachment"}
        description="Edit attachment metadata stored in the media library."
      />
      <AdminLayoutContent className="flex flex-1">
        <AdminLayoutMain className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to library
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isDeleting || isSaving || isLoading || !exists}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Details</CardTitle>
              <Badge variant="secondary">
                {isLoading
                  ? "Loading…"
                  : exists
                    ? (mediaItem.status ?? "—")
                    : "Missing"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <p className="text-muted-foreground text-sm">
                  Loading attachment…
                </p>
              ) : !exists ? (
                <p className="text-muted-foreground text-sm">
                  The requested entry was not found or no longer exists.
                </p>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                        {previewUrl ? (
                          isImage ? (
                            <Image
                              src={previewUrl}
                              alt={
                                mediaItem.alt ?? mediaItem.title ?? "Attachment"
                              }
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                              <p className="text-sm font-medium">
                                Preview not available
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {mediaItem.mimeType ?? "Unknown type"}
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                            No URL
                          </div>
                        )}
                      </div>

                      {previewUrl ? (
                        <div className="text-muted-foreground text-xs">
                          <span className="text-foreground font-medium">
                            URL:
                          </span>{" "}
                          <Link
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all underline-offset-2 hover:underline"
                          >
                            {previewUrl}
                          </Link>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="attachment-title">Title</Label>
                        <Input
                          id="attachment-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attachment-alt">Alt text</Label>
                        <Input
                          id="attachment-alt"
                          value={alt}
                          onChange={(e) => setAlt(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attachment-caption">Caption</Label>
                        <Textarea
                          id="attachment-caption"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attachment-status">Status</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              status === "published" ? "default" : "outline"
                            }
                            onClick={() => setStatus("published")}
                          >
                            Published
                          </Button>
                          <Button
                            type="button"
                            variant={status === "draft" ? "default" : "outline"}
                            onClick={() => setStatus("draft")}
                          >
                            Draft
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </AdminLayoutMain>
        <AdminLayoutSidebar />
      </AdminLayoutContent>
    </AdminLayout>
  );
};
