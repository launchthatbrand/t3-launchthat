import type { Id } from "@/convex/_generated/dataModel";
import type { DragEndEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import { toast } from "@acme/ui/toast";

import type {
  AttachmentEntry,
  AttachmentsContext,
  CustomFieldValue,
} from "../types";
import type { MediaItem } from "~/components/media/MediaLibrary";
import { ATTACHMENTS_META_KEY } from "../metaBoxes/constants";

interface ParsedAttachment {
  mediaItemId?: string;
  url?: string;
  title?: string;
  alt?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

type ParsedAttachmentWithRequired = ParsedAttachment & {
  mediaItemId: string;
  url: string;
};

const parseAttachmentValue = (
  value: CustomFieldValue | undefined,
): AttachmentEntry[] => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (entry): entry is ParsedAttachmentWithRequired =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as ParsedAttachment).mediaItemId === "string" &&
          typeof (entry as ParsedAttachment).url === "string",
      )
      .map((entry) => ({
        mediaItemId: entry.mediaItemId as Id<"mediaItems">,
        url: entry.url,
        title: entry.title ?? undefined,
        alt: entry.alt ?? undefined,
        mimeType: entry.mimeType ?? undefined,
        width: entry.width,
        height: entry.height,
      }));
  } catch {
    return [];
  }
};

const serializeAttachments = (entries: AttachmentEntry[]) =>
  JSON.stringify(entries);

interface UseAttachmentsMetaBoxOptions {
  postMetaMap: Record<string, CustomFieldValue>;
  supportsAttachments: boolean;
}

export const useAttachmentsMetaBox = ({
  postMetaMap,
  supportsAttachments,
}: UseAttachmentsMetaBoxOptions) => {
  const attachmentsMetaValue = postMetaMap[ATTACHMENTS_META_KEY];
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!supportsAttachments) {
      setAttachments([]);
      return;
    }
    setAttachments(parseAttachmentValue(attachmentsMetaValue));
  }, [attachmentsMetaValue, supportsAttachments]);

  const handleAttachmentsDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setAttachments((prev) => {
      const oldIndex = prev.findIndex(
        (entry) => entry.mediaItemId === active.id,
      );
      const newIndex = prev.findIndex((entry) => entry.mediaItemId === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleAttachmentSelect = useCallback((media: MediaItem) => {
    const mediaUrl = media.url;
    if (!mediaUrl) {
      toast.error("Selected media item is missing a URL.");
      return;
    }
    const entry: AttachmentEntry = {
      mediaItemId: media._id,
      url: mediaUrl,
      title: media.title ?? undefined,
      alt: media.alt ?? undefined,
      mimeType: media.mimeType ?? undefined,
      width: media.width ?? undefined,
      height: media.height ?? undefined,
    };
    setAttachments((prev) => {
      if (prev.some((item) => item.mediaItemId === entry.mediaItemId)) {
        toast.error("This attachment is already linked.");
        return prev;
      }
      return [...prev, entry];
    });
  }, []);

  const handleAttachmentRemove = useCallback(
    (mediaItemId: Id<"mediaItems">) => {
      setAttachments((prev) =>
        prev.filter((item) => item.mediaItemId !== mediaItemId),
      );
    },
    [],
  );

  const context = useMemo<AttachmentsContext | undefined>(() => {
    if (!supportsAttachments) {
      return undefined;
    }
    return {
      supportsAttachments,
      attachments,
      setAttachments,
      handleAttachmentSelect,
      handleAttachmentRemove,
      handleAttachmentsDragEnd,
      isDialogOpen,
      setDialogOpen,
    };
  }, [
    attachments,
    handleAttachmentRemove,
    handleAttachmentSelect,
    handleAttachmentsDragEnd,
    isDialogOpen,
    supportsAttachments,
  ]);

  const serializedValue = useMemo(() => {
    if (!supportsAttachments || attachments.length === 0) {
      return null;
    }
    return serializeAttachments(attachments);
  }, [attachments, supportsAttachments]);

  return { context, serializedValue };
};
