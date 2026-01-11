/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use node";

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { v } from "convex/values";
import ffmpegPathImport from "ffmpeg-static";

import { internalAction } from "../../_generated/server";

const ffmpegPath: string | null =
  typeof ffmpegPathImport === "string" && ffmpegPathImport.length > 0
    ? ffmpegPathImport
    : null;

const runFfmpeg = async (args: string[]) => {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide a binary path.");
  }
  return await new Promise<{ code: number | null; output: string }>(
    (resolve) => {
      const proc = spawn(ffmpegPath, args);
      let buf = "";
      proc.stdout.on("data", (d: Buffer) => (buf += d.toString()));
      proc.stderr.on("data", (d: Buffer) => (buf += d.toString()));
      proc.on("close", (code) => resolve({ code, output: buf }));
      proc.on("error", (err) => resolve({ code: -1, output: String(err) }));
    },
  );
};

const vAny = v as any;
const internalActionAny = internalAction as any;

export const generateVideoPreviewImage = internalActionAny({
  args: {
    mediaItemId: vAny.id("mediaItems"),
    force: vAny.optional(vAny.boolean()),
  },
  returns: vAny.object({
    ok: vAny.boolean(),
    reason: vAny.optional(vAny.string()),
    previewImageStorageId: vAny.optional(vAny.id("_storage")),
  }),
  handler: async (ctx: any, args: any) => {
    const force = args.force ?? false;

    // Avoid deep type instantiation in huge apps.
    const apiAny = (await import("../../_generated/api")).api as any;

    const media = (await ctx.runQuery(apiAny.core.media.queries.getMediaById, {
      id: args.mediaItemId,
    })) as
      | (Record<string, unknown> & {
          url?: string;
          mimeType?: string;
          title?: string;
          previewImageStorageId?: string;
        })
      | null;

    if (!media) {
      return { ok: false, reason: "mediaItem not found" };
    }

    const mimeType = typeof media.mimeType === "string" ? media.mimeType : "";
    const title = typeof media.title === "string" ? media.title : "";
    const looksLikeVideo = /\.(mp4|webm|mov|m4v|ogg)$/i.test(title);
    if (!mimeType.startsWith("video/") && !looksLikeVideo) {
      return {
        ok: false,
        reason: `not a video (mimeType=${mimeType || "n/a"}, title=${title || "n/a"})`,
      };
    }

    if (!force && typeof media.previewImageStorageId === "string") {
      return { ok: true, reason: "preview already exists" };
    }

    const url = typeof media.url === "string" ? media.url : "";
    if (!url) {
      return { ok: false, reason: "mediaItem has no url" };
    }

    console.log("[media] generateVideoPreviewImage start", {
      mediaItemId: args.mediaItemId,
      urlPresent: Boolean(url),
      mimeType,
      title,
    });

    const res = await fetch(url);
    if (!res.ok || !res.body) {
      return {
        ok: false,
        reason: `failed to fetch video bytes (status=${res.status})`,
      };
    }

    const tmpVideoPath = `/tmp/${args.mediaItemId}.video`;
    const tmpJpgPath = `/tmp/${args.mediaItemId}.jpg`;

    try {
      // Node's types for Readable.fromWeb + ReadableStream can be finicky across TS versions.
      const nodeStream = Readable.fromWeb(res.body as any);
      await pipeline(nodeStream, createWriteStream(tmpVideoPath));

      // Extract a poster frame.
      // -ss after -i is more reliable across containers; slightly slower but ok for thumbnails.
      const ffmpeg = await runFfmpeg([
        "-y",
        "-i",
        tmpVideoPath,
        "-ss",
        "00:00:01.000",
        "-frames:v",
        "1",
        "-vf",
        "scale=640:-1",
        "-q:v",
        "4",
        tmpJpgPath,
      ]);

      if (ffmpeg.code !== 0) {
        return {
          ok: false,
          reason: `ffmpeg failed (code=${ffmpeg.code ?? "null"}): ${ffmpeg.output}`,
        };
      }

      const jpg = await readFile(tmpJpgPath);

      // Upload to Convex storage via upload URL.
      const uploadUrl = (await ctx.runMutation(
        apiAny.core.media.mutations.generateUploadUrl,
        {},
      )) as string;

      const jpgArrayBuffer = jpg.buffer.slice(
        jpg.byteOffset,
        jpg.byteOffset + jpg.byteLength,
      ) as ArrayBuffer;
      const jpgBlob = new Blob([jpgArrayBuffer], { type: "image/jpeg" });
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: jpgBlob,
      });
      if (!uploadRes.ok) {
        return {
          ok: false,
          reason: `failed to upload preview image (status=${uploadRes.status})`,
        };
      }
      const uploadedJson = (await uploadRes.json()) as { storageId?: string };
      const previewImageStorageId = uploadedJson.storageId;
      if (!previewImageStorageId) {
        return { ok: false, reason: "upload response missing storageId" };
      }

      await ctx.runMutation(apiAny.core.media.mutations.setMediaPreviewImage, {
        mediaItemId: args.mediaItemId,
        previewImageStorageId,
      });

      return {
        ok: true,
        previewImageStorageId: previewImageStorageId as any,
      };
    } finally {
      await rm(tmpVideoPath, { force: true });
      await rm(tmpJpgPath, { force: true });
    }
  },
});
