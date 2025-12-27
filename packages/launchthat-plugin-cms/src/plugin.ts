import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";

import { CmsSettingsPage } from "./CmsSettingsPage";

export const PLUGIN_ID = "cms" as const;

export interface CmsPluginOptions {
  adminMenus?: PluginDefinition["adminMenus"];
}

const defaultOptions: CmsPluginOptions = {};

export const createCmsPluginDefinition = (
  options: CmsPluginOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Contacts & CRM",
  description: "Lightweight contact management sourced from Convex contacts.",
  longDescription:
    "Adds CRM-style contact management, tagging, and segmentation backed by the Convex contacts table—without adding another post type.",
  features: [
    "Contact directory with tagging and customer types",
    "Lead status tracking and basic CRM filters",
    "Admin create/edit/delete flows backed by Convex contacts table",
    "Import/export utilities for external sources",
  ],
  postTypes: [
    {
      name: "Contacts",
      slug: "contact",
      description: "CRM contacts managed by the built-in CRM plugin.",
      isPublic: false,
      supports: {
        title: true,
        customFields: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "contact",
      },
      adminMenu: {
        enabled: true,
        label: "Contacts",
        icon: "Users",
        parent: "crm",
        position: 25,
      },
      storageKind: "custom",
      storageTables: ["contacts", "contact_meta"],
      includeTimestamps: true,
    },
  ],
  activation: {
    optionKey: "plugin_cms_enabled",
    optionType: "site",
    defaultEnabled: false,
  },
  settingsPages: [
    {
      id: "cms-settings",
      slug: "settings",
      label: "Settings",
      description: "Configure the Contacts & CRM plugin.",
      render: () => createElement(CmsSettingsPage),
    },
  ],
  adminMenus: options.adminMenus ?? [
    {
      label: "Contacts",
      slug: "contacts",
      icon: "Users",
      position: 25,
      group: "crm",
    },
  ],
});

export const cmsPlugin: PluginDefinition = createCmsPluginDefinition();


