"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MediaForm, MediaFormValues } from "@/components/MediaForm";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

export default function MediaItemPage() {
  const params = useParams();
  const mediaId = params.mediaId as string | undefined;

  const media = useQuery(
    api.media.index.getImageById,
    mediaId ? { id: mediaId as any } : "skip",
  );

  const upsertMeta = useMutation(api.media.index.upsertMediaMeta);

  const categories = [
    { value: "general", label: "General" },
    { value: "featured", label: "Featured" },
  ];

  if (media === undefined) return <div>Loading...</div>;
  if (media === null) return <div>Media not found.</div>;

  return (
    <div className="container py-8">
      <Link
        href="/admin/media"
        className="mb-4 inline-block text-sm text-primary"
      >
        &larr; Back to Media Library
      </Link>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Media Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Image
            src={media.url}
            alt={media.url}
            width={600}
            height={600}
            className="mb-4 rounded"
          />
          <p className="text-sm text-muted-foreground">
            Content Type: {media.contentType ?? "Unknown"}
          </p>
          <p className="text-sm text-muted-foreground">
            Size: {(media.size / 1024).toFixed(2)} KB
          </p>
        </CardContent>
      </Card>

      <MediaForm
        initialData={{
          title: media.title ?? "",
          caption: media.caption ?? "",
          alt: media.alt ?? "",
          categories: media.categories ?? [],
          status: (media.status ?? "draft") as "draft" | "published",
        }}
        categories={categories}
        isSubmitting={false}
        onSubmit={async (values: MediaFormValues) => {
          try {
            await upsertMeta({
              storageId: media._id as any,
              ...values,
            });
            toast.success("Media saved!");
          } catch (e) {
            console.error(e);
            toast.error("Failed to save media");
          }
        }}
      />
    </div>
  );
}
