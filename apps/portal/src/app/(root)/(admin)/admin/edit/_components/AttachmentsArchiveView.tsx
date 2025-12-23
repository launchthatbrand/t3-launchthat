"use client";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
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
import { Sparkles, Trash2, Upload } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
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
  renderLayout?: boolean;
}

export function AttachmentsArchiveView({
  slug,
  postType,
  options,
  onPostTypeChange,
  renderLayout = true,
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
  const deleteMedia = useMutation(api.core.media.mutations.deleteMedia);
  const [deleteTarget, setDeleteTarget] = useState<MediaItemDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const mediaResponse = useQuery(api.core.media.queries.listMediaItemsWithUrl, {
    paginationOpts: { numItems: 60, cursor: null },
  });
  const mediaItems: MediaItemDoc[] = mediaResponse?.page ?? [];
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
            headers: { "Content-Type": file.type || "application/octet-stream" },
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

  const headerDescription = useMemo(
    () =>
      description ??
      "Upload high-resolution assets for the best results. Attachments automatically land in your WordPress-style media library.",
    [description],
  );
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
              onClick={() => setDeleteTarget(item)}
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

  const libraryBody = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={slug} onValueChange={onPostTypeChange}>
          <SelectTrigger className="w-[240px]">
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
                      onClick={() => setDeleteTarget(item)}
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

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => (open ? null : setDeleteTarget(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attachment and its underlying file
              from storage. This action can’t be undone.
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
