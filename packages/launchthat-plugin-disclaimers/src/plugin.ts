import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";

import { DisclaimersTemplatePdfMetaBox } from "./admin/metaBoxes/DisclaimersTemplatePdfMetaBox";
import { DisclaimersOverviewPage } from "./admin/OverviewPage";
import { DisclaimersSettingsPage } from "./admin/SettingsPage";

export const PLUGIN_ID = "disclaimers" as const;
export type PluginId = typeof PLUGIN_ID;

export type CreateDisclaimersPluginDefinitionOptions = Record<string, never>;

const defaultOptions: CreateDisclaimersPluginDefinitionOptions = {};

const DISCLAIMERS_COMPONENT_TABLES = [
  "launchthat_disclaimers:posts",
  "launchthat_disclaimers:postsMeta",
];

export const createDisclaimersPluginDefinition = (
  _options: CreateDisclaimersPluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Disclaimers",
  description: "Collect signed disclaimers from users.",
  longDescription:
    "Upload disclaimer PDFs, issue signing requests, and store signed evidence for compliance and chargeback defense.",
  features: [
    "Disclaimer template PDFs",
    "Manual issuing (name/email)",
    "Signature capture and signed PDF generation",
    "Audit metadata and download evidence",
  ],
  postTypes: [
    {
      name: "Disclaimers",
      slug: "disclaimers",
      description: "Issued disclaimers (pending and completed).",
      isPublic: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: { hasArchive: false, singleSlug: "disclaimer" },
      adminMenu: {
        enabled: true,
        label: "Disclaimers",
        icon: "FileSignature",
        position: 60,
      },
      storageKind: "component",
      storageTables: DISCLAIMERS_COMPONENT_TABLES,
      includeTimestamps: true,
    },
    {
      name: "Disclaimer Templates",
      slug: "disclaimertemplates",
      description: "PDF templates that recipients must review and sign.",
      isPublic: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "disclaimertemplate",
        withFront: true,
      },
      adminMenu: {
        enabled: true,
        label: "Templates",
        icon: "FileSignature",
        position: 61,
      },
      storageKind: "component",
      storageTables: DISCLAIMERS_COMPONENT_TABLES,
      includeTimestamps: true,
      metaBoxes: [
        {
          id: "disclaimers-template-pdf",
          title: "Template PDF",
          description:
            "Upload a PDF or choose one from the Media Library. Recipients will review and sign this document.",
          location: "sidebar",
          priority: 20,
          fieldKeys: [],
          rendererKey: "disclaimers.template.pdf",
        },
      ],
      metaBoxRenderers: {
        "disclaimers.template.pdf": DisclaimersTemplatePdfMetaBox,
      },
    },
  ],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
  settingsPages: [
    {
      id: "disclaimers-overview",
      slug: "overview",
      label: "Overview",
      description: "Shortcuts to Disclaimers and Templates.",
      render: (props) => createElement(DisclaimersOverviewPage, props),
    },
    {
      id: "disclaimers-settings",
      slug: "settings",
      label: "Settings",
      description: "Configure defaults and behavior for disclaimers.",
      render: (props) => createElement(DisclaimersSettingsPage, props),
    },
  ],
});

export const disclaimersPlugin: PluginDefinition =
  createDisclaimersPluginDefinition();
