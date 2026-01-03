import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";

import { CrmSettingsPage } from "./CrmSettingsPage";

export const PLUGIN_ID = "crm" as const;

export interface CrmPluginOptions {
  adminMenus?: PluginDefinition["adminMenus"];
}

const defaultOptions: CrmPluginOptions = {};

export const createCrmPluginDefinition = (
  options: CrmPluginOptions = defaultOptions,
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
    optionKey: "plugin_crm_enabled",
    optionType: "site",
    defaultEnabled: false,
  },
  settingsPages: [
    {
      id: "crm-settings",
      slug: "settings",
      label: "Settings",
      description: "Configure the Contacts & CRM plugin.",
      render: () => createElement(CrmSettingsPage),
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

export const crmPlugin: PluginDefinition = createCrmPluginDefinition();
