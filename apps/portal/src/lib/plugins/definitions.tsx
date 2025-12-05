import {
  SOCIAL_FEED_FRONTEND_PROVIDER_ID,
  configureSocialFeedPlugin,
  socialFeedPlugin,
} from "launchthat-plugin-socialfeed";

import { CommerceStorefrontSettings } from "~/plugins/settings/commerce-storefront-settings";
import type { PluginDefinition } from "./types";
import { PortalSocialFeedProvider } from "~/providers/SocialFeedProvider";
import { calendarPlugin } from "launchthat-plugin-calendar";
import { cmsPlugin } from "launchthat-plugin-cms";
import { createCommercePluginDefinition } from "launchthat-plugin-commerce";
import { lmsPlugin } from "launchthat-plugin-lms";
import { supportPlugin } from "launchthat-plugin-support";
import { tasksPlugin } from "launchthat-plugin-tasks";

const commercePlugin = createCommercePluginDefinition({
  CommerceStorefrontSettings,
});

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
];
