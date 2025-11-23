import { CommerceStorefrontSettings } from "~/plugins/settings/commerce-storefront-settings";
import type { PluginDefinition } from "./types";
import { calendarPlugin } from "launchthat-plugin-calendar";
import { createCommercePluginDefinition } from "launchthat-plugin-commerce";
import { helpdeskPlugin } from "launchthat-plugin-helpdesk";
import { lmsPlugin } from "launchthat-plugin-lms";

const commercePlugin = createCommercePluginDefinition({
  CommerceStorefrontSettings,
});

export const pluginDefinitions: PluginDefinition[] = [
  lmsPlugin,
  calendarPlugin,
  commercePlugin,
  helpdeskPlugin,
];
