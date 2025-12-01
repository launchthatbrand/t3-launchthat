import { useCallback, useState } from "react";
import { FileImage, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";

// Note: api.files.generateUploadUrl may not exist yet - this would be implemented in a real app
// For a mock implementation, we'll simulate the upload process
// import { api } from "@portal/convex/_generated/api";

export interface MediaItem {
  url: string;
  type: "image" | "video" | "file";
  name?: string;
  size?: number;
  id?: string;
}

interface MediaUploadProps {
  onMediaAdded: (media: MediaItem) => void;
  onMediaRemoved?: (index: number) => void;
  mediaItems: MediaItem[];
  maxFiles?: number;
}

export function MediaUpload({
  onMediaAdded,
  onMediaRemoved,
  mediaItems,
  maxFiles = 4,
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // In a real implementation, we would use Convex mutation:
  // const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Mock implementation for demonstration purposes
  const generateUploadUrl = async () => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return "https://mock-upload-url.example.com";
  };

  // Handle file upload process
  const uploadFile = async (file: File) => {
    if (mediaItems.length >= maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Get upload URL from mock function
      // In a real implementation, this URL would be used to upload the file
      await generateUploadUrl();

      // Simulate progress (this would be replaced with actual upload progress in production)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // In a real implementation, we would upload to Convex
      // For mock purposes, we'll simulate a successful upload
      await new Promise((resolve) => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create a mock storage ID and URL
      const storageId = `mock-${Date.now()}`;
      const fileUrl = URL.createObjectURL(file);

      // Determine file type
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "file";

      // Notify parent component
      onMediaAdded({
        url: fileUrl,
        type: fileType,
        name: file.name,
        size: file.size,
        id: storageId,
      });

      // Reset upload state
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void uploadFile(file);

    // Reset input
    event.target.value = "";
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      void uploadFile(file);
    },
    [mediaItems, maxFiles],
  );

  // Handle image remove
  const handleRemoveMedia = (index: number) => {
    if (onMediaRemoved) {
      onMediaRemoved(index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Upload
            size={36}
            className={`mb-2 ${
              dragActive ? "text-primary" : "text-muted-foreground"
            }`}
          />

          <p className="mb-1 text-sm font-medium">
            {isUploading
              ? "Uploading..."
              : "Drag and drop files here or click to browse"}
          </p>

          <p className="text-muted-foreground text-xs">
            Supported formats: JPEG, PNG, GIF, MP4 (Max {maxFiles} files)
          </p>

          {isUploading && (
            <div className="mt-4 w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="mt-1 text-center text-xs">{uploadProgress}%</p>
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("media-upload")?.click()}
              disabled={isUploading || mediaItems.length >= maxFiles}
            >
              <FileImage className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
            <input
              id="media-upload"
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={isUploading || mediaItems.length >= maxFiles}
            />
          </div>
        </CardContent>
      </Card>

      {/* Media preview */}
      {mediaItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected media:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {mediaItems.map((media, index) => (
              <div key={index} className="group relative">
                <div className="bg-muted relative aspect-video overflow-hidden rounded-md border">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={media.name ?? `Media ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileImage className="text-muted-foreground h-8 w-8" />
                      <span className="text-muted-foreground ml-2 text-xs">
                        {media.name?.substring(0, 15) ?? "File"}
                        {media.name && media.name.length > 15 ? "..." : ""}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="bg-background/80 text-muted-foreground hover:text-destructive absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
