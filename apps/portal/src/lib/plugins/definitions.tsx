import { calendarPlugin } from "launchthat-plugin-calendar";
import { createCommercePluginDefinition } from "launchthat-plugin-commerce";
import { helpdeskPlugin } from "launchthat-plugin-helpdesk";
import { lmsPlugin } from "launchthat-plugin-lms";
import { socialFeedPlugin } from "launchthat-plugin-socialfeed";
import { supportPlugin } from "launchthat-plugin-support";

import type { PluginDefinition } from "./types";
import { CommerceStorefrontSettings } from "~/plugins/settings/commerce-storefront-settings";

const commercePlugin = createCommercePluginDefinition({
  CommerceStorefrontSettings,
});

export const pluginDefinitions: PluginDefinition[] = [
  lmsPlugin,
  calendarPlugin,
  commercePlugin,
  helpdeskPlugin,
  socialFeedPlugin,
  supportPlugin,
];
