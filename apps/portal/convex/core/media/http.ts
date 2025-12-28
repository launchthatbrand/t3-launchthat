import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import { httpAction } from "../../_generated/server";

const pickFirstBlobFromFormData = (formData: FormData): Blob | null => {
  // Prefer common keys, but fall back to first Blob/File in the form data.
  const preferredKeys = ["file", "files", "upload", "media", "image"];
  for (const key of preferredKeys) {
    const value = formData.get(key);
    if (value instanceof Blob) return value;
  }
  for (const [, value] of formData.entries()) {
    if (value instanceof Blob) return value;
  }
  return null;
};

// POST /uploadMedia
export const uploadMediaPost = httpAction(async (ctx, request) => {
  const contentType = request.headers.get("content-type") ?? "";

  // Many admin upload forms submit multipart/form-data. `request.blob()` would
  // capture the entire multipart payload (boundaries + metadata), corrupting
  // the stored file. Parse formData and store the actual file blob instead.
  let blob: Blob;
  if (contentType.toLowerCase().includes("multipart/form-data")) {
    const formData = await request.formData();
    const fileBlob = pickFirstBlobFromFormData(formData);
    if (!fileBlob) {
      return new Response(JSON.stringify({ error: "No file found in upload" }), {
        status: 400,
        headers: new Headers({
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          Vary: "origin",
        }),
      });
    }
    blob = fileBlob;
  } else {
    // Fallback for raw binary uploads
    blob = await request.blob();
  }

  const storageId = await ctx.storage.store(blob);

  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? undefined;
  const alt = url.searchParams.get("alt") ?? undefined;
  const caption = url.searchParams.get("caption") ?? undefined;
  const organizationIdParam = url.searchParams.get("organizationId") ?? undefined;
  const categories =
    url.searchParams.get("categories")?.split(",") ?? undefined;
  const statusParam = url.searchParams.get("status");
  const status: "draft" | "published" =
    statusParam === "published" ? "published" : "draft";

  const mediaItem = await ctx.runMutation(api.core.media.mutations.saveMedia, {
    storageId,
    organizationId: organizationIdParam
      ? (organizationIdParam as Id<"organizations">)
      : undefined,
    title,
    alt,
    caption,
    categories,
    status,
  });

  return new Response(JSON.stringify(mediaItem), {
    status: 200,
    headers: new Headers({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      Vary: "origin",
    }),
  });
});

// OPTIONS /uploadMedia (preflight)
export const uploadMediaOptions = httpAction(async (_ctx, request) => {
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    await Promise.resolve();
    return new Response(null, {
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Digest",
        "Access-Control-Max-Age": "86400",
      }),
    });
  }
  return new Response();
});

/**
 * Legacy webhook handler for media creation
 */
export const createMediaFromWebhook = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const body: unknown = await request.json();
    const data = body as {
      storageId?: string;
      title?: string;
      caption?: string;
      alt?: string;
      categories?: string[];
      status?: "draft" | "published";
    };

    const { storageId, title, caption, alt, categories, status } = data;

    if (!storageId) {
      return new Response(JSON.stringify({ error: "storageId is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const mediaId = await ctx.runMutation(
      api.core.media.mutations.upsertMediaMeta,
      {
        storageId: storageId as Id<"_storage">,
        title,
        caption,
        alt,
        categories,
        status,
      },
    );

    return new Response(JSON.stringify({ mediaId }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
