import type { PluginDefinition } from "launchthat-plugin-core";

import { configureVimeoPlugin } from "./config";

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

export { configureVimeoPlugin };

export const vimeoPlugin: PluginDefinition = {
  id: "vimeo",
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
    optionKey: "plugin_vimeo_enabled",
    optionType: "site",
    defaultEnabled: false,
  },
  // Vimeo is surfaced as a tab under Media settings (Portal-owned route),
  // not as a new admin menu item underneath Attachments.
  adminMenus: [],
};

export default vimeoPlugin;
