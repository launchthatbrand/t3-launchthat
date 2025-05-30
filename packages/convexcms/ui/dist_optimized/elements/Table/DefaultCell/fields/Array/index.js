"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { useTranslation } from "../../../../../providers/Translation/index.js";
export const ArrayCell = ({
  cellData,
  field: {
    labels
  }
}) => {
  const {
    i18n
  } = useTranslation();
  const arrayFields = cellData ?? [];
  const label = arrayFields.length === 1 ? `${arrayFields.length} ${getTranslation(labels?.singular || i18n.t("general:rows"), i18n)}` : `${arrayFields.length} ${getTranslation(labels?.plural || i18n.t("general:rows"), i18n)}`;
  return /*#__PURE__*/_jsx("span", {
    children: label
  });
};
//# sourceMappingURL=index.js.map