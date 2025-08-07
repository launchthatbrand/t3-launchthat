"use client";

import { Card, CardContent } from "@acme/ui/card";
import { FileImage, MoveDown, MoveUp, Star, Upload, X } from "lucide-react";
import React, { useCallback, useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Progress } from "@acme/ui/progress";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useMutation } from "convex/react";

export interface ProductImage {
  storageId?: Id<"_storage">;
  url: string;
  alt?: string;
  position?: number;
  isPrimary?: boolean;
  id?: string;
  name?: string;
  size?: number;
}

interface FeaturedImagesUploadProps {
  onImageAdded: (image: ProductImage) => void;
  onImageRemoved?: (index: number) => void;
  onImageUpdated?: (index: number, updatedImage: Partial<ProductImage>) => void;
  images: ProductImage[];
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

export const FeaturedImagesUpload: React.FC<FeaturedImagesUploadProps> = ({
  onImageAdded,
  onImageRemoved,
  onImageUpdated,
  images,
  maxFiles = 5,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxFileSize = 5 * 1024 * 1024, // 5MB
}) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [isDragOver, setIsDragOver] = useState(false);

  // Convex mutations
  const generateUploadUrl = useMutation(
    api.ecommerce.products.uploads.generateUploadUrl,
  );
  const saveProductImage = useMutation(
    api.ecommerce.products.uploads.saveProductImage,
  );
  const deleteProductImage = useMutation(
    api.ecommerce.products.uploads.deleteProductImage,
  );

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedFileTypes.join(", ")}`;
    }
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }
    if (images.length >= maxFiles) {
      return `Maximum ${maxFiles} images allowed`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const uploadId = Math.random().toString(36).substring(7);

      try {
        setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }));

        // Step 1: Generate upload URL
        const uploadUrl = await generateUploadUrl();

        setUploadProgress((prev) => ({ ...prev, [uploadId]: 25 }));

        // Step 2: Upload file to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        const { storageId } = await uploadResponse.json();
        setUploadProgress((prev) => ({ ...prev, [uploadId]: 75 }));

        // Step 3: Save image metadata
        const imageData = await saveProductImage({
          storageId,
          alt: file.name.split(".")[0],
          position: images.length,
          isPrimary: images.length === 0, // First image is primary by default
        });

        setUploadProgress((prev) => ({ ...prev, [uploadId]: 100 }));

        // Step 4: Add to images list
        onImageAdded({
          ...imageData,
          name: file.name,
          size: file.size,
        });

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        // Remove progress after a delay
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[uploadId];
            return newProgress;
          });
        }, 1000);
      }
    },
    [generateUploadUrl, saveProductImage, onImageAdded, images.length],
  );

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
          continue;
        }

        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleRemoveImage = async (index: number) => {
    const image = images[index];
    if (image?.storageId) {
      try {
        await deleteProductImage({ storageId: image.storageId });
        toast.success("Image deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete image");
        return;
      }
    }

    if (onImageRemoved) {
      onImageRemoved(index);
    }
  };

  const handleUpdateImage = (index: number, updates: Partial<ProductImage>) => {
    if (onImageUpdated) {
      onImageUpdated(index, updates);
    }
  };

  const handleSetPrimary = (index: number) => {
    // Set this image as primary and others as not primary
    images.forEach((_, i) => {
      if (onImageUpdated) {
        onImageUpdated(i, { isPrimary: i === index });
      }
    });
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    // Update positions
    if (onImageUpdated) {
      onImageUpdated(index, { position: newIndex });
      onImageUpdated(newIndex, { position: index });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <FileImage className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <Label htmlFor="file-upload" className="cursor-pointer">
            <span className="font-medium text-primary hover:underline">
              Click to upload
            </span>
            <span className="text-gray-500"> or drag and drop</span>
          </Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            accept={acceptedFileTypes.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          PNG, JPG, WebP or GIF up to {Math.round(maxFileSize / 1024 / 1024)}MB
          (Max {maxFiles} images)
        </p>

        {/* Upload Progress */}
        {Object.entries(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id}>
                <Progress value={progress} className="w-full" />
                <p className="mt-1 text-xs text-gray-500">
                  Uploading... {progress}%
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <Card
              key={image.storageId || image.url}
              className="overflow-hidden"
            >
              <div className="relative">
                <img
                  src={image.url}
                  alt={image.alt || `Product image ${index + 1}`}
                  className="h-48 w-full object-cover"
                />

                {/* Image Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(index)}
                    disabled={image.isPrimary}
                  >
                    <Star
                      className={`h-4 w-4 ${image.isPrimary ? "fill-yellow-400 text-yellow-400" : ""}`}
                    />
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, "up")}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, "down")}
                    disabled={index === images.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Primary Badge */}
                {image.isPrimary && (
                  <Badge className="absolute left-2 top-2" variant="default">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Primary
                  </Badge>
                )}

                {/* Position Badge */}
                <Badge className="absolute right-2 top-2" variant="secondary">
                  {index + 1}
                </Badge>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <Label
                      htmlFor={`alt-${index}`}
                      className="text-sm font-medium"
                    >
                      Alt Text
                    </Label>
                    <Input
                      id={`alt-${index}`}
                      value={image.alt || ""}
                      onChange={(e) =>
                        handleUpdateImage(index, { alt: e.target.value })
                      }
                      placeholder="Describe this image..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{image.name}</span>
                    {image.size && (
                      <span>{Math.round(image.size / 1024)} KB</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="py-8 text-center">
          <FileImage className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};
