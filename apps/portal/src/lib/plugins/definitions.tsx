import type { MenuItemInput, MenuSectionRef } from "~/lib/adminMenu";
import {
  SOCIAL_FEED_FRONTEND_PROVIDER_ID,
  configureSocialFeedPlugin,
  socialFeedPlugin,
} from "launchthat-plugin-socialfeed";

import type { PluginDefinition } from "./types";
import { PortalSocialFeedProvider } from "~/providers/SocialFeedProvider";
import { adminMenuRegistry } from "~/lib/adminMenu";
import { calendarPlugin } from "launchthat-plugin-calendar";
import { cmsPlugin } from "launchthat-plugin-cms";
import { commercePlugin } from "launchthat-plugin-commerce";
import { disclaimersPlugin } from "launchthat-plugin-disclaimers";
import { supportPlugin } from "launchthat-plugin-support";
import { lmsPlugin } from "launchthat-plugin-lms";
import { tasksPlugin } from "launchthat-plugin-tasks";
import { vimeoPlugin } from "launchthat-plugin-vimeo";

configureSocialFeedPlugin({
  providers: {
    [SOCIAL_FEED_FRONTEND_PROVIDER_ID]: PortalSocialFeedProvider,
  },
});

export const pluginDefinitions: PluginDefinition[] = [
  cmsPlugin,
  lmsPlugin,
  calendarPlugin,
  commercePlugin,
  socialFeedPlugin,
  tasksPlugin,
  supportPlugin,
  vimeoPlugin,
  disclaimersPlugin,
];

const SUPPORT_PAGE_ICON_MAP: Record<string, string> = {
  dashboard: "LayoutDashboard",
  conversations: "MessageSquare",
  "helpdesk-articles": "BookOpen",
  settings: "Settings",
};

const PLUGIN_ROOT_ICON_MAP: Record<string, string> = {
  support: "LifeBuoy",
  commerce: "ShoppingCart",
  lms: "GraduationCap",
  cms: "FileStack",
  calendar: "Calendar",
  socialfeed: "Share2",
  tasks: "ListChecks",
  vimeo: "Video",
  disclaimers: "FileSignature",
};

const registerPluginMenuSource = () => {
  if (typeof adminMenuRegistry.registerSource !== "function") {
    return;
  }

  adminMenuRegistry.registerSource("plugins:settings", (context) => {
    const isEnabled = context.isPluginEnabled ?? (() => true);

    const items: MenuItemInput[] = [];

    pluginDefinitions.forEach((plugin, pluginIndex) => {
      if (!plugin.settingsPages?.length || !isEnabled(plugin.id)) {
        return;
      }

      const section: MenuSectionRef = {
        id: plugin.id,
        label: plugin.name,
        order: pluginIndex + 50,
      };

      const rootId = `plugin:${plugin.id}`;
      const defaultPageSlug = plugin.settingsPages[0]?.slug ?? "settings";

      items.push({
        id: rootId,
        label: plugin.name,
        href: `/admin/edit?plugin=${plugin.id}&page=${defaultPageSlug}`,
        icon: getPluginRootIcon(plugin.id),
        order: pluginIndex,
        section,
      });

      plugin.settingsPages.forEach((page, pageIndex) => {
        items.push({
          id: `plugin:${plugin.id}:${page.slug}`,
          label: page.label,
          href: `/admin/edit?plugin=${plugin.id}&page=${page.slug}`,
          icon: getPluginPageIcon(plugin.id, page.slug),
          order: pageIndex,
          parentId: rootId,
        });
      });
    });

    return items;
  });
};

const getPluginPageIcon = (pluginId: string, pageSlug: string): string => {
  if (pluginId === "support") {
    return SUPPORT_PAGE_ICON_MAP[pageSlug] ?? "BookOpen";
  }
  if (pluginId === "commerce") {
    return pageSlug === "storefront" ? "ShoppingCart" : "Cog";
  }
  return "BookOpen";
};

const getPluginRootIcon = (pluginId: string): string => {
  return PLUGIN_ROOT_ICON_MAP[pluginId] ?? "Puzzle";
};

registerPluginMenuSource();
