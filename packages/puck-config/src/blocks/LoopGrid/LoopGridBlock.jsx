import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArchiveCard,
  AsideCard,
  AudioCard,
  ButtonCard,
  CallToActionCard,
  ChatCard,
  DownloadCard,
  GalleryCard,
  GroupCard,
  ImageCard,
  LinkCard,
  PostCard,
  QuoteCard,
  SlideCard,
  StandardPostCard,
  StatusCard,
  TemplateCard,
  UserCard,
  VideoCard,
} from "./cards";
import {
  Archive as ArchiveIcon,
  ChevronDown,
  Download,
  ExternalLink,
  File,
  FileText,
  Grid3x3,
  List,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
// @ts-nocheck
import React, { useEffect, useState } from "react";
import { StyleWrapper, defaultStyleProps, styleFields } from "../utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { registerOverlayPortal, usePuck } from "@measured/puck";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { dataSourceRegistry } from "../plugins/dataSourceRegistry";
import { groupData } from "../utils/groupingHelpers";

/**
 * Helper function to format file size
 */
const formatFileSize = (bytes) => {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

/**
 * Simple in-memory cache for Loop Grid data (WordPress data source ONLY)
 *
 * NOTE: GraphQL data source uses React Query's built-in caching.
 * TODO: Remove this when WordPress data source is migrated to React Query.
 *
 * Cache entries expire after 10 minutes
 */
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const loopGridCache = new Map();

function getCacheKey(dataSource, props) {
  // Create a unique key based on data source and relevant props
  return JSON.stringify({ dataSource, props });
}

function getCachedData(cacheKey) {
  const cached = loopGridCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("[LoopGridBlock] ♻️ Using cached data (WordPress DS):", cacheKey.slice(0, 100));
    return cached.data;
  }
  return null;
}

function setCachedData(cacheKey, data) {
  loopGridCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Loop Grid Block
 * Data-driven grid layout that fetches and displays content from various data sources
 */
export const LoopGridBlock = {
  label: "Loop Grid",
  fields: {
    dataSource: {
      type: "select",
      label: "Data Source",
      options: dataSourceRegistry.getOptions(),
    },
    cardType: {
      type: "select",
      label: "Card Type",
      options: [
        { label: "Post", value: "post" },
        { label: "Group", value: "group" },
        { label: "Download", value: "download" },
        { label: "Template", value: "template" },
        { label: "Post Format", value: "post-format" },
        { label: "Button", value: "button" },
        { label: "Call To Action", value: "calltoaction" },
        { label: "User", value: "user" },
      ],
    },
    templateId: {
      type: "external",
      label: "Loop Item Template",
      fetchList: async () => {
        try {
          const response = await fetch(
            `${window.location.origin}/wp-json/wp/v2/puck-templates?per_page=100&_fields=id,title,meta&meta_key=_puck_template_type&meta_value=loop-grid-item`
          );
          if (response.ok) {
            const data = await response.json();
            return data.map((post) => ({
              title: post.title.rendered,
              value: `wp-${post.id}`,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch loop item templates:", error);
        }
        return [];
      },
    },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "1 Column", value: "1" },
        { label: "2 Columns", value: "2" },
        { label: "3 Columns", value: "3" },
        { label: "4 Columns", value: "4" },
        { label: "5 Columns", value: "5" },
        { label: "6 Columns", value: "6" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "None", value: "0" },
        { label: "Small", value: "2" },
        { label: "Medium", value: "4" },
        { label: "Large", value: "6" },
        { label: "XLarge", value: "8" },
      ],
    },
    enableViewToggle: {
      type: "radio",
      label: "Enable View Toggle",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    ...styleFields,
  },
  resolveFields: (data) => {
    const baseFields = {
      _configHelper: {
        type: "custom",
        label: "Configuration Helper",
        render: ({ onChange, value, field, id }) => {
          // Use Puck's getItemById to access the current component data
          const { getItemById } = usePuck();

          // Extract component ID from field ID
          const componentId = id.split("_custom_")[0]; // e.g., "LoopGridBlock-uuid_custom__configHelper"

          // Use Puck's official API to get component data
          const currentComponent = getItemById(componentId);
          const props = currentComponent?.props || {};

          // DEBUG: Log what we found
          console.log("[Copy Config Debug - resolveFields]", {
            id,
            componentId,
            foundComponent: !!currentComponent,
            propsCount: Object.keys(props).length,
            sampleProps: {
              dataSource: props.dataSource,
              cardType: props.cardType,
              displayStyle: props.displayStyle,
            },
          });
          // Log all props separately for easy viewing
          console.log(
            "[Copy Config Debug - resolveFields] ALL PROPS:",
            JSON.stringify(props, null, 2)
          );

          const handleCopyConfig = () => {
            try {
              // Copy ALL props that exist on the component
              // Filter out internal Puck props (id, editableProps, puck, etc.)
              const internalProps = ["id", "editableProps", "puck", "children"];
              const config = {
                componentType: "LoopGridBlock",
                ...Object.fromEntries(
                  Object.entries(props).filter(([key]) => !internalProps.includes(key))
                ),
              };

              const jsonString = JSON.stringify(config, null, 2);

              // Create a temporary textarea to copy from (works in iframes)
              const textarea = document.createElement("textarea");
              textarea.value = jsonString;
              textarea.style.position = "fixed";
              textarea.style.opacity = "0";
              document.body.appendChild(textarea);
              textarea.select();

              try {
                document.execCommand("copy");

                // Show success feedback
                const button = document.querySelector("[data-config-copy-button]");
                if (button) {
                  button.textContent = "✅ Copied!";
                  setTimeout(() => {
                    button.textContent = "📋 Copy Configuration";
                  }, 2000);
                }
              } catch (copyError) {
                console.error("execCommand copy failed:", copyError);
                // Fallback: show in alert so user can manually copy
                alert("Please copy this configuration:\n\n" + jsonString);
              } finally {
                document.body.removeChild(textarea);
              }
            } catch (error) {
              console.error("Failed to copy configuration:", error);
              alert("Failed to copy configuration. See console for details.");
            }
          };

          return (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 text-sm font-semibold text-blue-900">Export Configuration</div>
              <p className="mb-3 text-xs text-blue-700">
                Copy this component's complete configuration as JSON to share with AI or save for
                later.
              </p>
              <button
                data-config-copy-button
                onClick={handleCopyConfig}
                className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                📋 Copy Configuration
              </button>
            </div>
          );
        },
      },
      dataSource: {
        type: "select",
        label: "Data Source",
        options: dataSourceRegistry.getOptions(),
      },
      cardType: {
        type: "select",
        label: "Card Type",
        options: [
          { label: "Post", value: "post" },
          { label: "Group", value: "group" },
          { label: "Download", value: "download" },
          { label: "Template", value: "template" },
          { label: "Post Format", value: "post-format" },
          { label: "Button", value: "button" },
          { label: "Call To Action", value: "calltoaction" },
          { label: "User", value: "user" },
        ],
      },
      templateId: {
        type: "external",
        label: "Loop Item Template",
        fetchList: async () => {
          try {
            const response = await fetch(
              `${window.location.origin}/wp-json/wp/v2/puck-templates?per_page=100&_fields=id,title,meta&meta_key=_puck_template_type&meta_value=loop-grid-item`
            );
            if (response.ok) {
              const data = await response.json();
              return data.map((post) => ({
                title: post.title.rendered,
                value: `wp-${post.id}`,
              }));
            }
          } catch (error) {
            console.error("Failed to fetch loop item templates:", error);
          }
          return [];
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "1 Column", value: "1" },
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
          { label: "5 Columns", value: "5" },
          { label: "6 Columns", value: "6" },
        ],
      },
      gap: {
        type: "select",
        label: "Gap",
        options: [
          { label: "None", value: "0" },
          { label: "Small", value: "2" },
          { label: "Medium", value: "4" },
          { label: "Large", value: "6" },
          { label: "XLarge", value: "8" },
        ],
      },
      enableViewToggle: {
        type: "radio",
        label: "Enable View Toggle",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    };

    // Add card-specific fields based on cardType
    let cardFieldsObject = {};
    const cardType = data.props.cardType;

    if (cardType === "calltoaction") {
      cardFieldsObject = {
        cardFields: {
          type: "object",
          label: "📝 Call To Action Settings",
          objectFields: {
            layoutType: {
              type: "select",
              label: "Layout Type",
              options: [
                { label: "Overlay (Content over image)", value: "overlay" },
                { label: "Stacked (Image on top)", value: "stacked" },
                { label: "Inline (Side by side)", value: "inline" },
                { label: "Stacked (Title on top)", value: "stackedTitleFirst" },
              ],
            },
            buttonText: {
              type: "text",
              label: "Button Text",
              placeholder: "Learn More",
            },
            linkEntireCard: {
              type: "radio",
              label: "Link Entire Card",
              options: [
                { label: "Button Only", value: false },
                { label: "Entire Card", value: true },
              ],
            },
            buttonStyle: {
              type: "select",
              label: "Button Style",
              options: [
                { label: "Default", value: "default" },
                { label: "Outline", value: "outline" },
                { label: "Secondary", value: "secondary" },
                { label: "Ghost", value: "ghost" },
                { label: "Link", value: "link" },
              ],
            },
            hoverZoom: {
              type: "radio",
              label: "Hover Zoom Effect",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            imageFit: {
              type: "select",
              label: "Image Fit",
              options: [
                { label: "Cover (Fill container)", value: "cover" },
                { label: "Contain (Fit within container)", value: "contain" },
              ],
            },
            enableOverlay: {
              type: "radio",
              label: "Enable Dark Overlay (Overlay mode)",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            inlineImageWidth: {
              type: "select",
              label: "Image Width (Inline Mode)",
              options: [
                { label: "30%", value: "30" },
                { label: "40%", value: "40" },
                { label: "50%", value: "50" },
              ],
            },
            inlineContentAlignment: {
              type: "select",
              label: "Content Alignment (Inline Mode)",
              options: [
                { label: "Top", value: "start" },
                { label: "Center", value: "center" },
                { label: "Bottom", value: "end" },
              ],
            },
          },
        },
      };
    } else if (cardType === "button") {
      cardFieldsObject = {
        cardFields: {
          type: "object",
          label: "🎨 Download Button Settings",
          objectFields: {
            backgroundColor: {
              type: "select",
              label: "Background Color",
              options: [
                { label: "Primary (Blue)", value: "primary" },
                { label: "Secondary (Gray)", value: "secondary" },
                { label: "Destructive (Red)", value: "destructive" },
                { label: "Success (Green)", value: "success" },
                { label: "Warning (Yellow)", value: "warning" },
                { label: "White", value: "white" },
                { label: "Transparent", value: "transparent" },
              ],
            },
            borderRadius: {
              type: "select",
              label: "Border Radius",
              options: [
                { label: "None", value: "none" },
                { label: "Small (4px)", value: "sm" },
                { label: "Medium (8px)", value: "md" },
                { label: "Large (12px)", value: "lg" },
                { label: "Extra Large (16px)", value: "xl" },
                { label: "Full (9999px)", value: "full" },
              ],
            },
            borderColor: {
              type: "select",
              label: "Border Color",
              options: [
                { label: "None", value: "none" },
                { label: "Primary (Blue)", value: "primary" },
                { label: "Secondary (Gray)", value: "secondary" },
                { label: "Border (Default)", value: "border" },
                { label: "Muted", value: "muted" },
              ],
            },
            borderWidth: {
              type: "select",
              label: "Border Width",
              options: [
                { label: "None (0px)", value: "0" },
                { label: "Thin (1px)", value: "1" },
                { label: "Medium (2px)", value: "2" },
                { label: "Thick (4px)", value: "4" },
              ],
            },
            padding: {
              type: "select",
              label: "Padding",
              options: [
                { label: "None", value: "0" },
                { label: "Small (8px)", value: "2" },
                { label: "Medium (12px)", value: "3" },
                { label: "Large (16px)", value: "4" },
                { label: "Extra Large (24px)", value: "6" },
              ],
            },
            textAlign: {
              type: "select",
              label: "Text Alignment",
              options: [
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" },
              ],
            },
          },
        },
      };
    } else if (cardType === "user") {
      cardFieldsObject = {
        cardFields: {
          type: "object",
          label: "👤 User Card Settings",
          objectFields: {
            userAvatarSize: {
              type: "select",
              label: "Avatar Size",
              options: [
                { label: "Small", value: "sm" },
                { label: "Medium", value: "md" },
                { label: "Large", value: "lg" },
              ],
            },
            userShowDescription: {
              type: "radio",
              label: "Show Bio / Description",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            userDescriptionLines: {
              type: "number",
              label: "Description Line Clamp",
              min: 1,
              max: 6,
            },
            userShowRoles: {
              type: "radio",
              label: "Show Roles / Capabilities",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            userShowRegisteredDate: {
              type: "radio",
              label: "Show Registered Date",
              options: [
                { label: "No", value: false },
                { label: "Yes", value: true },
              ],
            },
            userShowActionButton: {
              type: "radio",
              label: "Show Profile Button",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            userActionLabel: {
              type: "text",
              label: "Button Label",
              placeholder: "View Profile",
            },
            userActionVariant: {
              type: "select",
              label: "Button Style",
              options: [
                { label: "Default", value: "default" },
                { label: "Secondary", value: "secondary" },
                { label: "Outline", value: "outline" },
                { label: "Ghost", value: "ghost" },
                { label: "Link", value: "link" },
              ],
            },
          },
        },
      };
    }

    const baseWithStyleAndCard = {
      ...baseFields,
      ...cardFieldsObject,
      ...styleFields,
    };

    // If a data source is selected, inject its specific fields
    const dataSourceName = data.props.dataSource;
    if (dataSourceName) {
      const provider = dataSourceRegistry.get(dataSourceName);
      if (provider && provider.getFields) {
        const providerFields = provider.getFields(data);
        return {
          ...baseWithStyleAndCard,
          ...providerFields,
        };
      }
    }

    return baseWithStyleAndCard;
  },
  defaultProps: {
    dataSource: "",
    cardType: "post",
    templateId: null,
    columns: "3",
    gap: "4",
    enableViewToggle: false,
    cardFields: {
      // Call To Action defaults
      layoutType: "overlay",
      buttonText: "Learn More",
      linkEntireCard: false,
      buttonStyle: "default",
      hoverZoom: true,
      imageFit: "cover",
      enableOverlay: true,
      inlineImageWidth: "50",
      inlineContentAlignment: "center",
      // Download Button defaults
      backgroundColor: "primary",
      borderRadius: "md",
      borderColor: "none",
      borderWidth: "0",
      padding: "4",
      textAlign: "center",
      // User Card defaults
      userAvatarSize: "md",
      userShowDescription: true,
      userDescriptionLines: 3,
      userShowRoles: true,
      userShowRegisteredDate: false,
      userShowActionButton: true,
      userActionLabel: "View Profile",
      userActionVariant: "outline",
    },
    // WordPress defaults (will be used when WordPress is selected)
    wp_settings: {
      wp_post_type: "post",
      wp_posts_per_page: 10,
      wp_order: "desc",
      wp_orderby: "date",
    },
    ...defaultStyleProps,
  },
  inline: true,
  render: (props) => {
    const {
      dataSource,
      cardType,
      templateId,
      columns,
      gap,
      enableViewToggle,
      puck,
      cardFields, // Add cardFields to destructuring
      ...styleProps
    } = props;
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [viewMode, setViewMode] = React.useState("grid");
    const viewToggleRef = React.useRef(null);
    // Track which accordion is currently open (only one at a time)
    // null means all are collapsed
    const [openAccordionId, setOpenAccordionId] = React.useState(null);
    const [collapsingArchives, setCollapsingArchives] = React.useState(new Set());
    // Lightbox state for image preview
    const [lightboxImage, setLightboxImage] = React.useState(null);

    // Toggle archive collapse state with animation
    // Only one accordion can be open at a time
    const toggleArchiveCollapse = (itemId) => {
      const isCurrentlyOpen = openAccordionId === itemId;

      if (isCurrentlyOpen) {
        // Closing the currently open accordion
        setCollapsingArchives((prev) => new Set(prev).add(itemId));

        // Wait for exit animation to complete before clearing
        setTimeout(() => {
          setOpenAccordionId(null);
          setCollapsingArchives((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 200); // Match the animation duration
      } else {
        // Opening a new accordion (close any other that might be open)
        if (openAccordionId !== null) {
          // Close the previously open accordion with animation
          setCollapsingArchives((prev) => new Set(prev).add(openAccordionId));

          setTimeout(() => {
            setCollapsingArchives((prev) => {
              const newSet = new Set(prev);
              newSet.delete(openAccordionId);
              return newSet;
            });
          }, 200);
        }

        // Open the new accordion
        setOpenAccordionId(itemId);
      }
    };

    // Helper function to check if item is Archive or Gallery content type
    const isArchiveContentType = (item) => {
      // Check format field (set during transformation in graphQLDataSource)
      if (item.format === "archive" || item.format === "gallery") {
        return true;
      }

      // Also check GraphQL postContentTypes
      const contentTypeNodes = item._raw?.postContentTypes?.nodes || [];
      const hasArchiveOrGallery = contentTypeNodes.some(
        (node) => node.slug === "archive" || node.slug === "gallery"
      );

      return hasArchiveOrGallery;
    };

    // Helper function to get real archive files from manifest
    const getArchiveFiles = (parentItem) => {
      // Get archive data from _raw GraphQL data
      const archiveData = parentItem._raw || {};
      const manifest = archiveData.archiveManifest?.filter((file) => file !== null) || [];

      // Format file size
      const formatFileSize = (bytes) => {
        if (!bytes) return "0 KB";
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(2)} KB`;
        const mb = kb / 1024;
        if (mb < 1024) return `${mb.toFixed(2)} MB`;
        const gb = mb / 1024;
        return `${gb.toFixed(2)} GB`;
      };

      // Map manifest files to table row format
      return manifest.map((file, index) => ({
        id: `${parentItem.id}-file-${index}`,
        parentId: parentItem.id,
        title: file.name || file.path || "Untitled",
        fileSize: formatFileSize(file.size),
        fileIcon: File,
        isNestedFile: true,
        date: parentItem.date,
        link: file.url || `${parentItem.link}#file-${index}`,
        // Use thumbnail if it's an image, otherwise null
        featured_media_url: file.isImage && file.thumbnail ? file.thumbnail : null,
        mimeType: file.mimeType || "unknown",
        path: file.path || "",
      }));
    };

    // Card type renderer map
    // Post Format Card - dynamically selects card based on content_type taxonomy OR post format
    const PostFormatCard = ({ item, ...rest }) => {
      console.log("[LoopGrid PostFormatCard] RENDER START - Item ID:", item.id);
      console.log("[LoopGrid PostFormatCard] RENDER START - Rest props:", rest);

      // Check for custom content_type taxonomy first, then fall back to post format
      let format = "standard";

      // Check content_type taxonomy (custom taxonomy for Archive, etc.)
      if (
        item._raw?.content_type &&
        Array.isArray(item._raw.content_type) &&
        item._raw.content_type.length > 0
      ) {
        // Get the first content_type term slug
        const contentTypeTerms = item._raw?._embedded?.["wp:term"]?.find((termArray) =>
          termArray.some((t) => t.taxonomy === "content_type")
        );
        if (contentTypeTerms && contentTypeTerms.length > 0) {
          format = contentTypeTerms[0].slug; // Use the slug (e.g., "archive")
        }
      } else {
        // Fall back to post format
        format = item.format || "standard";
      }

      console.log("[LoopGrid PostFormatCard] Item:", item);
      console.log("[LoopGrid PostFormatCard] Format:", format);
      console.log("[LoopGrid PostFormatCard] item.format:", item.format);
      console.log("[LoopGrid PostFormatCard] item.content_type:", item._raw?.content_type);
      console.log("[LoopGrid PostFormatCard] item._raw?.format:", item._raw?.format);

      const formatCardMap = {
        standard: StandardPostCard,
        aside: AsideCard,
        gallery: ArchiveCard, // Use ArchiveCard for galleries
        link: CallToActionCard, // Use CallToActionCard for links in stacked mode
        image: ImageCard,
        quote: QuoteCard,
        status: StatusCard,
        video: VideoCard,
        audio: AudioCard,
        chat: ChatCard,
        archive: ArchiveCard, // Use ArchiveCard for archives
        download: DownloadCard, // Use DownloadCard for downloads
        "call-to-action": CallToActionCard, // Use CallToActionCard for CTAs
      };
      const FormatComponent = formatCardMap[format] || StandardPostCard;
      console.log("[LoopGrid PostFormatCard] Selected component:", FormatComponent.name);

      // For link format, force stacked layout mode
      let cardFieldsWithLayout = rest.cardFields || {};
      if (format === "link") {
        console.log("[LoopGrid PostFormatCard] Original cardFields:", rest.cardFields);
        cardFieldsWithLayout = { ...rest.cardFields, layoutType: "stacked", openInNewTab: true };
        console.log(
          "[LoopGrid PostFormatCard] Forcing stacked layout for link, new cardFields:",
          cardFieldsWithLayout
        );
      }

      // Remove cardFields from rest to avoid overwriting our modified version
      const { cardFields: _, ...restWithoutCardFields } = rest;

      return (
        <FormatComponent item={item} cardFields={cardFieldsWithLayout} {...restWithoutCardFields} />
      );
    };

    const cardRenderers = {
      post: PostCard,
      group: GroupCard,
      download: DownloadCard,
      template: TemplateCard,
      "post-format": PostFormatCard,
      button: ButtonCard,
      calltoaction: CallToActionCard,
      user: UserCard,
    };

    const CardComponent = cardRenderers[cardType] || PostCard;

    // Get current post ID from AppContext (reactive, updates on navigation)
    // This ensures cache is invalidated when navigating between posts/districts
    const appContext = typeof window !== "undefined" ? window.__appContext || {} : {};
    const currentPostId = appContext.currentPostId || appContext.currentPageId;

    // Fetch data when data source or WordPress props change
    useEffect(() => {
      if (!dataSource) {
        setItems([]);
        return;
      }

      const provider = dataSourceRegistry.get(dataSource);
      if (!provider) {
        console.error(`[Loop Grid] Data source "${dataSource}" not found`);
        return;
      }

      // Get all props that might be needed by the data source
      const allProps = props;

      // Create cache key that includes resolved current post ID
      const cacheKeyProps = {
        ...allProps,
        _resolvedPostId: currentPostId, // Add resolved post ID to cache key
      };
      const cacheKey = getCacheKey(dataSource, cacheKeyProps);
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        console.log("[Loop Grid] Using cached data:", cachedData);

        // Ensure cached data is an array if it's not grouped
        let safeData = cachedData;
        if (!Array.isArray(cachedData) && !cachedData._grouped) {
          console.warn("[Loop Grid] Cached data is not an array, wrapping:", cachedData);
          safeData = [];
        }

        // Check if cached data needs grouping applied
        // (This can happen if grouping settings changed after caching)
        let grouping = dataSource === "graphql" ? props.gql_grouping : props.wp_grouping;

        // Safety check: if grouping is enabled but group_by is missing, default to "category"
        if (grouping?.enabled && !grouping?.group_by) {
          console.warn(
            "[Loop Grid] (Cached) Grouping enabled but group_by missing, defaulting to 'category'"
          );
          grouping = { ...grouping, group_by: "category" };
        }

        let processedData = safeData;

        // Only reprocess if grouping is enabled and data isn't already grouped
        if (grouping?.enabled && grouping?.group_by && !safeData._grouped) {
          console.log("[Loop Grid] Applying grouping to cached data:", grouping);

          const groupedData = groupData(safeData, grouping);

          processedData = {
            _grouped: true,
            _nested: !!grouping.group_by_2 && grouping.group_by_2 !== "none",
            display_type: grouping.display_type || "default",
            show_group_titles: grouping.show_group_titles !== false, // Default to true
            groups: groupedData,
          };
        }

        // Use cached data immediately
        setItems(processedData);
        setLoading(false);
        return;
      }

      // No cache - fetch from server
      setLoading(true);

      provider
        .fetchData(allProps)
        .then((fetchResult) => {
          console.log("[Loop Grid] Fetched data:", fetchResult);

          // Handle new data structure from GraphQL data source
          // { items: [], _filteredCategoryIds: [] }
          let data = fetchResult;
          let filteredCategoryIds = null;

          if (fetchResult && typeof fetchResult === "object" && !Array.isArray(fetchResult)) {
            if (fetchResult.items) {
              data = fetchResult.items;
              filteredCategoryIds = fetchResult._filteredCategoryIds || null;
              console.log("[Loop Grid] Using filtered category IDs:", filteredCategoryIds);
            }
          }

          // Ensure data is an array if it's not grouped
          if (!Array.isArray(data) && !data._grouped) {
            console.warn("[Loop Grid] Data is not an array, wrapping in array:", data);
            data = Array.isArray(data) ? data : [];
          }

          // Check if grouping is enabled
          let grouping = dataSource === "graphql" ? props.gql_grouping : props.wp_grouping;

          // Safety check: if grouping is enabled but group_by is missing, default to "category"
          if (grouping?.enabled && !grouping?.group_by) {
            console.warn(
              "[Loop Grid] Grouping enabled but group_by missing, defaulting to 'category'"
            );
            grouping = { ...grouping, group_by: "category" };
          }

          let processedData = data;

          if (grouping?.enabled && grouping?.group_by) {
            console.log("[Loop Grid] Applying grouping:", grouping);

            // Apply grouping using shared helper
            // Pass filtered category IDs to limit groups to only filtered categories
            const groupedData = groupData(data, grouping, filteredCategoryIds);

            // Format data to match expected structure
            processedData = {
              _grouped: true,
              _nested: !!grouping.group_by_2 && grouping.group_by_2 !== "none",
              display_type: grouping.display_type || "default",
              show_group_titles: grouping.show_group_titles !== false, // Default to true
              groups: groupedData,
            };

            console.log("[Loop Grid] Grouped data:", processedData);
          }

          // Store in cache
          setCachedData(cacheKey, processedData);
          setItems(processedData);
          setLoading(false);
        })
        .catch((error) => {
          console.error("[Loop Grid] Error fetching data:", error);
          setItems([]);
          setLoading(false);
        });
    }, [
      dataSource,
      currentPostId, // Add current post ID to dependencies
      props.wp_settings?.wp_post_type,
      props.wp_settings?.wp_posts_per_page,
      props.wp_settings?.wp_order,
      props.wp_settings?.wp_orderby,
      // Old-style filters (backward compatibility)
      props.wp_settings?.wp_filter_type,
      JSON.stringify(props.wp_settings?.wp_categories),
      props.wp_settings?.wp_category_operator,
      props.wp_settings?.wp_pods_relationship_field,
      props.wp_settings?.wp_pods_current_post,
      props.wp_settings?.wp_pods_post_id,
      // New multi-filter system
      props.wp_settings?.filter1_type,
      JSON.stringify(props.wp_settings?.filter1_categories),
      JSON.stringify(props.wp_settings?.filter1_content_types),
      props.wp_settings?.filter1_operator,
      props.wp_settings?.filter1_pods_field,
      props.wp_settings?.filter1_pods_source,
      props.wp_settings?.filter1_pods_id,
      props.wp_settings?.filter2_type,
      JSON.stringify(props.wp_settings?.filter2_categories),
      JSON.stringify(props.wp_settings?.filter2_content_types),
      props.wp_settings?.filter2_operator,
      props.wp_settings?.filter2_pods_field,
      props.wp_settings?.filter2_pods_source,
      props.wp_settings?.filter2_pods_id,
      props.wp_settings?.filter3_type,
      JSON.stringify(props.wp_settings?.filter3_categories),
      JSON.stringify(props.wp_settings?.filter3_content_types),
      props.wp_settings?.filter3_operator,
      props.wp_settings?.filter3_pods_field,
      props.wp_settings?.filter3_pods_source,
      props.wp_settings?.filter3_pods_id,
      // GraphQL filters that might use {{current_post_id}}
      props.gql_filters?.filter1_meta_value,
      props.gql_filters?.filter2_meta_value,
      props.gql_filters?.filter3_meta_value,
      JSON.stringify(props.gql_settings),
      JSON.stringify(props.gql_filters),
      JSON.stringify(props.gql_grouping),
    ]);

    // Register view toggle buttons as overlay portals
    useEffect(() => {
      if (viewToggleRef.current && enableViewToggle) {
        const buttons = viewToggleRef.current.querySelectorAll("button");
        const cleanups = Array.from(buttons).map((button) => registerOverlayPortal(button));

        return () => {
          cleanups.forEach((cleanup) => cleanup && cleanup());
        };
      }
    }, [viewToggleRef.current, enableViewToggle]);

    const gapClasses = {
      0: "gap-0",
      2: "gap-2",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
    };

    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    };

    console.log("[LoopGridBlock] Rendering with items:", items);
    console.log("[LoopGridBlock] Is grouped?:", items._grouped);

    return (
      <StyleWrapper dragRef={puck.dragRef} styleProps={styleProps}>
        {!dataSource && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">Select a data source to display content</p>
          </div>
        )}

        {dataSource && loading && (
          <div className="grid grid-cols-3 items-start gap-4">
            <Skeleton className="aspect-[3.8/1] w-full bg-gray-300" />
            <Skeleton className="aspect-[3.8/1] w-full bg-gray-300" />
            <Skeleton className="aspect-[3.8/1] w-full bg-gray-300" />
          </div>
        )}

        {dataSource && !loading && !items._grouped && items.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50 p-8 text-center">
            <p className="text-yellow-600">No items found</p>
          </div>
        )}

        {dataSource && !loading && (items._grouped || items.length > 0) && (
          <div className="space-y-4">
            {/* View Toggle */}
            {enableViewToggle && (
              <div ref={viewToggleRef} className="flex justify-end gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </Button>
              </div>
            )}

            {/* Check if data is grouped */}
            {items._grouped ? (
              (() => {
                // Extract group_columns from grouping settings
                const grouping = dataSource === "graphql" ? props.gql_grouping : props.wp_grouping;
                const groupColumns = grouping?.group_columns || "3";
                const groupColumnClasses = columnClasses[groupColumns];

                return items.display_type === "cards" ? (
                  viewMode === "grid" ? (
                    <div className="space-y-6">
                      {/* Render uncategorized/standard items first, without card wrapper */}
                      {items.groups
                        .filter(
                          (g) =>
                            g.groupKey === "uncategorized" || g.groupKey === "content_type_standard"
                        )
                        .map((group) => (
                          <div
                            key={`uncategorized-${group.groupKey}`}
                            className={`grid ${groupColumnClasses} ${gapClasses[gap]}`}
                          >
                            {group.items.map((item) => (
                              <CardComponent
                                key={item.id}
                                item={item}
                                cardFields={cardFields}
                                cardType={cardType}
                              />
                            ))}
                          </div>
                        ))}

                      {/* Render categorized items as cards */}
                      <div
                        className={`grid ${columnClasses[columns]} ${gapClasses[gap]} items-start`}
                      >
                        {items.groups
                          .filter(
                            (g) =>
                              g.groupKey !== "uncategorized" &&
                              g.groupKey !== "content_type_standard"
                          )
                          .map((group, groupIndex) => {
                            // Check if nested grouping is enabled (not if subgroups exist)
                            // A group might have uncategorizedItems but no subgroups
                            const hasSubgroups = items._nested === true;

                            // Calculate total item count (including uncategorized)
                            const uncategorizedCount = group.uncategorizedItems
                              ? group.uncategorizedItems.length
                              : 0;
                            const totalCount = hasSubgroups
                              ? group.items.reduce(
                                  (sum, subgroup) => sum + subgroup.items.length,
                                  0
                                ) + uncategorizedCount
                              : group.items.length;

                            return (
                              <Card key={`group-${group.groupKey}-${groupIndex}`}>
                                <CardHeader>
                                  <CardTitle className="text-xl font-bold">
                                    {group.groupName}
                                  </CardTitle>
                                  <CardDescription>{totalCount} items</CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="p-6">
                                  {hasSubgroups ? (
                                    // Render subgroups as accordions
                                    <div className="space-y-5">
                                      {/* Render uncategorized items at the top (no accordion) */}
                                      {group.uncategorizedItems &&
                                        group.uncategorizedItems.length > 0 && (
                                          <div
                                            className={`grid ${groupColumnClasses} ${gapClasses[gap]} mb-4`}
                                          >
                                            {group.uncategorizedItems.map((item) => (
                                              <CardComponent
                                                key={item.id}
                                                item={item}
                                                templateId={templateId}
                                                cardFields={cardFields}
                                              />
                                            ))}
                                          </div>
                                        )}

                                      {/* Render subgroups as accordions */}
                                      {group.items.map((subgroup, subgroupIndex) => {
                                        const subgroupId = `subgroup-${group.groupKey}-${subgroup.groupKey}`;
                                        const isSubgroupCollapsed = openAccordionId !== subgroupId;
                                        const isSubgroupCollapsing =
                                          collapsingArchives.has(subgroupId);

                                        return (
                                          // <Accordion
                                          //   key={`subgroup-${group.groupKey}-${subgroup.groupKey}-${subgroupIndex}`}
                                          //   className="rounded-md border"
                                          // >
                                          //   <AccordionItem
                                          //     value={`subgroup-${group.groupKey}-${subgroup.groupKey}`}
                                          //   >
                                          //     <AccordionTrigger>{subgroup.groupName}</AccordionTrigger>

                                          //     <AccordionContent>
                                          //       {/* Subgroup Header */}
                                          //       {/* <button
                                          //     onClick={() =>
                                          //       toggleArchiveCollapse(
                                          //         `subgroup-${group.groupKey}-${subgroup.groupKey}`
                                          //       )
                                          //     }
                                          //     className="flex w-full items-center justify-between bg-muted/50 p-3 hover:bg-muted"
                                          //   >
                                          //     <div className="flex items-center gap-2">
                                          //       <ChevronDown
                                          //         className={`h-4 w-4 transition-transform duration-200 ${
                                          //           isSubgroupCollapsed ? "-rotate-90" : "rotate-0"
                                          //         }`}
                                          //       />
                                          //       <span className="font-semibold">
                                          //         {subgroup.groupName}
                                          //       </span>
                                          //       <span className="text-sm text-muted-foreground">
                                          //         ({subgroup.items.length})
                                          //       </span>
                                          //     </div>
                                          //   </button> */}

                                          //       {/* Subgroup Items */}
                                          //       {!isSubgroupCollapsed && (
                                          //         <div
                                          //           className={`space-y-3 p-3 transition-all duration-200 ${
                                          //             isSubgroupCollapsing ? "opacity-0" : "opacity-100"
                                          //           }`}
                                          //         >
                                          //           {subgroup.items.map((item) => (
                                          //             <CardComponent
                                          //               key={item.id}
                                          //               item={item}
                                          //               templateId={templateId}
                                          //             />
                                          //           ))}
                                          //         </div>
                                          //       )}
                                          //     </AccordionContent>
                                          //   </AccordionItem>
                                          // </Accordion>
                                          <Accordion
                                            type="single"
                                            collapsible
                                            className="w-full"
                                            // defaultValue={`subgroup-${group.groupKey}-${subgroup.groupKey}`}
                                          >
                                            <AccordionItem
                                              value={`subgroup-${group.groupKey}-${subgroup.groupKey}`}
                                              className="border-b-0"
                                            >
                                              <AccordionTrigger className="gap-4 rounded-md border bg-muted/50 p-3 shadow-sm hover:bg-muted">
                                                <div className="flex items-center gap-4">
                                                  <span className="font-semibold">
                                                    {subgroup.groupName}
                                                  </span>
                                                  <span className="text-sm text-muted-foreground">
                                                    ({subgroup.items.length})
                                                  </span>
                                                </div>
                                              </AccordionTrigger>
                                              <AccordionContent className="flex flex-col gap-4 space-y-3 text-balance p-3">
                                                {/* <div
                                            className={`space-y-3 p-3 transition-all duration-200 ${
                                              isSubgroupCollapsing ? "opacity-0" : "opacity-100"
                                            }`}
                                          > */}
                                                {subgroup.items.map((item) => (
                                                  <CardComponent
                                                    key={item.id}
                                                    item={item}
                                                    templateId={templateId}
                                                  />
                                                ))}
                                                {/* </div> */}
                                              </AccordionContent>
                                            </AccordionItem>
                                          </Accordion>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    // Single level - render items in grid
                                    <div
                                      className={`grid ${groupColumnClasses} ${gapClasses[gap]}`}
                                    >
                                      {group.items.map((item) => (
                                        <CardComponent
                                          key={item.id}
                                          item={item}
                                          templateId={templateId}
                                          cardFields={cardFields}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    // Render grouped data as accordion table (list view)
                    <div className="rounded-md border bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Image</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.groups.map((group, groupIndex) => {
                            const groupId = `group-${group.groupKey}`;
                            const isGroupCollapsed = openAccordionId !== groupId;
                            const isGroupCollapsing = collapsingArchives.has(groupId);
                            const shouldShowGroupItems = !isGroupCollapsed || isGroupCollapsing;

                            // Check if nested grouping is enabled (not if subgroups exist)
                            // A group might have uncategorizedItems but no subgroups
                            const hasSubgroups = items._nested === true;

                            // Calculate total item count (including uncategorized)
                            const uncategorizedCount = group.uncategorizedItems
                              ? group.uncategorizedItems.length
                              : 0;
                            const totalCount = hasSubgroups
                              ? group.items.reduce(
                                  (sum, subgroup) => sum + subgroup.items.length,
                                  0
                                ) + uncategorizedCount
                              : group.items.length;

                            return (
                              <React.Fragment key={`group-${group.groupKey}-${groupIndex}`}>
                                {/* Group Header Row */}
                                <TableRow className="bg-blue-50/50 hover:bg-blue-50">
                                  <TableCell colSpan={5} className="font-semibold">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          toggleArchiveCollapse(`group-${group.groupKey}`)
                                        }
                                        className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-blue-200/50"
                                        aria-label={
                                          isGroupCollapsed ? "Expand group" : "Collapse group"
                                        }
                                      >
                                        <ChevronDown
                                          className={`h-4 w-4 text-blue-600 transition-transform duration-200 ${
                                            isGroupCollapsed ? "-rotate-90" : "rotate-0"
                                          }`}
                                        />
                                      </button>
                                      {group.groupName}
                                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({totalCount} items)
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {/* Group Items or Subgroups */}
                                {shouldShowGroupItems &&
                                  (hasSubgroups ? (
                                    // Render uncategorized items first, then subgroups
                                    <>
                                      {/* Render uncategorized items (no subgroup header) */}
                                      {group.uncategorizedItems &&
                                        group.uncategorizedItems.map((item, itemIndex) => {
                                          const isArchive = isArchiveContentType(item);
                                          const nestedFiles = isArchive
                                            ? getArchiveFiles(item)
                                            : [];

                                          // Extract featured image URL properly
                                          let featuredImage = null;
                                          if (
                                            item.featured_media_url &&
                                            typeof item.featured_media_url === "string" &&
                                            item.featured_media_url.startsWith("http")
                                          ) {
                                            featuredImage = item.featured_media_url;
                                          } else if (
                                            item.image &&
                                            typeof item.image === "string" &&
                                            item.image.startsWith("http")
                                          ) {
                                            featuredImage = item.image;
                                          } else if (
                                            item._embedded?.["wp:featuredmedia"]?.[0]?.source_url
                                          ) {
                                            featuredImage =
                                              item._embedded["wp:featuredmedia"][0].source_url;
                                          }

                                          // For archives, if no featured image, use the first image from manifest
                                          if (
                                            !featuredImage &&
                                            isArchive &&
                                            nestedFiles.length > 0
                                          ) {
                                            const firstImageFile = nestedFiles.find(
                                              (file) => file.featured_media_url
                                            );
                                            if (firstImageFile) {
                                              featuredImage = firstImageFile.featured_media_url;
                                            }
                                          }

                                          // For archives, if no featured image, use the first image from manifest
                                          if (
                                            !featuredImage &&
                                            isArchive &&
                                            nestedFiles.length > 0
                                          ) {
                                            const firstImageFile = nestedFiles.find(
                                              (file) => file.featured_media_url
                                            );
                                            if (firstImageFile) {
                                              featuredImage = firstImageFile.featured_media_url;
                                            }
                                          }

                                          // Check if this item is an archive with files
                                          const archiveData = item._raw || {};

                                          const extractionStatus =
                                            archiveData.archiveExtractionStatus || "unknown";
                                          const manifest =
                                            archiveData.archiveManifest?.filter(
                                              (file) => file !== null
                                            ) || [];
                                          const hasArchiveFiles =
                                            isArchive &&
                                            extractionStatus === "completed" &&
                                            manifest.length > 0;
                                          const isArchiveCollapsed =
                                            openAccordionId !== `archive-${item.id}`;
                                          const shouldShowArchiveFiles =
                                            hasArchiveFiles && !isArchiveCollapsed;

                                          return (
                                            <React.Fragment key={item.id}>
                                              {/* Main item row */}
                                              <TableRow>
                                                <TableCell className="w-16 p-2">
                                                  {featuredImage ? (
                                                    <div
                                                      className="relative aspect-square w-12 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLightboxImage(featuredImage);
                                                      }}
                                                    >
                                                      <img
                                                        src={featuredImage}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                      />
                                                    </div>
                                                  ) : (
                                                    <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                      <FileText className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                  )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                  <div className="flex items-center gap-2">
                                                    {hasArchiveFiles && (
                                                      <button
                                                        onClick={() =>
                                                          toggleArchiveCollapse(
                                                            `archive-${item.id}`
                                                          )
                                                        }
                                                        className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-gray-200/50"
                                                        aria-label={
                                                          isArchiveCollapsed
                                                            ? "Expand archive files"
                                                            : "Collapse archive files"
                                                        }
                                                      >
                                                        <ChevronDown
                                                          className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                                                            isArchiveCollapsed
                                                              ? "-rotate-90"
                                                              : "rotate-0"
                                                          }`}
                                                        />
                                                      </button>
                                                    )}
                                                    {item.title || "Untitled"}
                                                    {hasArchiveFiles && (
                                                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                        <ArchiveIcon className="h-3 w-3" />
                                                        {manifest.length} files
                                                      </span>
                                                    )}
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  {cardType.charAt(0).toUpperCase() +
                                                    cardType.slice(1)}
                                                </TableCell>
                                                <TableCell>
                                                  {item.date
                                                    ? new Date(item.date).toLocaleDateString()
                                                    : "—"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <a
                                                    href={item.link || "#"}
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                  >
                                                    View <ExternalLink className="h-3 w-3" />
                                                  </a>
                                                </TableCell>
                                              </TableRow>

                                              {/* Archive file child rows */}
                                              {shouldShowArchiveFiles &&
                                                nestedFiles.map((file, fileIndex) => {
                                                  const fileImageUrl =
                                                    file.featured_media_url || file.link;

                                                  return (
                                                    <TableRow
                                                      key={`${item.id}-file-${fileIndex}`}
                                                      className="border-l-2 border-l-blue-200 bg-gray-50/50"
                                                    >
                                                      <TableCell className="w-16 p-2 pl-8">
                                                        {fileImageUrl ? (
                                                          <div
                                                            className="relative aspect-square w-10 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setLightboxImage(fileImageUrl);
                                                            }}
                                                          >
                                                            <img
                                                              src={fileImageUrl}
                                                              alt={file.title || ""}
                                                              className="h-full w-full object-cover"
                                                            />
                                                          </div>
                                                        ) : (
                                                          <div className="flex aspect-square w-10 items-center justify-center rounded bg-muted">
                                                            <File className="h-4 w-4 text-muted-foreground" />
                                                          </div>
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="pl-8 text-sm">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-muted-foreground">
                                                            ↳
                                                          </span>
                                                          <span className="font-medium">
                                                            {file.title}
                                                          </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                          {file.mimeType || "Unknown type"}
                                                        </div>
                                                      </TableCell>
                                                      <TableCell className="text-xs text-muted-foreground">
                                                        {file.fileSize}
                                                      </TableCell>
                                                      <TableCell></TableCell>
                                                      <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                          <a
                                                            href={file.link || "#"}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                          >
                                                            <Download className="mr-2 h-3 w-3" />
                                                            Download
                                                          </a>
                                                        </Button>
                                                      </TableCell>
                                                    </TableRow>
                                                  );
                                                })}
                                            </React.Fragment>
                                          );
                                        })}

                                      {/* Render subgroups as nested accordions */}
                                      {group.items.map((subgroup, subgroupIndex) => {
                                        const subgroupId = `subgroup-${group.groupKey}-${subgroup.groupKey}`;
                                        const isSubgroupCollapsed = openAccordionId !== subgroupId;
                                        const isSubgroupCollapsing =
                                          collapsingArchives.has(subgroupId);
                                        const shouldShowSubgroupItems =
                                          !isSubgroupCollapsed || isSubgroupCollapsing;

                                        return (
                                          <React.Fragment
                                            key={`subgroup-${group.groupKey}-${subgroup.groupKey}-${subgroupIndex}`}
                                          >
                                            {/* Subgroup Header Row */}
                                            <TableRow className="bg-muted/30 hover:bg-muted/50">
                                              <TableCell colSpan={5} className="pl-8 font-medium">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() =>
                                                      toggleArchiveCollapse(
                                                        `subgroup-${group.groupKey}-${subgroup.groupKey}`
                                                      )
                                                    }
                                                    className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-muted"
                                                    aria-label={
                                                      isSubgroupCollapsed
                                                        ? "Expand subgroup"
                                                        : "Collapse subgroup"
                                                    }
                                                  >
                                                    <ChevronDown
                                                      className={`h-3 w-3 transition-transform duration-200 ${
                                                        isSubgroupCollapsed
                                                          ? "-rotate-90"
                                                          : "rotate-0"
                                                      }`}
                                                    />
                                                  </button>
                                                  {subgroup.groupName}
                                                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                                                    ({subgroup.items.length})
                                                  </span>
                                                </div>
                                              </TableCell>
                                            </TableRow>

                                            {/* Subgroup Items */}
                                            {shouldShowSubgroupItems &&
                                              subgroup.items.map((item, itemIndex) => {
                                                const isArchive = isArchiveContentType(item);
                                                const nestedFiles = isArchive
                                                  ? getArchiveFiles(item)
                                                  : [];

                                                // Extract featured image URL properly
                                                let featuredImage = null;
                                                if (
                                                  item.featured_media_url &&
                                                  typeof item.featured_media_url === "string" &&
                                                  item.featured_media_url.startsWith("http")
                                                ) {
                                                  featuredImage = item.featured_media_url;
                                                } else if (
                                                  item.image &&
                                                  typeof item.image === "string" &&
                                                  item.image.startsWith("http")
                                                ) {
                                                  featuredImage = item.image;
                                                } else if (
                                                  item._embedded?.["wp:featuredmedia"]?.[0]
                                                    ?.source_url
                                                ) {
                                                  featuredImage =
                                                    item._embedded["wp:featuredmedia"][0]
                                                      .source_url;
                                                }

                                                // For archives, if no featured image, use the first image from manifest
                                                if (
                                                  !featuredImage &&
                                                  isArchive &&
                                                  nestedFiles.length > 0
                                                ) {
                                                  const firstImageFile = nestedFiles.find(
                                                    (file) => file.featured_media_url
                                                  );
                                                  if (firstImageFile) {
                                                    featuredImage =
                                                      firstImageFile.featured_media_url;
                                                  }
                                                }

                                                // Check if this item is an archive with files
                                                const archiveData = item._raw || {};
                                                const extractionStatus =
                                                  archiveData.archiveExtractionStatus || "unknown";
                                                const manifest =
                                                  archiveData.archiveManifest?.filter(
                                                    (file) => file !== null
                                                  ) || [];
                                                const hasArchiveFiles =
                                                  isArchive &&
                                                  extractionStatus === "completed" &&
                                                  manifest.length > 0;
                                                const isArchiveCollapsed =
                                                  openAccordionId !== `archive-${item.id}`;
                                                const shouldShowArchiveFiles =
                                                  hasArchiveFiles && !isArchiveCollapsed;

                                                return (
                                                  <React.Fragment key={item.id}>
                                                    {/* Main item row */}
                                                    <TableRow
                                                      className={`transition-all duration-200 ${
                                                        isSubgroupCollapsing
                                                          ? "-translate-y-2 opacity-0"
                                                          : "translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2"
                                                      }`}
                                                      style={{
                                                        animationDelay: isSubgroupCollapsing
                                                          ? "0ms"
                                                          : `${itemIndex * 30}ms`,
                                                        animationFillMode: "backwards",
                                                      }}
                                                    >
                                                      <TableCell className="w-16 p-2">
                                                        {featuredImage ? (
                                                          <div
                                                            className="relative aspect-square w-12 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setLightboxImage(featuredImage);
                                                            }}
                                                          >
                                                            <img
                                                              src={featuredImage}
                                                              alt=""
                                                              className="h-full w-full object-cover"
                                                            />
                                                          </div>
                                                        ) : (
                                                          <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                            <File className="h-4 w-4 text-muted-foreground" />
                                                          </div>
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="pl-12 font-medium">
                                                        <div className="flex items-center gap-2">
                                                          {hasArchiveFiles && (
                                                            <button
                                                              onClick={() =>
                                                                toggleArchiveCollapse(
                                                                  `archive-${item.id}`
                                                                )
                                                              }
                                                              className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-gray-200/50"
                                                              aria-label={
                                                                isArchiveCollapsed
                                                                  ? "Expand archive files"
                                                                  : "Collapse archive files"
                                                              }
                                                            >
                                                              <ChevronDown
                                                                className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                                                                  isArchiveCollapsed
                                                                    ? "-rotate-90"
                                                                    : "rotate-0"
                                                                }`}
                                                              />
                                                            </button>
                                                          )}
                                                          <div
                                                            dangerouslySetInnerHTML={{
                                                              __html: item.title,
                                                            }}
                                                          />
                                                          {hasArchiveFiles && (
                                                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                              <ArchiveIcon className="h-3 w-3" />
                                                              {manifest.length} files
                                                            </span>
                                                          )}
                                                        </div>
                                                      </TableCell>
                                                      <TableCell>
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                          {item.format || "standard"}
                                                        </span>
                                                      </TableCell>
                                                      <TableCell className="text-sm text-muted-foreground">
                                                        {item.date
                                                          ? new Date(item.date).toLocaleDateString()
                                                          : "N/A"}
                                                      </TableCell>
                                                      <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                          <a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                          >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            View
                                                          </a>
                                                        </Button>
                                                      </TableCell>
                                                    </TableRow>

                                                    {/* Archive file child rows */}
                                                    {shouldShowArchiveFiles &&
                                                      manifest.map((file, fileIndex) => {
                                                        const fileImageUrl =
                                                          file.url || file.thumbnail;

                                                        return (
                                                          <TableRow
                                                            key={`${item.id}-file-${fileIndex}`}
                                                            className="border-l-2 border-l-blue-200 bg-gray-50/50"
                                                          >
                                                            <TableCell className="w-16 p-2 pl-8">
                                                              {file.isImage && file.thumbnail ? (
                                                                <div
                                                                  className="relative aspect-square w-10 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setLightboxImage(fileImageUrl);
                                                                  }}
                                                                >
                                                                  <img
                                                                    src={file.thumbnail}
                                                                    alt={file.name || ""}
                                                                    className="h-full w-full object-cover"
                                                                  />
                                                                </div>
                                                              ) : (
                                                                <div className="flex aspect-square w-10 items-center justify-center rounded bg-muted">
                                                                  <File className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                              )}
                                                            </TableCell>
                                                            <TableCell className="pl-20 text-sm">
                                                              <div className="flex items-center gap-2">
                                                                <span className="text-muted-foreground">
                                                                  ↳
                                                                </span>
                                                                <span className="font-medium">
                                                                  {file.title}
                                                                </span>
                                                              </div>
                                                              <div className="text-xs text-muted-foreground">
                                                                {file.mimeType || "Unknown type"}
                                                              </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">
                                                              {file.fileSize}
                                                            </TableCell>
                                                            <TableCell></TableCell>
                                                            <TableCell className="text-right">
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                              >
                                                                <a
                                                                  href={file.link || "#"}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                >
                                                                  <Download className="mr-2 h-3 w-3" />
                                                                  Download
                                                                </a>
                                                              </Button>
                                                            </TableCell>
                                                          </TableRow>
                                                        );
                                                      })}
                                                  </React.Fragment>
                                                );
                                              })}
                                          </React.Fragment>
                                        );
                                      })}
                                    </>
                                  ) : (
                                    // Render flat items directly
                                    group.items.map((item, itemIndex) => {
                                      const isArchive = isArchiveContentType(item);
                                      const nestedFiles = isArchive ? getArchiveFiles(item) : [];

                                      // Extract featured image URL properly
                                      let featuredImage = null;
                                      if (
                                        item.featured_media_url &&
                                        typeof item.featured_media_url === "string" &&
                                        item.featured_media_url.startsWith("http")
                                      ) {
                                        featuredImage = item.featured_media_url;
                                      } else if (
                                        item.image &&
                                        typeof item.image === "string" &&
                                        item.image.startsWith("http")
                                      ) {
                                        featuredImage = item.image;
                                      } else if (
                                        item._embedded?.["wp:featuredmedia"]?.[0]?.source_url
                                      ) {
                                        featuredImage =
                                          item._embedded["wp:featuredmedia"][0].source_url;
                                      }

                                      // For archives, if no featured image, use the first image from manifest
                                      if (!featuredImage && isArchive && nestedFiles.length > 0) {
                                        const firstImageFile = nestedFiles.find(
                                          (file) => file.featured_media_url
                                        );
                                        if (firstImageFile) {
                                          featuredImage = firstImageFile.featured_media_url;
                                        }
                                      }

                                      // Check if this item is an archive with files
                                      const archiveData = item._raw || {};
                                      const extractionStatus =
                                        archiveData.archiveExtractionStatus || "unknown";
                                      const manifest =
                                        archiveData.archiveManifest?.filter(
                                          (file) => file !== null
                                        ) || [];
                                      const hasArchiveFiles =
                                        isArchive &&
                                        extractionStatus === "completed" &&
                                        manifest.length > 0;
                                      const isArchiveCollapsed =
                                        openAccordionId !== `archive-${item.id}`;
                                      const shouldShowArchiveFiles =
                                        hasArchiveFiles && !isArchiveCollapsed;

                                      return (
                                        <React.Fragment key={item.id}>
                                          {/* Main item row */}
                                          <TableRow
                                            className={`transition-all duration-200 ${
                                              isGroupCollapsing
                                                ? "-translate-y-2 opacity-0"
                                                : "translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2"
                                            }`}
                                            style={{
                                              animationDelay: isGroupCollapsing
                                                ? "0ms"
                                                : `${itemIndex * 30}ms`,
                                              animationFillMode: "backwards",
                                            }}
                                          >
                                            <TableCell className="w-16 p-2">
                                              {featuredImage ? (
                                                <div className="relative aspect-square w-12 overflow-hidden rounded">
                                                  <img
                                                    src={featuredImage}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                  />
                                                </div>
                                              ) : (
                                                <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                  <File className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="pl-8 font-medium">
                                              <div className="flex items-center gap-2">
                                                {hasArchiveFiles && (
                                                  <button
                                                    onClick={() =>
                                                      toggleArchiveCollapse(`archive-${item.id}`)
                                                    }
                                                    className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-gray-200/50"
                                                    aria-label={
                                                      isArchiveCollapsed
                                                        ? "Expand archive files"
                                                        : "Collapse archive files"
                                                    }
                                                  >
                                                    <ChevronDown
                                                      className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                                                        isArchiveCollapsed
                                                          ? "-rotate-90"
                                                          : "rotate-0"
                                                      }`}
                                                    />
                                                  </button>
                                                )}
                                                <div
                                                  dangerouslySetInnerHTML={{ __html: item.title }}
                                                />
                                                {hasArchiveFiles && (
                                                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                    <ArchiveIcon className="h-3 w-3" />
                                                    {manifest.length} files
                                                  </span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                {item.format || "standard"}
                                              </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                              {item.date
                                                ? new Date(item.date).toLocaleDateString()
                                                : "N/A"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" asChild>
                                                <a
                                                  href={item.link}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  <Download className="mr-2 h-4 w-4" />
                                                  View
                                                </a>
                                              </Button>
                                            </TableCell>
                                          </TableRow>

                                          {/* Archive file child rows */}
                                          {shouldShowArchiveFiles &&
                                            manifest.map((file, fileIndex) => (
                                              <TableRow
                                                key={`${item.id}-file-${fileIndex}`}
                                                className="border-l-2 border-l-blue-200 bg-gray-50/50"
                                              >
                                                <TableCell className="w-16 p-2 pl-8">
                                                  {file.isImage && file.thumbnail ? (
                                                    <div className="relative aspect-square w-10 overflow-hidden rounded">
                                                      <img
                                                        src={file.thumbnail}
                                                        alt={file.name || ""}
                                                        className="h-full w-full object-cover"
                                                      />
                                                    </div>
                                                  ) : (
                                                    <div className="flex aspect-square w-10 items-center justify-center rounded bg-muted">
                                                      <File className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                  )}
                                                </TableCell>
                                                <TableCell className="pl-16 text-sm">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">↳</span>
                                                    <span className="font-medium">{file.name}</span>
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {file.mimeType || "Unknown type"}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                  {formatFileSize(file.size)}
                                                  {file.isImage && file.width && file.height && (
                                                    <div className="mt-0.5">
                                                      {file.width} × {file.height}
                                                    </div>
                                                  )}
                                                </TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right">
                                                  <Button variant="ghost" size="sm" asChild>
                                                    <a
                                                      href={file.url || "#"}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                    >
                                                      <Download className="mr-2 h-3 w-3" />
                                                      Download
                                                    </a>
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                        </React.Fragment>
                                      );
                                    })
                                  ))}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : items.display_type === "accordion" ? (
                  // Render grouped data as accordion
                  <div className="space-y-4">
                    {/* Render uncategorized/standard items first, without accordion */}
                    {items.groups
                      .filter(
                        (g) =>
                          g.groupKey === "uncategorized" || g.groupKey === "content_type_standard"
                      )
                      .map((group, groupIndex) => (
                        <div key={`group-${group.groupKey}-${groupIndex}`}>
                          {viewMode === "grid" ? (
                            <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
                              {group.items.map((item) => (
                                <CardComponent
                                  key={item.id}
                                  item={item}
                                  templateId={templateId}
                                  cardFields={cardFields}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.items.map((item) => {
                                    // Extract featured image URL
                                    let featuredImage = null;
                                    if (
                                      item.featured_media_url &&
                                      typeof item.featured_media_url === "string" &&
                                      item.featured_media_url.startsWith("http")
                                    ) {
                                      featuredImage = item.featured_media_url;
                                    } else if (
                                      item.image &&
                                      typeof item.image === "string" &&
                                      item.image.startsWith("http")
                                    ) {
                                      featuredImage = item.image;
                                    } else if (
                                      item._embedded?.["wp:featuredmedia"]?.[0]?.source_url
                                    ) {
                                      featuredImage =
                                        item._embedded["wp:featuredmedia"][0].source_url;
                                    }

                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell className="w-16 p-2">
                                          {featuredImage ? (
                                            <div className="relative aspect-square w-12 overflow-hidden rounded">
                                              <img
                                                src={featuredImage}
                                                alt=""
                                                className="h-full w-full object-cover"
                                              />
                                            </div>
                                          ) : (
                                            <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                              <File className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          <div dangerouslySetInnerHTML={{ __html: item.title }} />
                                        </TableCell>
                                        <TableCell>
                                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                            {item.format || "standard"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                          {item.date
                                            ? new Date(item.date).toLocaleDateString()
                                            : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button variant="ghost" size="sm" asChild>
                                            <a
                                              href={item.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Download className="mr-2 h-4 w-4" />
                                              View
                                            </a>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ))}

                    {/* Render categorized items in accordion - accordion cards in grid layout */}
                    <Accordion type="single" collapsible className="w-full">
                      <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
                        {items.groups
                          .filter(
                            (g) =>
                              g.groupKey !== "uncategorized" &&
                              g.groupKey !== "content_type_standard"
                          )
                          .map((group, groupIndex) => {
                            // Check if nested grouping is enabled (not if subgroups exist)
                            // A group might have uncategorizedItems but no subgroups
                            const hasSubgroups = items._nested === true;

                            // Calculate total item count (including uncategorized)
                            const uncategorizedCount = group.uncategorizedItems
                              ? group.uncategorizedItems.length
                              : 0;
                            const totalCount = hasSubgroups
                              ? group.items.reduce(
                                  (sum, subgroup) => sum + subgroup.items.length,
                                  0
                                ) + uncategorizedCount
                              : group.items.length;

                            return (
                              <AccordionItem
                                key={`group-${group.groupKey}-${groupIndex}`}
                                value={`group-${group.groupKey}`}
                                className="rounded-md border bg-white shadow-sm"
                              >
                                <AccordionTrigger className="gap-4 px-4 py-4 hover:bg-muted/50">
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-semibold">{group.groupName}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ({totalCount} {totalCount === 1 ? "item" : "items"})
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4">
                                  {hasSubgroups ? (
                                    // Nested grouping: render uncategorized items first, then subgroups
                                    <div className="space-y-4">
                                      {/* Render uncategorized items at the top (no accordion) */}
                                      {group.uncategorizedItems &&
                                        group.uncategorizedItems.length > 0 && (
                                          <div
                                            className={`grid ${groupColumnClasses} ${gapClasses[gap]} mb-4`}
                                          >
                                            {group.uncategorizedItems.map((item) => (
                                              <CardComponent
                                                key={item.id}
                                                item={item}
                                                templateId={templateId}
                                                cardFields={cardFields}
                                              />
                                            ))}
                                          </div>
                                        )}

                                      {/* Render subgroups as nested accordions */}
                                      <Accordion
                                        type="single"
                                        collapsible
                                        className="w-full space-y-2"
                                      >
                                        {group.items.map((subgroup, subgroupIndex) => (
                                          <AccordionItem
                                            key={`subgroup-${group.groupKey}-${subgroup.groupKey}-${subgroupIndex}`}
                                            value={`subgroup-${group.groupKey}-${subgroup.groupKey}`}
                                            className="rounded-md border bg-muted/20"
                                          >
                                            <AccordionTrigger className="gap-2 px-3 py-2 hover:bg-muted/30">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                  {subgroup.groupName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  ({subgroup.items.length})
                                                </span>
                                              </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-3">
                                              <div
                                                className={`grid ${groupColumnClasses} ${gapClasses[gap]}`}
                                              >
                                                {subgroup.items.map((item) => (
                                                  <CardComponent
                                                    key={item.id}
                                                    item={item}
                                                    templateId={templateId}
                                                    cardFields={cardFields}
                                                  />
                                                ))}
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        ))}
                                      </Accordion>
                                    </div>
                                  ) : viewMode === "grid" ? (
                                    // Single level grouping - grid view
                                    <div
                                      className={`grid ${groupColumnClasses} ${gapClasses[gap]}`}
                                    >
                                      {group.items.map((item) => (
                                        <CardComponent
                                          key={item.id}
                                          item={item}
                                          templateId={templateId}
                                          cardFields={cardFields}
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-16">Image</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {group.items.map((item) => {
                                            const isArchive = isArchiveContentType(item);
                                            const nestedFiles = isArchive
                                              ? getArchiveFiles(item)
                                              : [];

                                            // Extract featured image URL
                                            let featuredImage = null;
                                            if (
                                              item.featured_media_url &&
                                              typeof item.featured_media_url === "string" &&
                                              item.featured_media_url.startsWith("http")
                                            ) {
                                              featuredImage = item.featured_media_url;
                                            } else if (
                                              item.image &&
                                              typeof item.image === "string" &&
                                              item.image.startsWith("http")
                                            ) {
                                              featuredImage = item.image;
                                            } else if (
                                              item._embedded?.["wp:featuredmedia"]?.[0]?.source_url
                                            ) {
                                              featuredImage =
                                                item._embedded["wp:featuredmedia"][0].source_url;
                                            }

                                            // For archives, if no featured image, use the first image from manifest
                                            if (
                                              !featuredImage &&
                                              isArchive &&
                                              nestedFiles.length > 0
                                            ) {
                                              const firstImageFile = nestedFiles.find(
                                                (file) => file.featured_media_url
                                              );
                                              if (firstImageFile) {
                                                featuredImage = firstImageFile.featured_media_url;
                                              }
                                            }

                                            return (
                                              <TableRow key={item.id}>
                                                <TableCell className="w-16 p-2">
                                                  {featuredImage ? (
                                                    <div className="relative aspect-square w-12 overflow-hidden rounded">
                                                      <img
                                                        src={featuredImage}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                      />
                                                    </div>
                                                  ) : (
                                                    <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                      <File className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                  )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                  <div
                                                    dangerouslySetInnerHTML={{ __html: item.title }}
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {item.format || "standard"}
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                  {item.date
                                                    ? new Date(item.date).toLocaleDateString()
                                                    : "N/A"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <Button variant="ghost" size="sm" asChild>
                                                    <a
                                                      href={item.link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                    >
                                                      <Download className="mr-2 h-4 w-4" />
                                                      View
                                                    </a>
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                      </div>
                    </Accordion>
                  </div>
                ) : (
                  // Render grouped data with default layout (list with headings)
                  <div className="space-y-8">
                    {console.log(
                      "🔍 ALL GROUPS:",
                      items.groups.map((g) => ({
                        key: g.groupKey,
                        name: g.groupName,
                        count: g.items.length,
                      }))
                    )}
                    {/* Render uncategorized/standard items first, without group heading */}
                    {(() => {
                      const uncategorizedStandardGroups = items.groups.filter(
                        (g) =>
                          g.groupKey === "uncategorized" || g.groupKey === "content_type_standard"
                      );
                      console.log(
                        "🟢 UNCATEGORIZED/STANDARD GROUPS (no heading):",
                        uncategorizedStandardGroups.map((g) => ({
                          key: g.groupKey,
                          name: g.groupName,
                        }))
                      );
                      return uncategorizedStandardGroups.map((group, groupIndex) => (
                        <div key={`group-${group.groupKey}-${groupIndex}`} className="space-y-4">
                          {viewMode === "grid" && (
                            <div className={`grid ${groupColumnClasses} ${gapClasses[gap]}`}>
                              {group.items.map((item) => (
                                <CardComponent
                                  key={item.id}
                                  item={item}
                                  templateId={templateId}
                                  cardFields={cardFields}
                                />
                              ))}
                            </div>
                          )}

                          {viewMode === "list" && (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.items.map((item) => {
                                    const isArchive = isArchiveContentType(item);
                                    const nestedFiles = isArchive ? getArchiveFiles(item) : [];
                                    const isCollapsed = openAccordionId !== item.id;
                                    const isCollapsing = collapsingArchives.has(item.id);
                                    const shouldShowFiles =
                                      isArchive && (!isCollapsed || isCollapsing);

                                    // Extract featured image URL properly
                                    let featuredImage = null;
                                    if (
                                      item.featured_media_url &&
                                      typeof item.featured_media_url === "string" &&
                                      item.featured_media_url.startsWith("http")
                                    ) {
                                      featuredImage = item.featured_media_url;
                                    } else if (
                                      item.image &&
                                      typeof item.image === "string" &&
                                      item.image.startsWith("http")
                                    ) {
                                      featuredImage = item.image;
                                    } else if (
                                      item._embedded?.["wp:featuredmedia"]?.[0]?.source_url
                                    ) {
                                      featuredImage =
                                        item._embedded["wp:featuredmedia"][0].source_url;
                                    }

                                    return (
                                      <React.Fragment key={item.id}>
                                        {/* Parent Archive Row */}
                                        <TableRow
                                          className={
                                            isArchive ? "bg-blue-50/50 hover:bg-blue-50" : ""
                                          }
                                        >
                                          <TableCell className="w-16 p-2">
                                            {featuredImage ? (
                                              <div className="relative aspect-square w-12 overflow-hidden rounded">
                                                <img
                                                  src={featuredImage}
                                                  alt=""
                                                  className="h-full w-full object-cover"
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                <File className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                              {isArchive && (
                                                <button
                                                  onClick={() => toggleArchiveCollapse(item.id)}
                                                  className="flex items-center justify-center rounded p-0.5 transition-colors hover:bg-blue-200/50"
                                                  aria-label={
                                                    isCollapsed ? "Expand files" : "Collapse files"
                                                  }
                                                >
                                                  <ChevronDown
                                                    className={`h-4 w-4 text-blue-600 transition-transform duration-200 ${
                                                      isCollapsed ? "-rotate-90" : "rotate-0"
                                                    }`}
                                                  />
                                                </button>
                                              )}
                                              {isArchive && (
                                                <ArchiveIcon className="h-4 w-4 text-blue-600" />
                                              )}
                                              <div
                                                dangerouslySetInnerHTML={{ __html: item.title }}
                                              />
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {isArchive ? (
                                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                <ArchiveIcon className="h-3 w-3" />
                                                Archive
                                              </span>
                                            ) : (
                                              <span className="text-sm text-muted-foreground">
                                                Post
                                              </span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {item.date
                                              ? new Date(item.date).toLocaleDateString()
                                              : "N/A"}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {item.link && (
                                              <Button variant="ghost" size="sm" asChild>
                                                <a href={item.link}>
                                                  {isArchive ? (
                                                    <Download className="mr-1 h-3 w-3" />
                                                  ) : null}
                                                  {isArchive ? "Download" : "View"}
                                                </a>
                                              </Button>
                                            )}
                                          </TableCell>
                                        </TableRow>

                                        {/* Nested Files (if Archive and not collapsed) */}
                                        {shouldShowFiles &&
                                          nestedFiles.map((file, fileIndex) => (
                                            <TableRow
                                              key={file.id}
                                              className={`bg-blue-50/30 transition-all duration-200 ${
                                                isCollapsing
                                                  ? "-translate-y-2 opacity-0"
                                                  : "translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2"
                                              }`}
                                              style={{
                                                animationDelay: isCollapsing
                                                  ? "0ms"
                                                  : `${fileIndex * 30}ms`,
                                                animationFillMode: "backwards",
                                              }}
                                            >
                                              <TableCell className="w-16 p-2">
                                                {file.featured_media_url ? (
                                                  <div className="relative aspect-square w-12 overflow-hidden rounded">
                                                    <img
                                                      src={file.featured_media_url}
                                                      alt=""
                                                      className="h-full w-full object-cover"
                                                    />
                                                  </div>
                                                ) : (
                                                  <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                    <File className="h-4 w-4 text-muted-foreground" />
                                                  </div>
                                                )}
                                              </TableCell>
                                              <TableCell className="pl-12">
                                                <div className="flex items-center gap-2 text-sm">
                                                  <File className="h-3 w-3 text-muted-foreground" />
                                                  {file.title}
                                                  <span className="text-xs text-muted-foreground">
                                                    ({file.fileSize})
                                                  </span>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                  File
                                                </span>
                                              </TableCell>
                                              <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                  —
                                                </span>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                  <a href={file.link}>
                                                    <Download className="mr-1 h-3 w-3" />
                                                    Download
                                                  </a>
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                      </React.Fragment>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ));
                    })()}

                    {/* Render categorized groups with headings */}
                    {(() => {
                      const categorizedGroups = items.groups.filter(
                        (g) =>
                          g.groupKey !== "uncategorized" && g.groupKey !== "content_type_standard"
                      );
                      console.log(
                        "🔴 CATEGORIZED GROUPS (with heading):",
                        categorizedGroups.map((g) => ({ key: g.groupKey, name: g.groupName }))
                      );
                      console.log("📊 show_group_titles:", items.show_group_titles);
                      return categorizedGroups.map((group, groupIndex) => (
                        <div key={`group-${group.groupKey}-${groupIndex}`} className="space-y-4">
                          {/* Show group title for categorized items */}
                          {items.show_group_titles && (
                            <h3 className="text-2xl font-bold">
                              {group.groupName} ({group.items.length})
                            </h3>
                          )}

                          {viewMode === "grid" && (
                            <div className={`grid ${groupColumnClasses} ${gapClasses[gap]}`}>
                              {group.items.map((item) => (
                                <CardComponent
                                  key={item.id}
                                  item={item}
                                  templateId={templateId}
                                  cardFields={cardFields}
                                />
                              ))}
                            </div>
                          )}

                          {viewMode === "list" && (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-16">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.items.map((item) => {
                                    const isArchive = isArchiveContentType(item);
                                    const nestedFiles = isArchive ? getArchiveFiles(item) : [];
                                    const isCollapsed = openAccordionId !== item.id;
                                    const isCollapsing = collapsingArchives.has(item.id);
                                    const shouldShowFiles =
                                      isArchive && (!isCollapsed || isCollapsing);

                                    // Extract featured image URL properly
                                    let featuredImage = null;
                                    if (
                                      item.featured_media_url &&
                                      typeof item.featured_media_url === "string" &&
                                      item.featured_media_url.startsWith("http")
                                    ) {
                                      featuredImage = item.featured_media_url;
                                    } else if (
                                      item.image &&
                                      typeof item.image === "string" &&
                                      item.image.startsWith("http")
                                    ) {
                                      featuredImage = item.image;
                                    } else if (
                                      item._embedded?.["wp:featuredmedia"]?.[0]?.source_url
                                    ) {
                                      featuredImage =
                                        item._embedded["wp:featuredmedia"][0].source_url;
                                    }

                                    // For archives, if no featured image, use the first image from manifest
                                    if (!featuredImage && isArchive && nestedFiles.length > 0) {
                                      const firstImageFile = nestedFiles.find(
                                        (file) => file.featured_media_url
                                      );
                                      if (firstImageFile) {
                                        featuredImage = firstImageFile.featured_media_url;
                                      }
                                    }

                                    return (
                                      <React.Fragment key={item.id}>
                                        {/* Parent Archive Row */}
                                        <TableRow
                                          className={
                                            isArchive
                                              ? "cursor-pointer bg-blue-50/50 hover:bg-blue-50"
                                              : ""
                                          }
                                          onClick={() =>
                                            isArchive && toggleArchiveCollapse(item.id)
                                          }
                                        >
                                          <TableCell className="w-16 p-2">
                                            {featuredImage ? (
                                              <div
                                                className="relative aspect-square w-12 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setLightboxImage(featuredImage);
                                                }}
                                              >
                                                <img
                                                  src={featuredImage}
                                                  alt=""
                                                  className="h-full w-full object-cover"
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                <File className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              {isArchive && (
                                                <ChevronDown
                                                  className={`h-4 w-4 text-blue-600 transition-transform duration-200 ${
                                                    isCollapsed ? "-rotate-90" : "rotate-0"
                                                  }`}
                                                />
                                              )}
                                              <a
                                                href={item.link || "#"}
                                                className="font-medium hover:underline"
                                              >
                                                {item.title}
                                              </a>
                                              {isArchive && (
                                                <Badge variant="secondary" className="ml-2">
                                                  {nestedFiles.length} file
                                                  {nestedFiles.length !== 1 ? "s" : ""}
                                                </Badge>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                              {item.format || "Standard"}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                              {item.date ? formatDate(item.date) : "—"}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                              <a href={item.link || "#"}>View</a>
                                            </Button>
                                          </TableCell>
                                        </TableRow>

                                        {/* Child File Rows */}
                                        {shouldShowFiles &&
                                          nestedFiles.map((file, fileIndex) => {
                                            const fileImageUrl =
                                              file.featured_media_url || file.link;

                                            return (
                                              <TableRow
                                                key={`${item.id}-file-${fileIndex}`}
                                                className="border-l-2 border-l-blue-200 bg-gray-50/50"
                                              >
                                                <TableCell className="w-16 p-2 pl-8">
                                                  {file.thumbnail ? (
                                                    <div
                                                      className="relative aspect-square w-12 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLightboxImage(fileImageUrl);
                                                      }}
                                                    >
                                                      <img
                                                        src={file.thumbnail}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                      />
                                                    </div>
                                                  ) : (
                                                    <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                                      <File className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                  )}
                                                </TableCell>
                                                <TableCell className="pl-12">
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <File className="h-3 w-3 text-muted-foreground" />
                                                    {file.title}
                                                    <span className="text-xs text-muted-foreground">
                                                      ({file.fileSize})
                                                    </span>
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <span className="text-xs text-muted-foreground">
                                                    File
                                                  </span>
                                                </TableCell>
                                                <TableCell>
                                                  <span className="text-sm text-muted-foreground">
                                                    —
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <Button variant="ghost" size="sm" asChild>
                                                    <a href={file.link}>
                                                      <Download className="mr-1 h-3 w-3" />
                                                      Download
                                                    </a>
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                      </React.Fragment>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                );
              })()
            ) : (
              // Render ungrouped data (original logic)
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
                    {items.map((item) => (
                      <CardComponent
                        key={item.id}
                        item={item}
                        templateId={templateId}
                        cardFields={cardFields}
                      />
                    ))}
                  </div>
                )}

                {/* Table/List View */}
                {viewMode === "list" && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Image</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const isArchive = isArchiveContentType(item);
                          const nestedFiles = isArchive ? getArchiveFiles(item) : [];
                          const isCollapsed = openAccordionId !== item.id;
                          const isCollapsing = collapsingArchives.has(item.id);
                          const shouldShowFiles = isArchive && (!isCollapsed || isCollapsing);

                          // Extract featured image URL properly
                          let featuredImage = null;
                          if (
                            item.featured_media_url &&
                            typeof item.featured_media_url === "string" &&
                            item.featured_media_url.startsWith("http")
                          ) {
                            featuredImage = item.featured_media_url;
                          } else if (
                            item.image &&
                            typeof item.image === "string" &&
                            item.image.startsWith("http")
                          ) {
                            featuredImage = item.image;
                          } else if (item._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
                            featuredImage = item._embedded["wp:featuredmedia"][0].source_url;
                          }

                          // For archives, if no featured image, use the first image from manifest
                          if (!featuredImage && isArchive && nestedFiles.length > 0) {
                            console.log(
                              "[Table View] Looking for first image in nestedFiles:",
                              nestedFiles
                            );
                            const firstImageFile = nestedFiles.find(
                              (file) => file.featured_media_url
                            );
                            console.log("[Table View] Found first image file:", firstImageFile);
                            if (firstImageFile) {
                              featuredImage = firstImageFile.featured_media_url;
                              console.log("[Table View] Using featured image:", featuredImage);
                            }
                          }
                          console.log(
                            "[Table View] Final featuredImage for item",
                            item.id,
                            ":",
                            featuredImage
                          );

                          return (
                            <React.Fragment key={item.id}>
                              {/* Parent Archive Row */}
                              <TableRow
                                className={
                                  isArchive ? "cursor-pointer bg-blue-50/50 hover:bg-blue-50" : ""
                                }
                                onClick={() => isArchive && toggleArchiveCollapse(item.id)}
                              >
                                <TableCell className="w-16 p-2">
                                  {featuredImage ? (
                                    <div
                                      className="relative aspect-square w-12 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent row toggle
                                        setLightboxImage(featuredImage);
                                      }}
                                    >
                                      <img
                                        src={featuredImage}
                                        alt=""
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                      <File className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {isArchive && (
                                      <ChevronDown
                                        className={`h-4 w-4 text-blue-600 transition-transform duration-200 ${
                                          isCollapsed ? "-rotate-90" : "rotate-0"
                                        }`}
                                      />
                                    )}
                                    {isArchive && <ArchiveIcon className="h-4 w-4 text-blue-600" />}
                                    <div dangerouslySetInnerHTML={{ __html: item.title }} />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isArchive ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                      <ArchiveIcon className="h-3 w-3" />
                                      Archive
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Post</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {item.date ? new Date(item.date).toLocaleDateString() : "N/A"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.link && (
                                    <Button variant="ghost" size="sm" asChild>
                                      <a href={item.link}>
                                        {isArchive ? <Download className="mr-1 h-3 w-3" /> : null}
                                        {isArchive ? "Download" : "View"}
                                      </a>
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>

                              {/* Nested Files (if Archive and not collapsed) */}
                              {shouldShowFiles &&
                                nestedFiles.map((file, fileIndex) => {
                                  // Use file.url (direct file URL) as the image source for nested files
                                  const fileImageUrl = file.featured_media_url || file.link;

                                  return (
                                    <TableRow
                                      key={file.id}
                                      className={`bg-blue-50/30 transition-all duration-200 ${
                                        isCollapsing
                                          ? "-translate-y-2 opacity-0"
                                          : "translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2"
                                      }`}
                                      style={{
                                        animationDelay: isCollapsing
                                          ? "0ms"
                                          : `${fileIndex * 30}ms`,
                                        animationFillMode: "backwards",
                                      }}
                                    >
                                      <TableCell className="w-16 p-2">
                                        {fileImageUrl ? (
                                          <div
                                            className="relative aspect-square w-12 cursor-zoom-in overflow-hidden rounded transition-transform hover:scale-105"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLightboxImage(fileImageUrl);
                                            }}
                                          >
                                            <img
                                              src={fileImageUrl}
                                              alt=""
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex aspect-square w-12 items-center justify-center rounded bg-muted">
                                            <File className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="pl-12">
                                        <div className="flex items-center gap-2 text-sm">
                                          <File className="h-3 w-3 text-muted-foreground" />
                                          {file.title}
                                          <span className="text-xs text-muted-foreground">
                                            ({file.fileSize})
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-xs text-muted-foreground">File</span>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-sm text-muted-foreground">—</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                          <a href={file.link}>
                                            <Download className="mr-1 h-3 w-3" />
                                            Download
                                          </a>
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Lightbox Dialog for Image Preview */}
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-h-[90vh] max-w-[90vw] p-0">
            <div className="relative flex items-center justify-center">
              <img
                src={lightboxImage}
                alt="Preview"
                className="max-h-[90vh] max-w-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </StyleWrapper>
    );
  },
};
