import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const createMediaFromWebhook = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const body = await request.json();
    const { storageId, externalUrl, title, caption, alt, categories, status } =
      body;
    if (!storageId && !externalUrl) {
      return new Response(
        JSON.stringify({
          error: "Either storageId or externalUrl is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
    const mediaId = await ctx.runMutation(api.media.mutations.upsertMediaMeta, {
      storageId,
      externalUrl,
      title,
      caption,
      alt,
      categories,
      status,
    });
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
