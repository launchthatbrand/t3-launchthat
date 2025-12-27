import type { PluginDefinition } from "launchthat-plugin-core";

export interface CmsPluginOptions {
  adminMenus?: PluginDefinition["adminMenus"];
}

const defaultOptions: CmsPluginOptions = {};

const CmsSettingsPage = () => {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">CMS Settings</div>
        <div className="text-muted-foreground text-sm">
          Configure the CRM/CMS plugin and jump to the Contacts admin.
        </div>
      </div>
      <div>
        <a className="text-primary underline" href="/admin/contacts">
          Open Contacts
        </a>
      </div>
    </div>
  );
};

const createCmsPluginDefinition = (
  options: CmsPluginOptions = defaultOptions,
): PluginDefinition => ({
  id: "cms",
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
      render: () => <CmsSettingsPage />,
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

export let cmsPlugin = createCmsPluginDefinition();

export const configureCmsPlugin = (options: CmsPluginOptions) => {
  cmsPlugin = createCmsPluginDefinition(options);
};

export default cmsPlugin;
