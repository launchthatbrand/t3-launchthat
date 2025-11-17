"use client";

import React from "react";
import Link from "next/link";
import { EntityList } from "@/components/shared/EntityList/EntityList";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";

import { Button } from "@acme/ui/button";

import type { ColumnDefinition } from "~/components/shared/EntityList/types";

// TODO: Replace with real user ID from auth context
const OWNER_ID = "system";

export interface VimeoVideo {
  uri: string;
  name: string;
  description: string;
  link: string;
  pictures: { sizes: { link: string }[] };
  folder: string;
}

const getVideoId = (uri: string) => uri.replace("/videos/", "");

export default function VimeoPage() {
  const getCachedVimeoVideos = useAction(
    api.vimeo.actions.getCachedVimeoVideos,
  );
  const [videos, setVideos] = React.useState<VimeoVideo[] | undefined>(
    undefined,
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    getCachedVimeoVideos({ ownerId: OWNER_ID })
      .then((data) => setVideos(data))
      .finally(() => setLoading(false));
  }, [getCachedVimeoVideos]);

  console.log("videos", videos);

  const columns: ColumnDefinition<VimeoVideo>[] = [
    {
      id: "id",
      header: "ID",
      cell: (video: VimeoVideo) => <span>{getVideoId(video.uri)}</span>,
    },
    {
      id: "thumbnail",
      header: "Thumbnail",
      cell: (video: any) =>
        video.pictures?.sizes?.[0]?.link ? (
          <img
            src={video.pictures.sizes[0].link}
            alt={video.name}
            className="h-16 w-28 rounded object-cover"
          />
        ) : null,
    },
    {
      id: "name",
      header: "name",
      cell: (video: VimeoVideo) => <span>{video.name}</span>,
    },
    {
      id: "description",
      header: "Description",
      cell: (video: any) => (
        <span className="line-clamp-2 text-sm text-gray-600">
          {video.description}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (video: any) => (
        <Button asChild>
          <Link href={video.link} target="_blank" rel="noopener noreferrer">
            View on Vimeo
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Vimeo Videos</h1>
      {loading ? (
        <p>Loading Vimeo videos...</p>
      ) : videos === undefined ? (
        <p>Loading Vimeo videos...</p>
      ) : videos.error ? (
        <p className="text-red-500">{videos.error}</p>
      ) : (
        <EntityList
          data={videos?.data ?? []}
          columns={columns}
          rowKey={(video: VimeoVideo) => getVideoId(video.uri)}
          className="mt-6"
          emptyMessage="No Vimeo videos found. Make sure your Vimeo connection is set up and synced."
        />
      )}
    </div>
  );
}
