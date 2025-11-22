import type { MediaItem } from "../components/MediaPicker";
import { MediaPicker } from "../components/MediaPicker";
import React from "react";

type MediaOrder = "selected" | "title_asc" | "title_desc" | "random";

type MediaSettings = {
  selected_media?: MediaItem[];
  media_order?: MediaOrder;
};

type MediaDataSourceProps = {
  media_settings?: MediaSettings;
};

type FieldRenderProps = {
  value?: MediaItem[];
  onChange: (items: MediaItem[]) => void;
};

type MediaDataItem = {
  id: MediaItem["id"];
  title: string;
  link: string;
  featured_media_url: string;
  featured_media_id: MediaItem["id"];
  excerpt: string;
  date: string;
  type?: string;
  format: string;
  content: {
    rendered: string;
  };
  _raw: Record<string, unknown>;
};

export const mediaDataSource = {
  label: "📁 Media Selection",

  // Fields to inject when this data source is selected
  getFields: () => {
    return {
      media_settings: {
        type: "object",
        label: "📁 Media Settings",
        objectFields: {
          selected_media: {
            type: "custom",
            label: "Selected Media",
            render: ({ value = [], onChange }: FieldRenderProps) => (
              <MediaPicker
                multiple
                allowedTypes={["image", "video"]}
                value={value}
                onSelect={onChange}
                variant="card"
                title="Select Media for Carousel"
              />
            ),
          },
          media_order: {
            type: "select",
            label: "Order",
            options: [
              { label: "As Selected", value: "selected" },
              { label: "Title (A-Z)", value: "title_asc" },
              { label: "Title (Z-A)", value: "title_desc" },
              { label: "Random", value: "random" },
            ],
          },
        },
      },
    };
  },

  async fetchData(props: MediaDataSourceProps): Promise<MediaDataItem[]> {
    const settings = props.media_settings ?? {};
    const selectedMedia = settings.selected_media ?? [];
    const order: MediaOrder = settings.media_order ?? "selected";

    if (!selectedMedia || selectedMedia.length === 0) {
      console.log("[MediaDataSource] No media selected");
      return [];
    }

    console.log("[MediaDataSource] Processing selected media:", {
      count: selectedMedia.length,
      order,
      items: selectedMedia,
    });

    // Transform MediaItem to expected format
    let items: MediaDataItem[] = selectedMedia.map((mediaItem) => ({
      id: mediaItem.id,
      title: mediaItem.title || mediaItem.filename || "Untitled",
      link: mediaItem.url,
      featured_media_url: mediaItem.url,
      featured_media_id: mediaItem.id,
      excerpt: mediaItem.caption || "",
      date: new Date().toISOString(), // Media items don't have dates, use current
      type: mediaItem.type,
      format: mediaItem.type === "video" ? "video" : "image",
      content: {
        rendered: `<img src="${mediaItem.url}" alt="${mediaItem.alt || mediaItem.title}" />`,
      },
      _raw: {
        id: mediaItem.id,
        title: { rendered: mediaItem.title || mediaItem.filename || "Untitled" },
        link: mediaItem.url,
        featured_media: mediaItem.id,
        excerpt: { rendered: mediaItem.caption || "" },
        type: mediaItem.type,
        mime_type: mediaItem.mime || "",
        media_details: {
          width: mediaItem.width,
          height: mediaItem.height,
        },
        alt_text: mediaItem.alt || "",
      },
    }));

    // Apply ordering
    switch (order) {
      case "title_asc":
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        items.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "random":
        items = items.sort(() => Math.random() - 0.5);
        break;
      case "selected":
      default:
        break;
    }

    console.log("[MediaDataSource] Returning items:", items);
    return items;
  },

  defaultProps: {
    media_settings: {
      selected_media: [],
      media_order: "selected" as MediaOrder,
    },
  },
};
