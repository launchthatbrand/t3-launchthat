import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { httpRouter } from "convex/server";
const http = httpRouter();
/**
 * HTTP action for direct file upload
 * Based on Convex documentation example
 */
http.route({
    path: "/uploadMedia",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        // Step 1: Store the file
        const blob = await request.blob();
        const storageId = await ctx.storage.store(blob);
        // Step 2: Extract metadata from URL parameters or headers
        const url = new URL(request.url);
        const title = url.searchParams.get("title") || undefined;
        const alt = url.searchParams.get("alt") || undefined;
        const caption = url.searchParams.get("caption") || undefined;
        const categories = url.searchParams.get("categories")?.split(",") || undefined;
        const status = url.searchParams.get("status") || "draft";
        // Step 3: Save the storage ID and metadata to the database via a mutation
        const mediaItem = await ctx.runMutation(api.media.saveMedia, {
            storageId,
            title,
            alt,
            caption,
            categories,
            status,
        });
        // Step 4: Return response with CORS headers
        return new Response(JSON.stringify(mediaItem), {
            status: 200,
            headers: new Headers({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN || "*",
                Vary: "origin",
            }),
        });
    }),
});
/**
 * Pre-flight request for /uploadMedia
 */
http.route({
    path: "/uploadMedia",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
        // Make sure the necessary headers are present for valid pre-flight request
        const headers = request.headers;
        if (headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null) {
            return new Response(null, {
                headers: new Headers({
                    "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN || "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, Digest",
                    "Access-Control-Max-Age": "86400",
                }),
            });
        }
        else {
            return new Response();
        }
    }),
});
/**
 * Legacy webhook handler for media creation
 */
export const createMediaFromWebhook = httpAction(async (ctx, request) => {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }
    try {
        const body = await request.json();
        const { storageId, externalUrl, title, caption, alt, categories, status } = body;
        if (!storageId && !externalUrl) {
            return new Response(JSON.stringify({
                error: "Either storageId or externalUrl is required",
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
        const mediaId = await ctx.runMutation(api.media.upsertMediaMeta, {
            storageId,
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
    }
    catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
});
// Export the router
export default http;
