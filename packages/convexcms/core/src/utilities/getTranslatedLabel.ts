import type { I18n } from "@convexcms/translations";
import { getTranslation } from "@convexcms/translations";

import type { LabelFunction, StaticLabel } from "../config/types.js";

// @ts-strict-ignore

export const getTranslatedLabel = (
  label: LabelFunction | StaticLabel,
  i18n?: I18n,
): string => {
  if (typeof label === "function") {
    return label({ i18n, t: i18n.t });
  }

  if (typeof label === "object") {
    return getTranslation(label, i18n);
  }

  return label;
};
