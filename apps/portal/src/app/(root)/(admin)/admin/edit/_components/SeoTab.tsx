"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import { ATTACHMENTS_META_KEY } from "~/lib/posts/metaKeys";
import { SEO_META_KEYS } from "~/lib/seo/constants";
import type { AdminMetaBoxContext, CustomFieldValue } from "./types";

const coerceString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
};

const coerceBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "no" ||
      normalized === ""
    ) {
      return false;
    }
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return false;
};

const clamp = (value: string, max: number) =>
  value.length > max ? value.slice(0, max) : value;

type AttachmentMetaEntry = {
  url?: string;
  alt?: string;
  mimeType?: string;
};

const isLikelyImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url);

const isLikelyImageAttachment = (entry: AttachmentMetaEntry): boolean => {
  const mime = typeof entry.mimeType === "string" ? entry.mimeType : "";
  if (mime.startsWith("image/")) return true;
  const url = typeof entry.url === "string" ? entry.url : "";
  return isLikelyImageUrl(url);
};

const extractFirstImageAttachmentFromMeta = (
  raw: unknown,
): { url: string; alt?: string } | null => {
  const value = coerceString(raw).trim();
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const entry = item as AttachmentMetaEntry;
      if (typeof entry.url !== "string" || !entry.url.trim()) continue;
      if (!isLikelyImageAttachment(entry)) continue;
      return {
        url: entry.url,
        alt: typeof entry.alt === "string" && entry.alt.trim() ? entry.alt : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
};

const extractHostLabel = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//i, "").split("/")[0] ?? url;
  }
};

export function SeoTab({
  context,
  post,
}: {
  context: AdminMetaBoxContext;
  post?: Doc<"posts"> | null;
}) {
  const get = context.getMetaValue;
  const set = context.setMetaValue;

  const seoTitle = coerceString(get(SEO_META_KEYS.title));
  const seoDescription = coerceString(get(SEO_META_KEYS.description));
  const seoCanonical = coerceString(get(SEO_META_KEYS.canonical));
  const seoNoindex = coerceBoolean(get(SEO_META_KEYS.noindex));
  const seoNofollow = coerceBoolean(get(SEO_META_KEYS.nofollow));

  const fallbackTitle = context.general?.title ?? post?.title ?? "";
  const fallbackDescription =
    context.general?.excerpt ?? post?.excerpt ?? post?.content ?? "";

  const effectiveTitle = seoTitle.trim() || fallbackTitle.trim();
  const effectiveDescription = seoDescription.trim() || fallbackDescription;

  const snippetTitle = clamp(effectiveTitle, 70);
  const snippetDescription = clamp(
    effectiveDescription.replace(/\s+/g, " ").trim(),
    160,
  );

  useEffect(() => {
    if (!context.registerMetaPayloadCollector) {
      return;
    }

    const unregister = context.registerMetaPayloadCollector(() => {
      const payload: Record<string, CustomFieldValue> = {};

      const title = coerceString(get(SEO_META_KEYS.title)).trim();
      const description = coerceString(get(SEO_META_KEYS.description)).trim();
      const canonical = coerceString(get(SEO_META_KEYS.canonical)).trim();
      const noindex = coerceBoolean(get(SEO_META_KEYS.noindex));
      const nofollow = coerceBoolean(get(SEO_META_KEYS.nofollow));

      payload[SEO_META_KEYS.title] = title;
      payload[SEO_META_KEYS.description] = description;
      payload[SEO_META_KEYS.canonical] = canonical;
      payload[SEO_META_KEYS.noindex] = noindex;
      payload[SEO_META_KEYS.nofollow] = nofollow;

      return payload;
    });

    return unregister;
  }, [context, get]);

  const previewUrl = useMemo(() => {
    const defaultPreview = coerceString(context.general?.slugPreviewUrl);
    if (seoCanonical.trim()) {
      return seoCanonical.trim();
    }
    return defaultPreview;
  }, [context.general?.slugPreviewUrl, seoCanonical]);

  const [previewTab, setPreviewTab] = useState<
    "google" | "twitter" | "facebook" | "linkedin"
  >("google");

  const selectedOgImage = useMemo(() => {
    // Prefer the live attachments context (includes unsaved reordering/selection),
    // otherwise fall back to parsing the stored meta string.
    const attachments = context.attachmentsContext?.attachments ?? [];
    for (const attachment of attachments) {
      if (typeof attachment.url !== "string" || !attachment.url.trim()) {
        continue;
      }
      if (
        (typeof attachment.mimeType === "string" &&
          attachment.mimeType.startsWith("image/")) ||
        isLikelyImageUrl(attachment.url)
      ) {
        return {
          url: attachment.url,
          alt:
            typeof attachment.alt === "string" && attachment.alt.trim()
              ? attachment.alt
              : undefined,
        };
      }
    }

    // If we can't confidently detect an image (mimeType missing + signed URLs without extensions),
    // still try the first attachment URL for preview. The <img> will gracefully fail if non-image.
    const firstUrl =
      typeof attachments[0]?.url === "string" ? attachments[0]?.url?.trim() : "";
    if (firstUrl) {
      return { url: firstUrl };
    }

    return extractFirstImageAttachmentFromMeta(get(ATTACHMENTS_META_KEY));
  }, [context.attachmentsContext?.attachments, get]);

  const [previewImageErrored, setPreviewImageErrored] = useState(false);

  const hostLabel = useMemo(() => {
    return previewUrl ? extractHostLabel(previewUrl) : "yourdomain.com";
  }, [previewUrl]);

  return (
    <div className="container space-y-6 py-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center justify-between gap-2">
            SEO
            <Badge variant="secondary">Per-page</Badge>
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Control search snippets, Open Graph, and indexing behavior for this
            page.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seo-title">SEO Title</Label>
              <Input
                id="seo-title"
                value={seoTitle}
                onChange={(event) => set(SEO_META_KEYS.title, event.target.value)}
                placeholder="Leave blank to use the post title"
              />
              <p className="text-muted-foreground text-xs">
                Recommended: 50–60 characters (hard limit ~70).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo-canonical">Canonical URL (optional)</Label>
              <Input
                id="seo-canonical"
                value={seoCanonical}
                onChange={(event) =>
                  set(SEO_META_KEYS.canonical, event.target.value)
                }
                placeholder="https://example.com/path or /path"
              />
              <p className="text-muted-foreground text-xs">
                Leave blank to use the computed canonical permalink.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo-description">Meta Description</Label>
            <Textarea
              id="seo-description"
              rows={4}
              value={seoDescription}
              onChange={(event) =>
                set(SEO_META_KEYS.description, event.target.value)
              }
              placeholder="Leave blank to use the excerpt (or fall back to content)"
            />
            <p className="text-muted-foreground text-xs">
              Recommended: 140–160 characters.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-md border p-4">
              <Switch
                checked={seoNoindex}
                onCheckedChange={(checked) => set(SEO_META_KEYS.noindex, checked)}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">Noindex</p>
                <p className="text-muted-foreground text-sm">
                  Discourage search engines from indexing this page.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border p-4">
              <Switch
                checked={seoNofollow}
                onCheckedChange={(checked) =>
                  set(SEO_META_KEYS.nofollow, checked)
                }
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">Nofollow</p>
                <p className="text-muted-foreground text-sm">
                  Discourage search engines from following links on this page.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Preview</p>
              <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="google">Google</TabsTrigger>
                  <TabsTrigger value="twitter">X</TabsTrigger>
                  <TabsTrigger value="facebook">Facebook</TabsTrigger>
                  <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)}>
              <TabsContent value="google" className="mt-0">
                <div className="space-y-1">
                  <div className="text-primary text-base font-semibold">
                    {snippetTitle || "Untitled"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {previewUrl || "(Preview URL will appear after saving)"}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {snippetDescription || "No description set."}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="twitter" className="mt-0">
                <div className="bg-background overflow-hidden rounded-md border">
                  <div className="bg-muted relative aspect-[16/9] w-full">
                    {selectedOgImage?.url && !previewImageErrored ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedOgImage.url}
                        alt={selectedOgImage.alt ?? "Social preview image"}
                        className="h-full w-full object-cover"
                        onError={() => setPreviewImageErrored(true)}
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-muted-foreground text-xs uppercase">
                      {hostLabel}
                    </p>
                    <p className="text-sm font-medium">
                      {snippetTitle || "Untitled"}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {snippetDescription || "No description set."}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="facebook" className="mt-0">
                <div className="bg-background overflow-hidden rounded-md border">
                  <div className="bg-muted relative aspect-[1.91/1] w-full">
                    {selectedOgImage?.url && !previewImageErrored ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedOgImage.url}
                        alt={selectedOgImage.alt ?? "Social preview image"}
                        className="h-full w-full object-cover"
                        onError={() => setPreviewImageErrored(true)}
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 bg-muted/30 p-3">
                    <p className="text-muted-foreground text-xs uppercase">
                      {hostLabel}
                    </p>
                    <p className="text-sm font-semibold">
                      {snippetTitle || "Untitled"}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {snippetDescription || "No description set."}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="linkedin" className="mt-0">
                <div className="bg-background overflow-hidden rounded-md border">
                  <div className="bg-muted relative aspect-[16/9] w-full">
                    {selectedOgImage?.url && !previewImageErrored ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedOgImage.url}
                        alt={selectedOgImage.alt ?? "Social preview image"}
                        className="h-full w-full object-cover"
                        onError={() => setPreviewImageErrored(true)}
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-medium">
                      {snippetTitle || "Untitled"}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {snippetDescription || "No description set."}
                    </p>
                    <p className="text-muted-foreground text-xs">{hostLabel}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Title: {effectiveTitle.length}/70</Badge>
              <Badge variant="outline">
                Description:{" "}
                {effectiveDescription.replace(/\s+/g, " ").trim().length}/160
              </Badge>
              <Badge variant="outline">OG image: First attachment image</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


