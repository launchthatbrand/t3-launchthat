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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {attachments.length} attached
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
            <Button type="button" size="sm" variant="ghost" asChild>
              <Link
                href="/admin/edit/attachments"
                target="_blank"
                rel="noreferrer"
              >
                Manage
              </Link>
            </Button>
          </div>
        </div>

        {attachments.length === 0 ? (
          <div className="text-muted-foreground text-xs">
            No attachments yet.
          </div>
        ) : (
          <BuilderDndProvider onDragEnd={handleAttachmentsDragEnd}>
            <SortableList<AttachmentEntry>
              items={attachments}
              getId={(attachment) => attachment.mediaItemId}
              itemClassName="!items-stretch gap-0 rounded-md border bg-card p-0 mb-2 last:mb-0"
              renderItem={(attachment: AttachmentEntry) => (
                <div className="flex w-full items-center gap-2 p-2">
                  <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded">
                    {attachment.url ? (
                      <Image
                        src={attachment.url}
                        alt={attachment.title ?? "Attachment preview"}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                        <Paperclip className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {attachment.title ?? "Untitled attachment"}
                    </p>
                    {attachment.mimeType ? (
                      <p className="text-muted-foreground truncate text-[11px]">
                        {attachment.mimeType}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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

export const registerAttachmentsMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>(
    "sidebar",
    (context): RegisteredMetaBox<AdminMetaBoxContext> | null => {
      const attachmentsContext = context.attachmentsContext;
      if (!attachmentsContext?.supportsAttachments) {
        return null;
      }
      return {
        id: "core-attachments",
        title: "Attachments",
        description: "Attach files (drag to reorder).",
        location: "sidebar",
        priority: 25,
        render: () => <AttachmentsMetaBox context={context} />,
      };
    },
  );
};
