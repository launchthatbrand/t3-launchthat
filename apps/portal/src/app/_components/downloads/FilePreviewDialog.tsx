"use client";

import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Spinner } from "@acme/ui/spinner";

import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadId: Id<"downloads"> | null;
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  downloadId,
}: FilePreviewDialogProps) {
  const previewInfo = useQuery(
    api.downloads.getDownloadPreviewInfo,
    downloadId ? { downloadId } : "skip",
  );

  const renderPreviewContent = () => {
    if (!downloadId) return null;
    if (previewInfo === undefined) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }

    switch (previewInfo.status) {
      case "url_preview":
        if (previewInfo.fileType.startsWith("image/")) {
          return (
            <img
              src={previewInfo.url}
              alt={`Preview of ${previewInfo.fileName}`}
              className="max-h-[70vh] w-full object-contain"
            />
          );
        }
        if (previewInfo.fileType.startsWith("video/")) {
          return (
            <video
              controls
              src={previewInfo.url}
              className="max-h-[70vh] w-full"
            >
              Your browser does not support the video tag.
            </video>
          );
        }
        if (previewInfo.fileType.startsWith("audio/")) {
          return (
            <audio controls src={previewInfo.url} className="w-full">
              Your browser does not support the audio tag.
            </audio>
          );
        }
        if (previewInfo.fileType === "application/pdf") {
          return (
            <iframe
              src={previewInfo.url}
              className="h-[70vh] w-full"
              title={`Preview of ${previewInfo.fileName}`}
            />
          );
        }
        // Fallback for other URL types (e.g. large text files served via URL)
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-4">
            <p>
              This file type ({previewInfo.fileType}) is best viewed directly.
            </p>
            <Button asChild>
              <a
                href={previewInfo.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open {previewInfo.fileName} in new tab
              </a>
            </Button>
          </div>
        );
      case "content_preview":
        return (
          <div className="bg-muted max-h-[70vh] overflow-auto rounded p-4">
            <pre className="text-sm">{previewInfo.content}</pre>
          </div>
        );
      case "no_preview": {
        const noPreviewInfo = previewInfo as Extract<
          typeof previewInfo,
          { status: "no_preview" }
        >;
        return (
          <p>
            {noPreviewInfo.message ??
              `No preview available for ${noPreviewInfo.fileName} (${noPreviewInfo.fileType}).`}
          </p>
        );
      }
      // default: // Removed default case as all union variants should be handled
      //   return <p>Unknown preview status.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            File Preview: {previewInfo?.fileName ?? "Loading..."}
          </DialogTitle>
          {previewInfo?.fileType && (
            <DialogDescription>Type: {previewInfo.fileType}</DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">{renderPreviewContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
