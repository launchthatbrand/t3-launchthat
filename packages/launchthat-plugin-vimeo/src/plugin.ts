import type { PluginDefinition } from "launchthat-plugin-core";
import { ADMIN_ATTACHMENTS_ARCHIVE_TABS_FILTER } from "launchthat-plugin-core/hookSlots";
import { createElement } from "react";

import { VimeoAttachmentsTab } from "./admin/VimeoAttachmentsTab";

export const PLUGIN_ID = "vimeo" as const;
export type PluginId = typeof PLUGIN_ID;

export type CreateVimeoPluginDefinitionOptions = Record<string, never>;

const defaultOptions: CreateVimeoPluginDefinitionOptions = {};

const buildVimeoFieldDefinitions = () => [
  {
    key: "vimeoVideoId",
    name: "Vimeo Video ID",
    description: "Captured automatically when embedding a Vimeo video.",
    type: "text",
    readOnly: true,
  },
  {
    key: "vimeoEmbedUrl",
    name: "Vimeo Embed URL",
    description: "Normalized Vimeo player URL used for the embed iframe.",
    type: "url",
    readOnly: true,
  },
  {
    key: "vimeoThumbnailUrl",
    name: "Vimeo Thumbnail URL",
    description: "Preview image associated with the selected Vimeo video.",
    type: "url",
    readOnly: true,
  },
];

export const createVimeoPluginDefinition = (
  _options: CreateVimeoPluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Vimeo",
  description: "Surface videos from your Vimeo workspace inside the media hub.",
  longDescription:
    "Adds Vimeo integration settings for your media system and enriches LMS embeds with Vimeo metadata.",
  features: [
    "Mocked data layer ready for a Vimeo API integration",
    "Captures Vimeo embed metadata (ID, embed URL, thumbnail URL) on supported LMS content",
  ],
  // IMPORTANT:
  // Attachments are a built-in Portal post type. This plugin must NOT register/override it,
  // otherwise it can accidentally disable the Attachments admin menu.
  postTypes: [],
  fieldRegistrations: [
    {
      postTypeSlug: "lessons",
      fields: buildVimeoFieldDefinitions(),
    },
    {
      postTypeSlug: "topics",
      fields: buildVimeoFieldDefinitions(),
    },
    {
      postTypeSlug: "quizzes",
      fields: buildVimeoFieldDefinitions(),
    },
  ],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
  // Vimeo is surfaced as a tab under Media settings (Portal-owned route),
  // not as a new admin menu item underneath Attachments.
  adminMenus: [],
  hooks: {
    filters: [
      {
        hook: ADMIN_ATTACHMENTS_ARCHIVE_TABS_FILTER,
        callback: (...args: unknown[]) => {
          const tabs = (args[0] as any[]) ?? [];
          const context =
            (args[1] as { postTypeSlug?: string } | undefined) ?? undefined;

          if (context?.postTypeSlug !== "attachments") {
            return tabs;
          }

          const next = [...tabs];
          next.push({
            id: "vimeo",
            label: "Vimeo",
            order: 10,
            condition: (ctx: unknown) => Boolean((ctx as any)?.organizationId),
            component: (props: any) =>
              createElement(VimeoAttachmentsTab, {
                organizationId: props.organizationId,
              }),
          });
          return next;
        },
        priority: 10,
        acceptedArgs: 2,
      },
    ],
  },
});

export const vimeoPlugin: PluginDefinition = createVimeoPluginDefinition();


