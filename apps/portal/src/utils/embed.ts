/* eslint-disable @typescript-eslint/require-await */
"use server";

/**
 * Utility functions for generating embed URLs and HTML
 */

interface GenerateEmbedUrlOptions {
  page: string;
  params?: Record<string, string>;
  baseUrl?: string;
}

interface GenerateEmbedHtmlOptions {
  url: string;
  width?: string;
  height?: string;
  title?: string;
  allowFullscreen?: boolean;
}

/**
 * Generates a URL for embedding a page
 */
 
export async function generateEmbedUrl({
  page,
  params = {},
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: GenerateEmbedUrlOptions): string {
  // Create the URL
  const url = new URL(page.startsWith("/") ? page : `/${page}`, baseUrl);

  // Add parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return url.toString();
}

/**
 * Generates HTML code for an iframe
 */
export async function generateEmbedHtml({
  url,
  width = "100%",
  height = "600px",
  title = "Portal Embed",
  allowFullscreen = true,
}: GenerateEmbedHtmlOptions): string {
  return `<iframe 
  src="${url}" 
  width="${width}" 
  height="${height}" 
  title="${title}"
  frameborder="0" 
  ${allowFullscreen ? "allowfullscreen" : ""}
  style="border: none; max-width: 100%;"
></iframe>`;
}

/**
 * Generates Monday.com specific embed code
 */
export async function generateMondayEmbedCode({
  boardId = "",
  workspaceId = "",
  width = "100%",
  height = "600px",
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: {
  boardId?: string;
  workspaceId?: string;
  width?: string;
  height?: string;
  baseUrl?: string;
}): { url: string; html: string } {
  // Build parameters
  const params: Record<string, string> = {};
  if (boardId) params.boardId = boardId;
  if (workspaceId) params.workspaceId = workspaceId;

  // Generate URL
  const url = generateEmbedUrl({
    page: "/embed/monday",
    params,
    baseUrl,
  });

  // Generate HTML
  const html = generateEmbedHtml({
    url,
    width,
    height,
    title: "Portal in Monday.com",
  });

  return { url, html };
}
