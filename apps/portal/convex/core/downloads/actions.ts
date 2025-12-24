"use node";

import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { api, internal } from "../../_generated/api";
import { action } from "../../_generated/server";
import { r2 } from "../../r2";

type DownloadDoc = Doc<"downloads">;

const toUint8Array = async (raw: unknown): Promise<Uint8Array> => {
  if (!raw) {
    throw new Error("Missing bytes.");
  }
  if (raw instanceof Uint8Array) return raw;
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView?.(raw)) {
    const view = raw as ArrayBufferView;
    return new Uint8Array(
      view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
    );
  }
  if (typeof Blob !== "undefined" && raw instanceof Blob) {
    return new Uint8Array(await raw.arrayBuffer());
  }
  throw new Error("Unsupported byte format returned from storage.");
};

export const publishDownload = action({
  args: {
    organizationId: v.id("organizations"),
    downloadId: v.id("downloads"),
  },
  returns: v.object({
    downloadId: v.id("downloads"),
    r2Key: v.string(),
  }),
  handler: async (ctx, args) => {
    const downloadResult = await ctx.runQuery(api.core.downloads.queries.getDownloadById, {
      organizationId: args.organizationId,
      downloadId: args.downloadId,
    });
    if (!downloadResult) {
      throw new Error("Download not found.");
    }

    const download: DownloadDoc = downloadResult.download as any;

    if (download.status === "published" && download.r2Key) {
      return { downloadId: args.downloadId, r2Key: download.r2Key };
    }

    const media = await ctx.runQuery(api.core.media.queries.getMediaById, {
      id: download.mediaItemId,
    });
    if (!media) {
      throw new Error("Attachment not found.");
    }

    if (!media.storageId) {
      throw new Error("This attachment is not stored in Convex storage.");
    }

    const raw = await ctx.storage.get(media.storageId);
    if (!raw) {
      throw new Error("Failed to read attachment bytes from storage.");
    }
    const bytes = await toUint8Array(raw);

    const r2Key = await r2.store(ctx as any, bytes, {
      type: media.mimeType ?? undefined,
    });

    await ctx.runMutation(internal.core.downloads.mutations.finalizePublish, {
      organizationId: args.organizationId,
      downloadId: args.downloadId,
      r2Key,
    });

    return { downloadId: args.downloadId, r2Key };
  },
});


