"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { api } from "@portal/convexspec";
import { useAction } from "convex/react";
import { COMMAND_PRIORITY_LOW } from "lexical";

import { INSERT_OEMBED_COMMAND } from "./oembed-plugin";

interface AttachmentEntry {
  mediaItemId: Id<"mediaItems">;
  url: string;
  title?: string;
  alt?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

interface MinimalAttachmentsContext {
  attachments: AttachmentEntry[];
  setAttachments: (
    updater: (prev: AttachmentEntry[]) => AttachmentEntry[],
  ) => void;
}

type RegisterMetaPayloadCollectorAction = (
  collector: () => Record<string, unknown> | null | undefined,
) => () => void;

const LMS_AUTO_THUMBNAIL_META_KEY = "lmsAutoThumbnailSourceUrl";

const LMS_SUPPORTED_SLUGS = new Set([
  "courses",
  "lessons",
  "topics",
  "quizzes",
]);

export function LmsAutoThumbnailFromOEmbedPlugin({
  enabled,
  attachmentsContext,
  registerMetaPayloadCollectorAction,
  organizationId,
  initialAutoThumbnailUrl,
}: {
  enabled: boolean;
  attachmentsContext?: MinimalAttachmentsContext;
  registerMetaPayloadCollectorAction?: RegisterMetaPayloadCollectorAction;
  organizationId?: Id<"organizations">;
  initialAutoThumbnailUrl?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const createThumbnail = useAction(
    api.plugins.lms.actions.createVideoThumbnailAttachment,
  ) as (args: {
    sourceUrl: string;
    organizationId?: Id<"organizations">;
  }) => Promise<{
    mediaItemId: Id<"mediaItems">;
    url: string;
    title?: string;
    mimeType?: string;
    width?: number;
    height?: number;
  }>;

  const autoThumbnailUrlRef = useRef<string | null>(
    initialAutoThumbnailUrl?.trim() ? initialAutoThumbnailUrl.trim() : null,
  );
  const inflightRef = useRef<string | null>(null);

  useEffect(() => {
    autoThumbnailUrlRef.current = initialAutoThumbnailUrl?.trim()
      ? initialAutoThumbnailUrl.trim()
      : null;
  }, [initialAutoThumbnailUrl]);

  useEffect(() => {
    if (!registerMetaPayloadCollectorAction) return;
    return registerMetaPayloadCollectorAction(() => {
      const value = autoThumbnailUrlRef.current;
      if (!value) return null;
      return { [LMS_AUTO_THUMBNAIL_META_KEY]: value };
    });
  }, [registerMetaPayloadCollectorAction]);

  const canRun = useMemo(() => {
    if (!enabled) return false;
    if (!attachmentsContext) return false;
    return true;
  }, [attachmentsContext, enabled]);

  useEffect(() => {
    if (!canRun) return;
    const ctx = attachmentsContext;
    if (!ctx) return;

    return editor.registerCommand(
      INSERT_OEMBED_COMMAND,
      (payload) => {
        // Only handle Vimeo-ish embeds (oEmbed helper is Vimeo-only today, but be defensive).
        const url = payload.url.trim();
        if (!url) return false;
        if (!url.includes("vimeo.com")) return false;

        // Safety rule: if there are attachments and we didn't previously set an auto thumbnail,
        // don't overwrite user-chosen attachments.
        if (ctx.attachments.length > 0 && !autoThumbnailUrlRef.current) {
          return false;
        }

        // Idempotency: if we've already set this URL as the auto-thumbnail source, skip.
        if (autoThumbnailUrlRef.current === url) {
          return false;
        }

        // Avoid duplicate inflight for the same URL.
        if (inflightRef.current === url) {
          return false;
        }

        inflightRef.current = url;
        void (async () => {
          try {
            const result = await createThumbnail({
              sourceUrl: url,
              organizationId: organizationId ?? undefined,
            });

            const entry: AttachmentEntry = {
              mediaItemId: result.mediaItemId,
              url: result.url,
              title: result.title ?? undefined,
              mimeType: result.mimeType ?? undefined,
              width: result.width ?? undefined,
              height: result.height ?? undefined,
            };

            ctx.setAttachments((prev) => {
              const shouldReplaceFirst =
                prev.length === 0 || Boolean(autoThumbnailUrlRef.current);
              if (!shouldReplaceFirst) return prev;
              const rest = prev.filter(
                (item) => item.mediaItemId !== entry.mediaItemId,
              );
              return [entry, ...rest];
            });

            autoThumbnailUrlRef.current = url;
          } catch (error) {
            console.error("[LmsAutoThumbnailFromOEmbedPlugin] failed", error);
          } finally {
            if (inflightRef.current === url) {
              inflightRef.current = null;
            }
          }
        })();

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [attachmentsContext, canRun, createThumbnail, editor, organizationId]);

  return null;
}

export const isLmsAutoThumbnailEnabledForSlug = (
  slug: string | null | undefined,
) => !!slug && LMS_SUPPORTED_SLUGS.has(String(slug).toLowerCase());
