import type { ClientConfig, ImportMap, SanitizedConfig } from "@convexcms/core";
import type { I18nClient, SupportedLanguages } from "@convexcms/translations";
import { cache } from "react";
import { createClientConfig } from "@convexcms/core";

let cachedClientConfigs = global._payload_clientConfigs as Record<
  keyof SupportedLanguages,
  ClientConfig
>;

if (!cachedClientConfigs) {
  cachedClientConfigs = global._payload_clientConfigs = {} as Record<
    keyof SupportedLanguages,
    ClientConfig
  >;
}

export const getClientConfig = cache(
  (args: {
    config: SanitizedConfig;
    i18n: I18nClient;
    importMap: ImportMap;
  }): ClientConfig => {
    const { config, i18n, importMap } = args;
    const currentLanguage = i18n.language;

    if (
      cachedClientConfigs[currentLanguage] &&
      !global._payload_doNotCacheClientConfig
    ) {
      return cachedClientConfigs[currentLanguage];
    }

    const cachedClientConfig = createClientConfig({
      config,
      i18n,
      importMap,
    });

    cachedClientConfigs[currentLanguage] = cachedClientConfig;
    global._payload_clientConfigs = cachedClientConfigs;
    global._payload_doNotCacheClientConfig = false;

    return cachedClientConfig;
  },
);
