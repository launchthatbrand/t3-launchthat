import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { UploadCloud } from "lucide-react";

import { registerMetaBoxHook } from "@acme/admin-runtime";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { AdminMetaBoxContext } from "../types";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MediaLibrary } from "~/components/media/MediaLibrary";

const DOWNLOADS_POST_TYPE_SLUG = "downloads";

const DownloadsMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const mediaItemIdValue = context.getMetaValue("mediaItemId");
  const mediaItemId = useMemo(() => {
    if (typeof mediaItemIdValue !== "string" || mediaItemIdValue.length === 0) {
      return undefined;
    }
    return mediaItemIdValue as unknown as Id<"mediaItems">;
  }, [mediaItemIdValue]);

  const mediaItem = useQuery(
    api.core.media.queries.getMediaItem,
    mediaItemId ? { id: mediaItemId } : "skip",
  );

  const accessKindValue = context.getMetaValue("accessKind");
  const accessKind =
    accessKindValue === "gated" || accessKindValue === "public"
      ? (accessKindValue)
      : "public";

  const descriptionValue = context.getMetaValue("description");
  const description = typeof descriptionValue === "string" ? descriptionValue : "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Linked file</Label>

        {mediaItemId ? (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <div className="bg-muted relative h-16 w-16 overflow-hidden rounded">
              {mediaItem?.url ? (
                <Image
                  src={mediaItem.url}
                  alt={mediaItem.title ?? "File preview"}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              ) : (
                <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                  File
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-medium">
                {mediaItem?.title ?? "Selected file"}
              </p>
              {mediaItem?.mimeType ? (
                <p className="text-muted-foreground truncate text-xs">
                  {mediaItem.mimeType}
                </p>
              ) : null}
              {mediaItem?.url ? (
                <p className="text-muted-foreground truncate text-xs">
                  {mediaItem.url}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => context.setMetaValue("mediaItemId", null)}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => setDialogOpen(true)}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Select from Media Library
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="download-access-kind">Access</Label>
        <Select
          value={accessKind}
          onValueChange={(value: "public" | "gated") =>
            context.setMetaValue("accessKind", value)
          }
        >
          <SelectTrigger id="download-access-kind">
            <SelectValue placeholder="Select access type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public (no login required)</SelectItem>
            <SelectItem value="gated">Gated (requires login/entitlement)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="download-description">Description</Label>
        <Textarea
          id="download-description"
          rows={3}
          value={description}
          onChange={(event) => context.setMetaValue("description", event.target.value)}
          placeholder="Optional description shown on download pages"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select download file</DialogTitle>
            <DialogDescription>
              Pick a file from your media library. This download will copy bytes to R2 when
              published.
            </DialogDescription>
          </DialogHeader>
          <MediaLibrary
            mode="select"
            onSelect={(media) => {
              context.setMetaValue("mediaItemId", media._id as unknown as string);
              if (context.general?.title.trim() === "") {
                context.general.setTitle(media.title ?? "");
              }
              setDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const registerDownloadsMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>("main", (context) => {
    if (context.slug !== DOWNLOADS_POST_TYPE_SLUG) {
      return null;
    }

    return {
      id: "core-download-details",
      title: "Download Details",
      description: "Choose the file and access rules for this download.",
      location: "main",
      priority: 9,
      render: () => <DownloadsMetaBox context={context} />,
    };
  });
};


