/**
 * Media Data Source
 * Allows selecting media items directly from WordPress Media Library
 * for use in Loop Carousel and other data-driven components
 */

import { MediaPicker } from "../MediaPicker.jsx";
import React from "react";

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
            render: ({ value = [], onChange }) => (
              <MediaPicker
                multiple={true}
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

  /**
   * Transform MediaItem[] into the expected item format
   */
  async fetchData(props) {
    const settings = props.media_settings || {};
    const selectedMedia = settings.selected_media || [];
    const order = settings.media_order || "selected";

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
    let items = selectedMedia.map((mediaItem) => ({
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
        title: {
          rendered: mediaItem.title || mediaItem.filename || "Untitled",
        },
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
        // Keep the order as selected
        break;
    }

    console.log("[MediaDataSource] Returning items:", items);
    return items;
  },

  defaultProps: {
    media_settings: {
      selected_media: [],
      media_order: "selected",
    },
  },
};
