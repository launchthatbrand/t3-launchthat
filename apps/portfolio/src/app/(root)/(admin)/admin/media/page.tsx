"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileUpload } from "@/components/groups/FileUpload";
import {
  ColumnDefinition,
  EntityList,
  FilterValue,
} from "@/components/shared/EntityList/EntityList";
import { api } from "@convex-config/_generated/api";
import { useAction, useQuery } from "convex/react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Tabs, TabsContent } from "@acme/ui/tabs";

import type { VimeoVideo } from "./vimeo/page";

type MediaItem = Doc<"mediaItems"> & { url?: string | null };
const OWNER_ID = "system";

const MediaLibraryPage: React.FC = () => {
  // Fetch media categories
  // const categories = useQuery(api.categories.queries.listCategoriesByPostType, {
  //   postType: "media",
  // });
  // // Track selected category tab
  // const [selectedCategory, setSelectedCategory] = useState<string | null>(
  //   "all",
  // );

  // Determine the active categoryId
  // const activeCategory =
  //   selectedCategory === "all"
  //     ? null
  //     : categories && categories.length > 0
  //       ? (categories.find((cat) => cat._id === selectedCategory) ??
  //         categories[0])
  //       : null;

  // Fetch images for the selected category (if images have categoryId)
  // const images = useQuery(
  //   api.media.queries.listMedia,
  //   selectedCategory && selectedCategory !== "all" && activeCategory
  //     ? { categoryId: activeCategory._id }
  //     : {},
  // );
  // const vimeoVideos = useQuery(api.vimeo.queries.listVideos, {});

  // Handle tab change
  // const handleTabChange = (value: string) => {
  //   setSelectedCategory(value);
  // };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Media Library</h1>
      <MediaLibrary />
    </div>
  );
};

export interface MediaLibraryProps {
  mode?: "view" | "select";
  onSelect?: (item: MediaItem) => void;
  selectedId?: string | null;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  mode = "view",
  onSelect: _onSelect,
  selectedId: _selectedId,
}) => {
  // Fetch media categories
  const categories = useQuery(
    api.core.categories.queries.listCategoriesByPostType,
    {
      postType: "media",
    },
  );
  // Track selected category tab
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    "all",
  );

  // Determine the active categoryId
  const activeCategory =
    selectedCategory === "all"
      ? null
      : categories && categories.length > 0
        ? (categories.find((cat) => cat._id === selectedCategory) ??
          categories[0])
        : null;

  // Fetch images for the selected category (if images have categoryId)
  const mediaItems = useQuery(
    api.media.queries.listMediaItemsWithUrl,
    selectedCategory && selectedCategory !== "all" && activeCategory
      ? {
          paginationOpts: { numItems: 50, cursor: null },
          categoryIds: [activeCategory._id],
        }
      : { paginationOpts: { numItems: 50, cursor: null } },
  );

  // Suppress potential type generation mismatch using any cast
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const getCachedVimeoVideos = useAction(
    api.vimeo.actions.getCachedVimeoVideos,
  );
  const [vimeoVideos, setVimeoVideos] = React.useState<
    VimeoVideo[] | undefined
  >(undefined);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    void getCachedVimeoVideos({ ownerId: OWNER_ID })
      .then((data) => setVimeoVideos(data))
      .finally(() => setLoading(false));
  }, [getCachedVimeoVideos]);

  console.log("videos", vimeoVideos);

  const columns: ColumnDefinition<MediaItem>[] = [
    {
      id: "thumbnail",
      header: "Thumbnail",
      cell: (media: MediaItem) =>
        media.url ? (
          <Image
            src={media.url ?? ""}
            alt={media.title ?? ""}
            width={100}
            height={100}
            className="h-16 w-28 rounded object-contain"
          />
        ) : null,
    },
    {
      id: "name",
      header: "name",
      cell: (media: MediaItem) => <span>{media.title}</span>,
    },
    {
      id: "description",
      header: "Description",
      cell: (media: MediaItem) => (
        <span className="line-clamp-2 text-sm text-gray-600">
          {media.caption}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (media: MediaItem) =>
        mode === "select" ? (
          <Button variant="outline" onClick={() => _onSelect?.(media)}>
            Select
          </Button>
        ) : (
          <Button asChild>
            <Link
              href={media.externalUrl ?? ""}
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </Link>
          </Button>
        ),
    },
  ];
  // const vimeoVideos = useQuery(api.vimeo.queries.listVideos, {});

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedCategory(value);
  };

  const [filters, setFilters] = useState<Record<string, FilterValue>>({});

  // const handleOnFiltersChange = (filters: Record<string, FilterValue>) => {
  //   setFilters(filters);
  //   console.log("[MediaPage] onFiltersChange", filters);
  // };

  const isVimeoTab = filters.category === "vimeo";
  console.log("[MediaPage] isVimeoTab", isVimeoTab);
  const dataPage = mediaItems ? mediaItems.page : undefined;
  const items: MediaItem[] = (dataPage as unknown as MediaItem[]) ?? [];
  console.log("[MediaPage] entityListData", items);

  const vimeoTabHook = {
    id: "vimeo",
    label: "Vimeo",
    onActivate: () => {
      console.log("vimeoVideos", vimeoVideos);

      return {
        data: (vimeoVideos?.data ?? []).map(mapVimeoToMediaItem),
      };
    },
  } as const;

  return (
    <div className="container h-auto w-full py-8">
      {/* Upload */}
      {mode === "view" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload New Media</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onFileUploaded={() => console.log("File uploaded")} />
          </CardContent>
        </Card>
      )}

      {categories === undefined ? (
        "Loading..."
      ) : (
        <Tabs value={selectedCategory ?? "all"} onValueChange={handleTabChange}>
          <EntityList
            data={items}
            columns={columns}
            className="mt-6"
            defaultViewMode="grid"
            filterType="tabs"
            isLoading={loading}
            tabOptions={categories.map((cat) => ({
              label: cat.name,
              value: String(cat._id),
            }))}
            tabHooks={[vimeoTabHook]}
            tabFilterKey="category"
            // onFiltersChange={handleOnFiltersChange}
          />
          {categories.map((cat) => (
            <TabsContent key={cat._id} value={String(cat._id)}></TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default MediaLibraryPage;

// Utility to map a Vimeo video object to our MediaItem shape
const mapVimeoToMediaItem = (video: VimeoVideo): MediaItem => {
  return {
    // Generate a stable pseudo id based on vimeo id or fallback to uuid
    _id: (video.uri ?? video.link ?? uuidv4()) as unknown as MediaItem["_id"],
    _creationTime: 0, // not available, fallback 0
    title: video.name,
    caption: video.description,
    url: video.link ?? null,
    externalUrl: video.link,
    // other MediaItem fields we don't have
    categoryId: null,
    fileId: null,
    mimeType: null,
    size: null,
  } as MediaItem;
};
