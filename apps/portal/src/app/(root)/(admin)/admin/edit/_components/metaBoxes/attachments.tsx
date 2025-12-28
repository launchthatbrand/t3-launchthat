import Image from "next/image";
import Link from "next/link";
import { Paperclip, Plus, Trash2 } from "lucide-react";

import { BuilderDndProvider, SortableList } from "@acme/dnd";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";

import type { RegisteredMetaBox } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import type { AdminMetaBoxContext, AttachmentEntry } from "../types";
import { MediaLibrary } from "~/components/media/MediaLibrary";

const AttachmentsMetaBox = ({ context }: { context: AdminMetaBoxContext }) => {
  const attachmentsContext = context.attachmentsContext;
  if (!attachmentsContext) {
    return null;
  }

  const organizationId = context.organizationId ?? context.general?.organizationId;

  const {
    attachments,
    handleAttachmentRemove,
    handleAttachmentSelect,
    handleAttachmentsDragEnd,
    isDialogOpen,
    setDialogOpen,
  } = attachmentsContext;

  return (
    <>
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Attach files to keep track of supporting assets—images, downloads, or
          external media pulled from the Attachments post type. Drag the handle
          to reorder.
        </p>
        {attachments.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No attachments yet. Use the button below to add files.
          </div>
        ) : (
          <BuilderDndProvider onDragEnd={handleAttachmentsDragEnd}>
            <SortableList<AttachmentEntry>
              items={attachments}
              getId={(attachment) => attachment.mediaItemId}
              itemClassName="!items-stretch gap-0 border bg-card p-0 mb-3 last:mb-0"
              renderItem={(attachment: AttachmentEntry) => (
                <div className="flex w-full items-start gap-3 p-3">
                  <div className="bg-muted relative h-16 w-16 overflow-hidden rounded">
                    {attachment.url ? (
                      <Image
                        src={attachment.url}
                        alt={attachment.title ?? "Attachment preview"}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                        <Paperclip className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">
                      {attachment.title ?? "Untitled attachment"}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {attachment.url}
                    </p>
                    {attachment.mimeType ? (
                      <p className="text-muted-foreground text-xs">
                        {attachment.mimeType}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove attachment"
                    onClick={() =>
                      handleAttachmentRemove(attachment.mediaItemId)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          </BuilderDndProvider>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add from Media Library
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link
              href="/admin/edit/attachments"
              target="_blank"
              rel="noreferrer"
            >
              Manage Attachments
            </Link>
          </Button>
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select attachments</DialogTitle>
            <DialogDescription>
              Pick one or more files from the Attachments post type. Upload new
              assets in another tab if needed.
            </DialogDescription>
          </DialogHeader>
          <MediaLibrary
            mode="select"
            onSelect={handleAttachmentSelect}
            organizationId={organizationId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const registerAttachmentsMetaBox = () =>
  registerMetaBoxHook<AdminMetaBoxContext>(
    "main",
    (context): RegisteredMetaBox<AdminMetaBoxContext> | null => {
    const attachmentsContext = context.attachmentsContext;
    if (!attachmentsContext?.supportsAttachments) {
      return null;
    }
    return {
      id: "core-attachments",
      title: "Attachments",
      description:
        "Link media items from the Attachments library to this entry.",
      location: "main",
      priority: 10,
      render: () => <AttachmentsMetaBox context={context} />,
    };
    },
  );

registerAttachmentsMetaBox();
