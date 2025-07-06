"use client";

import React from "react";
import Image from "next/image";
import { FileUpload } from "@/components/groups/FileUpload";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

const MediaLibraryPage: React.FC = () => {
  const images = useQuery(api.media.index.listImages, {});
  const vimeoVideos = useQuery(api.vimeo.queries.listVideos, {});

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Media Library</h1>

      {/* Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload New Media</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload onFileUploaded={() => {}} />
        </CardContent>
      </Card>

      <Tabs defaultValue="images">
        <TabsList>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          {images ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {images.map((img) => (
                <div
                  key={img._id}
                  className="group relative w-full overflow-hidden rounded-md border"
                >
                  <Image
                    src={img.url}
                    alt={img.url}
                    width={300}
                    height={300}
                    className="h-auto w-full object-cover"
                  />
                  <a
                    href={`/admin/media/${img._id}`}
                    className="absolute right-2 top-2 hidden rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-md transition-opacity group-hover:inline"
                  >
                    Edit
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading media...</p>
          )}
        </TabsContent>

        <TabsContent value="vimeo">
          {vimeoVideos ? (
            vimeoVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                {vimeoVideos.map((vid) => (
                  <div
                    key={vid._id}
                    className="group relative w-full overflow-hidden rounded-md border"
                  >
                    {vid.thumbnailUrl ? (
                      <Image
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        width={300}
                        height={300}
                        className="h-auto w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[200px] items-center justify-center text-xs">
                        {vid.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No Vimeo videos synced yet.</p>
            )
          ) : (
            <p>Loading Vimeo videos...</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaLibraryPage;
