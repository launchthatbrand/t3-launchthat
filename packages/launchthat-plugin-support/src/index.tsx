import type { PluginDefinition } from "launchthat-plugin-core";

export { SupportChatWidget } from "./components/SupportChatWidget";
export type { SupportChatWidgetProps } from "./components/SupportChatWidget";
export { SupportSystem } from "./admin/SupportSystem";
export type { SupportChatSettings, SupportChatFieldToggles } from "./settings";
export {
  defaultSupportChatSettings,
  supportChatSettingsOptionKey,
} from "./settings";

export const supportPlugin: PluginDefinition = {
  id: "support",
  name: "AI Support Assistant",
  description: "Org-scoped AI support chat bubble.",
  longDescription:
    "Adds an AI-powered support chat bubble that can reference your organization’s FAQs, posts, and curated snippets stored in global knowledge tables.",
  features: [
    "Floating chat widget",
    "Org-scoped knowledge base",
    "Helpdesk article editor",
    "Conversation history in Convex",
    "Plugin-managed enable/disable lifecycle",
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
