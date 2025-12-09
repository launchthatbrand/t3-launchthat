import type { PluginDefinition } from "launchthat-plugin-core";

import { TriggerRulesMetaBox } from "./admin/metaBoxes/TriggerRulesMetaBox";

export { SupportChatWidget } from "./components/SupportChatWidget";
export type { SupportChatWidgetProps } from "./components/SupportChatWidget";
export { SupportSystem } from "./admin/SupportSystem";
export type { SupportChatSettings, SupportChatFieldToggles } from "./settings";
export {
  openSupportAssistantExperience,
  SUPPORT_ASSISTANT_EVENT,
  DEFAULT_ASSISTANT_EXPERIENCE_ID,
  LMS_QUIZ_ASSISTANT_EXPERIENCE_ID,
  type AssistantExperienceTrigger,
} from "./assistant/experiences";
export {
  SUPPORT_OPENAI_NODE_TYPE,
  buildSupportOpenAiOwnerKey,
} from "./assistant/openai";
export {
  defaultSupportChatSettings,
  supportChatSettingsOptionKey,
} from "./settings";

export const supportPlugin: PluginDefinition = {
  id: "support",
  name: "Support",
  description: "Unified helpdesk with optional AI assistance.",
  longDescription:
    "Adds the full support toolkit: knowledge articles, trigger phrases, the customer chat bubble, and the portal-side conversations dashboard. AI responses can be enabled on top of the manual workflow when desired.",
  features: [
    "Floating chat widget with trigger-word routing",
    "Org-scoped helpdesk article post type",
    "Article-level trigger phrases with priority controls",
    "Manual conversation dashboard for agents",
    "Optional AI-generated replies that read your articles",
    "Plugin-managed lifecycle & settings pages",
  ],
  postTypes: [
    {
      name: "Helpdesk Articles",
      slug: "helpdeskarticles",
      description:
        "Long-form answers and docs that can power the support widget.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        attachments: true,
        featuredImage: true,
        customFields: true,
        postMeta: true,
        taxonomy: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "helpdesk-article",
        withFront: true,
        feeds: false,
        pages: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "posts",
      storageTables: ["posts", "postsMeta"],
      metaBoxes: [
        {
          id: "helpdesk-trigger-meta",
          title: "Trigger Rules",
          description:
            "Configure how this article should be suggested when visitors ask questions.",
          location: "sidebar",
          priority: 10,
          fieldKeys: [
            "trigger_is_active",
            "trigger_match_mode",
            "trigger_priority",
            "trigger_phrases",
          ],
          rendererKey: "support.helpdesk.triggerRules",
        },
      ],
      metaBoxRenderers: {
        "support.helpdesk.triggerRules": TriggerRulesMetaBox,
      },
      singleView: {
        basePath: "/admin/support/helpdesk-articles",
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Edit article content, slug, and SEO settings.",
            usesDefaultEditor: true,
            useDefaultMainMetaBoxes: false,
            useDefaultSidebarMetaBoxes: true,
          },
          {
            id: "trigger-rules",
            slug: "trigger-rules",
            label: "Trigger Rules",
            description: "Tune the trigger phrases and match behavior.",
            usesDefaultEditor: true,
            showGeneralPanel: false,
            showCustomFieldsPanel: false,
            mainMetaBoxIds: ["helpdesk-trigger-meta"],
            useDefaultSidebarMetaBoxes: true,
          },
        ],
      },
    },
    {
      name: "Support Conversations",
      slug: "supportconversations",
      description: "Conversation threads captured from the support widget.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        customFields: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "custom",
      storageTables: ["supportConversations"],
    },
    {
      name: "Support Threads",
      slug: "supportthreads",
      description: "Individual messages inside a conversation thread.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        editor: true,
        customFields: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "custom",
      storageTables: ["supportMessages"],
    },
    {
      name: "Support RAG Sources",
      slug: "supportragsources",
      description: "Knowledge source registry for AI answer generation.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        customFields: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "custom",
      storageTables: ["supportRagSources"],
    },
  ],
  activation: {
    optionKey: "plugin_support_enabled",
    optionType: "site",
    defaultEnabled: false,
  },
  adminMenus: [
    {
      label: "Support",
      slug: "support",
      icon: "MessageCircle",
      position: 60,
      group: "support",
    },
  ],
};

export default supportPlugin;
