import { calendarPlugin } from "launchthat-plugin-calendar";
import { crmPlugin } from "launchthat-plugin-crm";
import { disclaimersPlugin } from "launchthat-plugin-disclaimers";
import { createEcommercePluginDefinition } from "launchthat-plugin-ecommerce";
import { ecommerceAuthorizenetPlugin } from "launchthat-plugin-ecommerce-authorizenet";
import { ecommerceStripePlugin } from "launchthat-plugin-ecommerce-stripe";
import { lmsPlugin } from "launchthat-plugin-lms";
import {
  configureSocialFeedPlugin,
  SOCIAL_FEED_FRONTEND_PROVIDER_ID,
  socialFeedPlugin,
} from "launchthat-plugin-socialfeed";
import { supportPlugin } from "launchthat-plugin-support";
import { tasksPlugin } from "launchthat-plugin-tasks";
import { vimeoPlugin } from "launchthat-plugin-vimeo";

import type { PluginDefinition, PluginSettingDefinition } from "./types";
import type { MenuItemInput } from "~/lib/adminMenu";
import { renderProductSingle } from "~/components/commerce/ProductSingleRenderer";
import { adminMenuRegistry } from "~/lib/adminMenu";
import { registerPluginPageTemplates } from "~/lib/pageTemplates/registerPluginPageTemplates";
import { PortalSocialFeedProvider } from "~/providers/SocialFeedProvider";
import { portalCrmPlugin } from "./portalCrmPlugin";
import { portalNotificationsPlugin } from "./portalNotificationsPlugin";

configureSocialFeedPlugin({
  providers: {
    [SOCIAL_FEED_FRONTEND_PROVIDER_ID]: PortalSocialFeedProvider,
  },
});

registerPluginPageTemplates();

export const pluginDefinitions: PluginDefinition[] = [
  crmPlugin as unknown as PluginDefinition,
  lmsPlugin as unknown as PluginDefinition,
  calendarPlugin as unknown as PluginDefinition,
  socialFeedPlugin as unknown as PluginDefinition,
  tasksPlugin as unknown as PluginDefinition,
  supportPlugin as unknown as PluginDefinition,
  vimeoPlugin as unknown as PluginDefinition,
  disclaimersPlugin as unknown as PluginDefinition,
  portalCrmPlugin,
  portalNotificationsPlugin,
  createEcommercePluginDefinition({
    // `productsSingleRender` is intentionally loosely typed (accepts `any`) in the ecommerce plugin.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    frontend: { productsSingleRender: renderProductSingle as any },
  }) as unknown as PluginDefinition,
  ecommerceStripePlugin as unknown as PluginDefinition,
  ecommerceAuthorizenetPlugin as unknown as PluginDefinition,
];

const registerPluginMenuSource = () => {
  if (typeof adminMenuRegistry.registerSource !== "function") {
    return;
  }

  adminMenuRegistry.registerSource("plugins:nav", (context) => {
    const isEnabled = context.isPluginEnabled ?? (() => true);
    const pluginParents = (context.pluginParents ??
      ({} as Record<
        string,
        { parentId?: string; customPath?: string; mode?: "inline" | "group" }
      >)) as Record<
      string,
      { parentId?: string; customPath?: string; mode?: "inline" | "group" }
    >;

    const items: MenuItemInput[] = [];

    const getPluginPostTypeSlugsForGroup = (pluginId: string): string[] => {
      const parentId = `plugin:${pluginId}`;
      return Object.entries(pluginParents)
        .filter(
          ([, meta]) => meta.mode === "group" && meta.parentId === parentId,
        )
        .map(([slug]) => slug);
    };

    const shouldShowPluginRoot = (plugin: PluginDefinition): boolean => {
      if (!isEnabled(plugin.id)) return false;
      const hasPages = Boolean(plugin.settingsPages?.length);
      const groupPostTypeSlugs = getPluginPostTypeSlugsForGroup(plugin.id);
      return hasPages || groupPostTypeSlugs.length > 0;
    };

    const getDefaultPluginHref = (plugin: PluginDefinition): string => {
      const pages = plugin.settingsPages ?? [];
      const nonSettings = pages.filter((p) => p.slug !== "settings");
      const defaultPageSlug = nonSettings[0]?.slug ?? pages[0]?.slug ?? null;
      if (defaultPageSlug) {
        return `/admin/edit?plugin=${plugin.id}&page=${defaultPageSlug}`;
      }

      const postTypeSlug = getPluginPostTypeSlugsForGroup(plugin.id)[0];
      if (postTypeSlug) {
        return `/admin/edit?post_type=${encodeURIComponent(postTypeSlug)}`;
      }

      // Fallback (should be rare): send to the plugin listing.
      return "/admin/plugins";
    };

    const getPluginRootIcon = (_plugin: PluginDefinition): string => "Puzzle";

    const getSettingsPageIcon = (pageSlug: string): string =>
      pageSlug === "settings" ? "Settings" : "BookOpen";

    pluginDefinitions.forEach((plugin, pluginIndex) => {
      if (!shouldShowPluginRoot(plugin)) {
        return;
      }

      const rootId = `plugin:${plugin.id}`;

      items.push({
        id: rootId,
        label: plugin.name,
        href: getDefaultPluginHref(plugin),
        icon: getPluginRootIcon(plugin),
        order: pluginIndex,
      });

      const pages: PluginSettingDefinition[] = plugin.settingsPages ?? [];
      pages.forEach((page, pageIndex) => {
        const isSettings = page.slug === "settings";
        const explicitOrder =
          typeof page.order === "number" ? page.order : undefined;
        const order = explicitOrder ?? (isSettings ? 1000 : pageIndex);

        items.push({
          id: `plugin:${plugin.id}:${page.slug}`,
          label: page.label,
          href: `/admin/edit?plugin=${plugin.id}&page=${page.slug}`,
          icon:
            typeof page.icon === "string"
              ? page.icon
              : getSettingsPageIcon(page.slug),
          order,
          parentId: rootId,
        });
      });
    });

    return items;
  });
};

registerPluginMenuSource();
