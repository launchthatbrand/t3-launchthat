import type { PluginDefinition, ProviderSpec } from "launchthat-plugin-core";

import {
  createLmsPluginDefinitionImpl,
  getDefaultLmsComponents,
  type LmsPluginComponents,
} from "./pluginImpl";
import { LmsCourseProvider } from "./providers/LmsCourseProvider";

export const PLUGIN_ID = "lms" as const;

export const LMS_COURSE_PROVIDER_ID = "lms-course" as const;

export const createLmsPluginDefinition = (
  components: LmsPluginComponents,
): PluginDefinition => {
  const base = createLmsPluginDefinitionImpl(components);

  const courseProviderSpec: ProviderSpec = {
    Provider: LmsCourseProvider,
    getProps: (ctx) => ({
      post: ctx.post,
      postTypeSlug: ctx.postTypeSlug ?? undefined,
      postMeta: ctx.postMeta,
      organizationId: ctx.organizationId ?? undefined,
    }),
  };

  return {
    ...base,
    providers: {
      ...(base.providers ?? {}),
      [LMS_COURSE_PROVIDER_ID]: courseProviderSpec,
    },
  };
};

export const lmsPlugin: PluginDefinition = createLmsPluginDefinition(
  getDefaultLmsComponents(),
);


