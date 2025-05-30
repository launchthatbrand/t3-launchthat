import type { AcceptedLanguages } from "@convexcms/translations";
import { initI18n } from "@convexcms/translations";

import type { SanitizedConfig } from "../config/types.js";

export const getLocalI18n = async ({
  config,
  language,
}: {
  config: SanitizedConfig;
  language: AcceptedLanguages;
}) =>
  initI18n({
    config: config.i18n,
    context: "api",
    language,
  });
