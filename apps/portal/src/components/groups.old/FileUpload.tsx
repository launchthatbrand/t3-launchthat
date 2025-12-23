"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { FileIcon, ImageIcon, UploadIcon } from "lucide-react";

import { Button } from "@acme/ui/button";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";

interface FileUploadProps {
  onFileUploaded: (fileData: {
    url: string;
    type: "image" | "video" | "file";
    name?: string;
    size?: number;
  }) => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get file upload mutation from Convex
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Handle file selection
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Get a URL for uploading the file to Convex storage
      const uploadUrl = await generateUploadUrl();

      // Determine file type
      const fileType = getFileType(file);

      // Simulate upload progress (this is just for UI feedback)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload the file to Convex
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get the URL of the uploaded file
      const { storageId } = await response.json();
      const url = `${window.location.origin}/api/files/${storageId}`;

      // Call the callback with the file information
      onFileUploaded({
        url,
        type: fileType,
        name: file.name,
        size: file.size,
      });

      // Clear the input field
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to determine file type
  const getFileType = (file: File): "image" | "video" | "file" => {
    if (file.type.startsWith("image/")) {
      return "image";
    } else if (file.type.startsWith("video/")) {
      return "video";
    } else {
      return "file";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed">
        <CardContent className="pb-6 pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <UploadIcon size={40} className="text-muted-foreground" />
          </div>
          <CardDescription className="mb-2">
            {isUploading
              ? `Uploading... ${uploadProgress}%`
              : "Drop files here or click to upload"}
          </CardDescription>
          <div className="mt-4">
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <Button
                  variant="outline"
                  className="flex h-20 w-20 flex-col items-center justify-center p-2"
                  disabled={isUploading}
                  onClick={() => {
                    document.getElementById("image-upload")?.click();
                  }}
                >
                  <ImageIcon className="mb-1 h-8 w-8" />
                  <span className="text-xs">Images</span>
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              <div className="text-center">
                <Button
                  variant="outline"
                  className="flex h-20 w-20 flex-col items-center justify-center p-2"
                  disabled={isUploading}
                  onClick={() => {
                    document.getElementById("file-upload")?.click();
                  }}
                >
                  <FileIcon className="mb-1 h-8 w-8" />
                  <span className="text-xs">Files</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 h-2.5 w-full rounded-full bg-muted">
              <div
                className="h-2.5 rounded-full bg-primary"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <div className="mt-2 text-xs text-muted-foreground">
            Max file size: 10MB
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
