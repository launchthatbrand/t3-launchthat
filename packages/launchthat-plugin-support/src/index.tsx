import type { GenericId as Id } from "convex/values";
import type { PluginDefinition } from "launchthat-plugin-core";
import { ReactNode } from "react";
import Link from "next/link";

import { SidebarTrigger, Tabs, TabsList, TabsTrigger } from "@acme/ui";
import { ScrollArea, ScrollBar } from "@acme/ui/scroll-area";

import { registerSupportAdminMetaBoxes } from "./admin/metaBoxes";
import { TriggerRulesMetaBox } from "./admin/metaBoxes/TriggerRulesMetaBox";
import { SupportSystem } from "./admin/SupportSystem";
import { AnalyticsView } from "./admin/views/AnalyticsView";
import { DashboardView } from "./admin/views/DashboardView";
import { SettingsView } from "./admin/views/SettingsView";

type SupportPluginMenuItem = { id: string; label: string; href: string };
type SupportPluginMenuMap = Record<string, SupportPluginMenuItem[]>;

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

interface SupportTab {
  value: string;
  label: string;
  href: string;
}
type ArchiveLayoutContext = "default" | "plugin" | "content-only";
type PluginMenuItem = { id: string; label: string; href: string };
type PluginMenuMap = Record<string, PluginMenuItem[]>;

const SUPPORT_PLUGIN_ID = "support";

const buildTabsFromMenu = (items?: PluginMenuItem[]): SupportTab[] => {
  if (!items?.length) {
    return [];
  }
  return items.map((item) => ({
    value: item.id,
    label: item.label,
    href: item.href,
  }));
};

const POST_TYPE_TO_TAB: Record<string, string> = {
  helpdeskarticles: "helpdeskarticles",
  supportconversations: "supportconversations",
  supportthreads: "supportthreads",
  supportragsources: "supportragsources",
};

const SUPPORT_POST_TABLES = [
  "launchthat_support.posts",
  "launchthat_support.postsMeta",
] as const;

interface SupportArchiveHeaderProps {
  activeTab?: string;
  tabs?: SupportTab[];
}
const getValidTabValue = (value: string | undefined, tabs: SupportTab[]) => {
  if (!value) return undefined;
  return tabs.some((tab) => tab.value === value) ? value : undefined;
};

const SUPPORT_ARCHIVE_TABS: SupportTab[] = [
  {
    value: "helpdeskarticles",
    label: "Helpdesk Articles",
    href: "/admin/edit?post_type=helpdeskarticles",
  },
  {
    value: "supportconversations",
    label: "Conversations",
    href: "/admin/edit?post_type=supportconversations",
  },
  {
    value: "supportthreads",
    label: "Threads",
    href: "/admin/edit?post_type=supportthreads",
  },
  {
    value: "supportragsources",
    label: "RAG Sources",
    href: "/admin/edit?post_type=supportragsources",
  },
];

export const SupportArchiveHeader = ({
  activeTab,
  tabs: providedTabs,
}: SupportArchiveHeaderProps) => {
  const tabs = providedTabs?.length ? providedTabs : SUPPORT_ARCHIVE_TABS;
  const resolvedValue =
    getValidTabValue(activeTab, tabs) ?? tabs[0]?.value ?? "products";

  return (
    // <Tabs
    //   value={resolvedValue}
    //   onValueChange={() => {
    //     // Tabs are driven by navigation links; ignore internal state updates.
    //   }}
    //   className="w-full"
    // >
    //   <TabsList className="bg-background w-full flex-wrap justify-start gap-1 overflow-x-auto border-b">
    //     {STORE_ARCHIVE_TABS.map((tab) => (
    //       <TabsTrigger
    //         key={tab.value}
    //         value={tab.value}
    //         asChild
    //         className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
    //       >
    //         <Link href={tab.href} className="">
    //           {tab.label}
    //         </Link>
    //       </TabsTrigger>
    //     ))}
    //   </TabsList>
    // </Tabs>
    <div className="bg-muted flex w-full items-center justify-between gap-6">
      <Tabs value={resolvedValue}>
        {/* <ScrollArea className="w-full rounded-md border whitespace-nowrap">
         
        </ScrollArea> */}
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="rounded-none p-0 pt-2">
            {tabs.map((tab: SupportTab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
                className="data-[state=active]:border-b-primary data-[state=active]:border-b"
              >
                <Link
                  href={tab.href}
                  className="h-full rounded-xs data-[state=active]:border-b-2"
                >
                  {tab.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar
            orientation="horizontal"
            className="primary flex h-[5px]"
            style={{ "--border": "#bababa" } as React.CSSProperties}
          />
        </ScrollArea>
      </Tabs>
    </div>
  );
};

const SupportSettingsHeader = ({
  activeTab,
  tabs,
}: {
  activeTab?: string;
  tabs: SupportTab[];
}) => {
  const resolvedValue =
    (activeTab && tabs.some((tab) => tab.value === activeTab)
      ? activeTab
      : tabs[0]?.value) ?? "dashboard";

  return (
    <div className="bg-muted flex w-full flex-col gap-6">
      <Tabs value={resolvedValue}>
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="rounded-none p-0 pt-2">
            {tabs.map((tab: SupportTab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
                className="data-[state=active]:border-b-primary data-[state=active]:border-b"
              >
                <Link
                  href={tab.href}
                  className="h-full rounded-xs data-[state=active]:border-b-2"
                >
                  {tab.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar
            orientation="horizontal"
            className="primary flex h-[5px]"
            style={{ "--border": "#bababa" } as React.CSSProperties}
          />
        </ScrollArea>
      </Tabs>
    </div>
  );
};

const injectSupportArchiveHeader = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const typedContext = context as
    | {
        postType?: string;
        layout?: ArchiveLayoutContext;
        pluginMenus?: PluginMenuMap;
      }
    | undefined;

  const SUPPORTED_ARCHIVE_POST_TYPES = new Set([
    "helpdeskarticles",
    "supportconversations",
    "supportthreads",
    "supportragsources",
  ]);

  const layout = typedContext?.layout ?? "default";
  const shouldRender =
    layout !== "content-only" &&
    !!typedContext?.postType &&
    SUPPORTED_ARCHIVE_POST_TYPES.has(typedContext.postType);

  if (!shouldRender) {
    return nodes;
  }

  const menuTabs = buildTabsFromMenu(
    typedContext?.pluginMenus?.[SUPPORT_PLUGIN_ID],
  );
  const desiredTabId = typedContext?.postType
    ? `postType:${typedContext.postType}`
    : undefined;
  const hasMenuMatch = desiredTabId
    ? menuTabs.some((tab) => tab.value === desiredTabId)
    : false;
  const activeTab = hasMenuMatch
    ? desiredTabId
    : POST_TYPE_TO_TAB[typedContext?.postType ?? ""];

  return [
    ...nodes,
    <SupportArchiveHeader
      key="support-archive-header"
      activeTab={activeTab}
      tabs={menuTabs.length > 0 ? menuTabs : undefined}
    />,
  ];
};

const injectSupportSettingsHeader = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const ctx = context as
    | {
        pluginId?: string;
        pageSlug?: string;
        pluginMenus?: PluginMenuMap;
      }
    | undefined;

  if (ctx?.pluginId !== SUPPORT_PLUGIN_ID) {
    return nodes;
  }

  const menuTabs = buildTabsFromMenu(ctx.pluginMenus?.[SUPPORT_PLUGIN_ID]);
  if (menuTabs.length === 0) {
    return nodes;
  }

  const normalizedPage = ctx.pageSlug?.toLowerCase() ?? "";
  const matchedTab =
    menuTabs.find((tab) =>
      tab.href.toLowerCase().includes(`page=${normalizedPage}`),
    ) ?? menuTabs.find((tab) => tab.value === normalizedPage);

  return [
    ...nodes,
    <SupportSettingsHeader
      key="support-settings-header"
      activeTab={matchedTab?.value}
      tabs={menuTabs}
    />,
  ];
};

const suppressSupportHeader = (value: unknown, context?: unknown): boolean => {
  const ctx = context as { postType?: string } | undefined;
  if (ctx?.postType === "supportconversations") {
    return true;
  }
  return Boolean(value);
};

const suppressSupportContent = (value: unknown, context?: unknown): boolean => {
  const ctx = context as { postType?: string } | undefined;
  if (ctx?.postType === "supportconversations") {
    return true;
  }
  return Boolean(value);
};

// const suppressHelpdeskContent = (
//   value: unknown,
//   context?: unknown,
// ): boolean => {
//   const ctx = context as { postType?: string } | undefined;
//   if (ctx?.postType === "helpdeskarticles") {
//     return true;
//   }
//   return Boolean(value);
// };

const injectSupportArchiveContentBefore = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const ctx = context as
    | {
        postType?: string;
        organizationId?: string;
        pluginMenus?: SupportPluginMenuMap;
      }
    | undefined;

  if (ctx?.postType === "supportconversations") {
    // Hide the generic header/content block by inserting an empty fragment in its place
    // and letting the injected SupportArchiveHeader remain.
    return [...nodes, <></>];
  }

  return nodes;
};

const SETTINGS_PAGE_TO_TAB: Record<string, string> = {
  dashboard: "plugin:support:dashboard",
  analytics: "plugin:support:analytics",
  settings: "plugin:support:settings",
};

const injectSupportArchiveContent = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const ctx = context as
    | {
        postType?: string;
        organizationId?: string;
        pluginMenus?: SupportPluginMenuMap;
      }
    | undefined;

  if (ctx?.postType !== "supportconversations") {
    return nodes;
  }

  // Replace the default archive content with the full SupportSystem (includes sidebars).
  return [
    ...nodes,
    <SupportSystem
      key="support-archive-conversations"
      organizationId={(ctx?.organizationId ?? "unknown") as Id<"organizations">}
      params={{ segments: ["conversations"] }}
      buildNavHref={(slug) =>
        slug
          ? `/admin/edit?post_type=supportconversations&tab=${slug}`
          : "/admin/edit?post_type=supportconversations"
      }
    />,
  ];
};

// const injectHelpdeskArchiveContent = (
//   value: unknown,
//   context?: unknown,
// ): ReactNode[] => {
//   const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
//   const ctx = context as
//     | {
//         postType?: string;
//         organizationId?: string;
//         pluginMenus?: SupportPluginMenuMap;
//       }
//     | undefined;

//   if (ctx?.postType !== "helpdeskarticles") {
//     return nodes;
//   }

//   return [
//     ...nodes,
//     <ArticlesView
//       key="support-archive-helpdesk-articles"
//       organizationId={(ctx?.organizationId ?? "unknown") as Id<"organizations">}
//     />,
//   ];
// };

const buildSupportNavHref = (slug: string) => {
  switch (slug) {
    case "conversations":
      return "/admin/edit?post_type=supportconversations";
    case "articles":
      return "/admin/edit?post_type=helpdeskarticles";
    case "analytics":
      return "/admin/edit?plugin=support&page=analytics";
    case "settings":
      return "/admin/edit?plugin=support&page=settings";
    default:
      return "/admin/edit?plugin=support&page=dashboard";
  }
};

const coerceOrgId = (value?: string): Id<"organizations"> | undefined =>
  value ? (value as Id<"organizations">) : undefined;

const supportPluginDefinition: PluginDefinition = {
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
        enabled: true,
        label: "Helpdesk Articles",
        icon: "BookOpen",
        position: 61,
      },
      storageKind: "component",
      storageTables: [...SUPPORT_POST_TABLES],
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
        enabled: true,
        label: "Conversations",
        icon: "MessageSquare",
        position: 62,
        parent: "plugin:support",
      },
      storageKind: "component",
      storageTables: [...SUPPORT_POST_TABLES],
      singleView: {
        basePath: "/admin/edit",
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Edit conversation details.",
            usesDefaultEditor: true,
            showGeneralPanel: true,
            showCustomFieldsPanel: true,
            useDefaultMainMetaBoxes: true,
            useDefaultSidebarMetaBoxes: true,
          },
        ],
      },
      adminArchiveView: {
        showSidebar: false,
      },
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
      storageKind: "component",
      storageTables: [...SUPPORT_POST_TABLES],
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
      storageKind: "component",
      storageTables: [...SUPPORT_POST_TABLES],
    },
    {
      name: "Support Presence",
      slug: "supportpresence",
      description: "Agent presence records for conversations.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "component",
      storageTables: [...SUPPORT_POST_TABLES],
    },
    {
      name: "Support Email Settings",
      slug: "supportemailsettings",
      description: "Email intake and DNS configuration for support.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "component",
      storageTables: [...SUPPORT_POST_TABLES],
    },
    {
      name: "Support Canned Responses",
      slug: "supportcannedresponses",
      description: "Reusable canned responses for agents.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        editor: true,
        customFields: true,
        postMeta: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "component",
      storageTables: [...SUPPORT_POST_TABLES],
    },
  ],
  settingsPages: [
    {
      id: "support-dashboard",
      slug: "dashboard",
      label: "Dashboard",
      description: "See key metrics and quick links for support operations.",
      render: (props) => {
        const organizationId = coerceOrgId(props.organizationId);
        if (!organizationId) {
          return null;
        }
        return (
          <DashboardView
            organizationId={organizationId}
            buildNavHref={buildSupportNavHref}
          />
        );
      },
    },
    {
      id: "support-analytics",
      slug: "analytics",
      label: "Analytics",
      description: "Support analytics overview.",
      render: (props) => (
        <AnalyticsView organizationId={coerceOrgId(props.organizationId)} />
      ),
    },
    {
      id: "support-settings",
      slug: "settings",
      label: "Support Settings",
      description: "Configure support chat preferences.",
      render: (props) => {
        const organizationId = coerceOrgId(props.organizationId);
        if (!organizationId) {
          return null;
        }
        return <SettingsView organizationId={organizationId} />;
      },
    },
  ],
  activation: {
    optionKey: "plugin_support_enabled",
    optionType: "site",
    defaultEnabled: false,
  },
  admin: {
    bootstrap: registerSupportAdminMetaBoxes,
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
  hooks: {
    filters: [
      {
        hook: "admin.archive.header.before",
        priority: 10,
        acceptedArgs: 2,
        callback: injectSupportArchiveHeader,
      },
      {
        hook: "admin.archive.header.suppress",
        priority: 10,
        acceptedArgs: 2,
        callback: suppressSupportHeader,
      },
      {
        hook: "admin.archive.content.suppress",
        priority: 10,
        acceptedArgs: 2,
        callback: suppressSupportContent,
      },
      // {
      //   hook: "admin.archive.content.suppress",
      //   priority: 10,
      //   acceptedArgs: 2,
      //   callback: suppressHelpdeskContent,
      // },
      {
        hook: "admin.archive.content.before",
        priority: 5,
        acceptedArgs: 2,
        callback: injectSupportArchiveContentBefore,
      },
      {
        hook: "admin.archive.content.after",
        priority: 10,
        acceptedArgs: 2,
        callback: injectSupportArchiveContent,
      },
      // {
      //   hook: "admin.archive.content.after",
      //   priority: 10,
      //   acceptedArgs: 2,
      //   callback: injectHelpdeskArchiveContent,
      // },
      {
        hook: "admin.plugin.settings.header.before",
        priority: 10,
        acceptedArgs: 2,
        callback: injectSupportSettingsHeader,
      },
    ],
  },
};

export const createSupportPluginDefinition = (): PluginDefinition => ({
  ...supportPluginDefinition,
});

export const supportPlugin = createSupportPluginDefinition();

export default createSupportPluginDefinition;
