"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import Image from "next/image";
import { useMemo } from "react";

interface VimeoVideo {
  id: string;
  title: string;
  status: "published" | "draft";
  duration: string;
  views: string;
  updatedAt: string;
  thumbnail: string;
}

const MOCK_VIDEOS: VimeoVideo[] = [
  {
    id: "vid_1",
    title: "Launch Trailer – Winter Cohort",
    status: "published",
    duration: "02:41",
    views: "4.1K",
    updatedAt: "3 hours ago",
    thumbnail:
      "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?q=80",
  },
  {
    id: "vid_2",
    title: "Session 01 – Welcome and onboarding",
    status: "published",
    duration: "18:22",
    views: "1.9K",
    updatedAt: "1 day ago",
    thumbnail:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80",
  },
  {
    id: "vid_3",
    title: "Building your audience with Shorts",
    status: "draft",
    duration: "11:04",
    views: "—",
    updatedAt: "Saved 4 days ago",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80",
  },
  {
    id: "vid_4",
    title: "Founder AMA – March replay",
    status: "published",
    duration: "42:09",
    views: "6.7K",
    updatedAt: "1 week ago",
    thumbnail:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80",
  },
  {
    id: "vid_5",
    title: "Product walkthrough – Portal 2.0",
    status: "published",
    duration: "25:10",
    views: "9.3K",
    updatedAt: "2 weeks ago",
    thumbnail:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80",
  },
];

const columns: ColumnDefinition<VimeoVideo>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: "Title",
    cell: (item: VimeoVideo) => (
      <div className="flex flex-col">
        <span className="font-medium">{item.title}</span>
        <span className="text-muted-foreground text-xs">
          Updated {item.updatedAt}
        </span>
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: (item: VimeoVideo) => (
      <Badge variant={item.status === "published" ? "default" : "secondary"}>
        {item.status}
      </Badge>
    ),
  },
  {
    id: "duration",
    accessorKey: "duration",
    header: "Duration",
  },
  {
    id: "views",
    header: "Views",
    cell: (item: VimeoVideo) => item.views,
  },
];

export function VimeoLibrary() {
  const data = useMemo(() => MOCK_VIDEOS, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Vimeo Library</h2>
          <p className="text-muted-foreground text-sm">
            Browse the latest uploads from your connected Vimeo workspace.
          </p>
        </div>
        <Button variant="default">Connect Vimeo</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
          <CardDescription>
            These videos are mocked for now. Replace with the Vimeo API response
            once credentials are available.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EntityList
            data={data}
            columns={columns}
            enableSearch
            isLoading={false}
            enableFooter={false}
            viewModes={["grid", "list"]}
            defaultViewMode="grid"
            gridColumns={{ sm: 2, md: 3 }}
            className="p-4"
            itemRender={(item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge
                        variant={
                          item.status === "published" ? "default" : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>{item.duration}</span>
                      <span>{item.views === "—" ? "0 views" : item.views}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Updated {item.updatedAt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
