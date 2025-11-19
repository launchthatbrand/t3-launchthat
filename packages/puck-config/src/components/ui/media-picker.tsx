/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Plus, Upload, Video, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Note: Window.wp is declared in global.d.ts
export interface MediaItem {
  id: number;
  url: string;
  type: "image" | "video" | "application/pdf" | "other";
  alt?: string;
  title?: string;
  caption?: string;
  mime?: string;
  width?: number;
  height?: number;
  filename?: string;
}

export interface MediaPickerProps {
  multiple?: boolean;
  allowedTypes?: string[];
  value?: MediaItem[];
  onSelect: (media: MediaItem[]) => void;
  maxItems?: number;
  title?: string;
  buttonText?: string;
  variant?: "button" | "card" | "inline";
  className?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  multiple = false,
  allowedTypes = ["image", "video"],
  value = [],
  onSelect,
  maxItems,
  title = "Select Media",
  buttonText = "Select Media",
  variant = "button",
  className = "",
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    const checkWpMedia = () => {
      if (
        typeof window !== "undefined" &&
        typeof window.wp?.media === "function"
      ) {
        setIsLoaded(true);
        setLoadError(null);
        return;
      }

      setAttemptCount((prev) => prev + 1);

      if (attemptCount >= 30) {
        setLoadError(
          "WordPress media library not available. Please ensure you're in the WordPress admin area or that media scripts are properly loaded."
        );
        return;
      }

      timeoutId = setTimeout(checkWpMedia, 100);
    };

    checkWpMedia();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [attemptCount]);

  const openMediaLibrary = useCallback(() => {
    if (
      !isLoaded ||
      typeof window === "undefined" ||
      typeof window.wp?.media !== "function"
    ) {
      console.error("WordPress media library not available");
      return;
    }

    const mediaFrame = window.wp.media({
      title: title,
      button: {
        text: "Select",
      },
      multiple: multiple,
      library: {
        type: allowedTypes,
      },
    });

    mediaFrame.on("select", () => {
      const selection = mediaFrame.state().get("selection");
      const selectedMedia: MediaItem[] = [];

      selection.each((attachment: any) => {
        const attachmentData = attachment.toJSON();
        let mediaType: MediaItem["type"] = "other";

        if (attachmentData.type === "image") {
          mediaType = "image";
        } else if (
          attachmentData.type === "video" ||
          attachmentData.mime?.startsWith("video/")
        ) {
          mediaType = "video";
        } else if (attachmentData.mime === "application/pdf") {
          mediaType = "application/pdf";
        }

        const mediaItem: MediaItem = {
          id: attachmentData.id,
          url: attachmentData.url,
          type: mediaType,
          alt: attachmentData.alt || attachmentData.title || "",
          title: attachmentData.title || "",
          caption: attachmentData.caption || "",
          mime: attachmentData.mime || "",
          width: attachmentData.width,
          height: attachmentData.height,
          filename: attachmentData.filename || "",
        };
        selectedMedia.push(mediaItem);
      });

      let finalSelection = selectedMedia;
      if (maxItems && selectedMedia.length > maxItems) {
        finalSelection = selectedMedia.slice(0, maxItems);
      }

      let newValue: MediaItem[] = [];
      if (multiple) {
        newValue = [...value, ...finalSelection];
        if (maxItems && newValue.length > maxItems) {
          newValue = newValue.slice(0, maxItems);
        }
      } else {
        newValue = finalSelection;
      }
      onSelect(newValue);
    });

    mediaFrame.open();
  }, [isLoaded, title, multiple, allowedTypes, value, onSelect, maxItems]);

  const removeItem = useCallback(
    (itemId: number) => {
      const newValue = value.filter((item) => item.id !== itemId);
      onSelect(newValue);
    },
    [value, onSelect]
  );

  const renderMediaPreview = (item: MediaItem) => (
    <div key={item.id} className="relative group">
      <Card className="overflow-hidden">
        <CardContent className="p-2">
          <div className="aspect-square relative bg-gray-100 rounded-md overflow-hidden">
            {item.type === "image" ? (
              <img
                src={item.url}
                alt={item.alt || item.title}
                className="w-full h-full object-cover"
              />
            ) : item.type === "video" ? (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center p-2">
                <p
                  className="text-xs text-gray-600 truncate"
                  title={item.filename}
                >
                  {item.filename}
                </p>
              </div>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
              onClick={() => removeItem(item.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate" title={item.title}>
            {item.title || item.filename}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderButton = () => (
    <Button
      onClick={openMediaLibrary}
      disabled={!isLoaded}
      variant="outline"
      className={className}
    >
      <Upload className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );

  const renderCard = () => (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Selected Media</h3>
          <Button
            onClick={openMediaLibrary}
            disabled={!isLoaded}
            size="sm"
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Media
          </Button>
        </div>

        {value.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {value.map(renderMediaPreview)}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No media selected</p>
          </div>
        )}

        {maxItems && value.length >= maxItems && (
          <p className="text-xs text-amber-600">
            Maximum {maxItems} items allowed
          </p>
        )}
      </div>
    </Card>
  );

  const renderInline = () => (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Media Selection</label>
        <Button
          onClick={openMediaLibrary}
          disabled={!isLoaded}
          size="sm"
          variant="outline"
        >
          <Upload className="w-4 h-4 mr-2" />
          Browse
        </Button>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {value.map(renderMediaPreview)}
        </div>
      )}
    </div>
  );

  const FallbackUrlInput = () => {
    const [urlInput, setUrlInput] = useState("");
    const [typeInput, setTypeInput] = useState<"image" | "video">("image");

    const handleAddUrl = () => {
      if (!urlInput.trim()) return;

      const newItem: MediaItem = {
        id: Date.now(),
        url: urlInput.trim(),
        type: typeInput,
        alt: "",
        title: `Manual ${typeInput}`,
        caption: "",
        mime: typeInput === "image" ? "image/jpeg" : "video/mp4",
        filename: urlInput.split("/").pop() || "media",
      };

      const newValue = multiple ? [...value, newItem] : [newItem];
      onSelect(newValue);
      setUrlInput("");
    };

    return (
      <div className="space-y-3 p-4 border border-orange-200 rounded-md bg-orange-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <p className="font-medium text-sm text-orange-800">
            Manual Media Entry
          </p>
        </div>
        <p className="text-xs text-orange-700">
          WordPress media library not available. Enter media URLs manually:
        </p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="media-url" className="text-xs">
                Media URL
              </Label>
              <Input
                id="media-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="media-type" className="text-xs">
                Type
              </Label>
              <select
                id="media-type"
                value={typeInput}
                onChange={(e) =>
                  setTypeInput(e.target.value as "image" | "video")
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddUrl}
              size="sm"
              disabled={!urlInput.trim()}
              className="flex-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Media
            </Button>
            <Button
              onClick={() => {
                setLoadError(null);
                setAttemptCount(0);
              }}
              size="sm"
              variant="outline"
            >
              Retry Library
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loadError) {
    return <FallbackUrlInput />;
  }

  if (!isLoaded) {
    return (
      <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-md bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span>Loading media library... ({attemptCount}/30)</span>
        </div>
      </div>
    );
  }

  switch (variant) {
    case "card":
      return renderCard();
    case "inline":
      return renderInline();
    default:
      return renderButton();
  }
};
