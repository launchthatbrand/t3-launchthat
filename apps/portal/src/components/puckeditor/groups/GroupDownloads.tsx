"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { api } from "@/convex/_generated/api";
import { formatBytes } from "@/lib/utils";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Download,
  FileArchive,
  FileCode,
  FileIcon,
  FileImage,
  File as FilePdf,
  FileSpreadsheet,
  FileText,
  PlusCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

interface GroupDownloadsProps {
  title?: string;
  groupId?: Id<"groups">;
  maxDownloads?: number;
  showUploaders?: boolean;
  showAddButton?: boolean;
}

// This interface should match the structure returned by the Convex query
interface DownloadFile {
  _id: Id<"downloads">;
  _creationTime: number;
  filename: string;
  contentType?: string;
  size?: number;
  uploader?: {
    name?: string;
    image?: string;
  } | null;
  // Add any other fields that might be in the Convex result
  isPublic?: boolean;
  uploadedBy?: Id<"users"> | null;
}

// Function to get the appropriate file icon based on type
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();

  if (type.includes("image")) return FileImage;
  if (type.includes("pdf")) return FilePdf;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
    return FileArchive;
  if (type.includes("excel") || type.includes("sheet") || type.includes("csv"))
    return FileSpreadsheet;
  if (
    type.includes("html") ||
    type.includes("javascript") ||
    type.includes("css") ||
    type.includes("json")
  )
    return FileCode;
  if (type.includes("text") || type.includes("doc")) return FileText;

  return FileIcon;
};

export function GroupDownloads({
  title = "Downloads",
  groupId,
  maxDownloads = 5,
  showUploaders = true,
  showAddButton = true,
}: GroupDownloadsProps) {
  // Query downloads with explicit typing
  const downloads =
    useQuery<DownloadFile[] | undefined>(
      api.downloads.getGroupDownloads,
      groupId
        ? {
            groupId,
            limit: maxDownloads,
          }
        : "skip",
    ) ?? [];

  // If no group is selected, show placeholder
  if (!groupId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileIcon className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Please select a group in edit mode.
        </CardContent>
      </Card>
    );
  }

  // If no downloads are available yet, show appropriate message
  if (!downloads.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileIcon className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <FileIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium">No files yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload files to share with group members
          </p>
        </CardContent>
        {showAddButton && (
          <CardFooter>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileIcon className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {downloads.map((file: DownloadFile) => {
            const FileTypeIcon = getFileIcon(file.contentType ?? "");

            return (
              <div
                key={file._id}
                className="flex items-start border-b pb-4 last:border-0"
              >
                <div className="mr-3 rounded-md bg-muted p-2">
                  <FileTypeIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{file.filename}</div>
                  <div className="mt-1 flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>{formatDistanceToNow(file._creationTime)} ago</span>
                    <span className="mx-2">•</span>
                    <span>{formatBytes(file.size ?? 0)}</span>
                  </div>

                  {showUploaders && file.uploader && (
                    <div className="mt-2 flex items-center">
                      <Avatar className="mr-1 h-5 w-5">
                        {file.uploader.image && (
                          <AvatarImage
                            src={file.uploader.image}
                            alt={file.uploader.name ?? "User"}
                          />
                        )}
                        <AvatarFallback>
                          {file.uploader.name?.[0] ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{file.uploader.name}</span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
      {showAddButton && (
        <CardFooter>
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
