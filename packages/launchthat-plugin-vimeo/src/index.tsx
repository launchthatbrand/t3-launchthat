import type { PluginDefinition } from "launchthat-plugin-core";
import { VimeoLibrary } from "./admin/VimeoLibrary";

export const vimeoPlugin: PluginDefinition = {
  id: "vimeo",
  name: "Vimeo",
  description: "Surface videos from your Vimeo workspace inside the media hub.",
  longDescription:
    "Adds a Vimeo tab to the media library so editors can browse external video assets alongside native uploads.",
  features: [
    "Archive tab dedicated to Vimeo content",
    "Quick access link underneath the Media nav item",
    "Mocked data layer ready for a Vimeo API integration",
  ],
  postTypes: [
    {
      name: "Attachments",
      slug: "attachments",
      description: "Media files uploaded to the media library.",
      isPublic: false,
      supports: {
        title: true,
        featuredImage: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "attachment",
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "posts",
      storageTables: ["posts", "postsMeta"],
      adminArchiveView: {
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Upload and manage attachments.",
            usesDefaultArchive: true,
          },
          {
            id: "vimeo",
            slug: "vimeo",
            label: "Vimeo",
            description:
              "Browse the mock Vimeo library (replace with Vimeo API data later).",
            render: () => <VimeoLibrary />,
          },
        ],
      },
    },
  ],
  activation: {
    optionKey: "plugin_vimeo_enabled",
    optionType: "site",
    defaultEnabled: true,
  },
  adminMenus: [
    {
      label: "Vimeo",
      slug: "edit?post_type=attachments&tab=vimeo",
      icon: "Video",
      position: 31,
      parentPostTypeSlug: "attachments",
    },
  ],
};

export default vimeoPlugin;
