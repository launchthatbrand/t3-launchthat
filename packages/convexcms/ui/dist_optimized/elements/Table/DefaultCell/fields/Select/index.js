"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { optionsAreObjects } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { useTranslation } from "../../../../../providers/Translation/index.js";
export const SelectCell = ({
  cellData,
  field: {
    options
  }
}) => {
  const {
    i18n
  } = useTranslation();
  const findLabel = items => items.map(i => {
    const found = options.filter(f => f.value === i)?.[0]?.label;
    return getTranslation(found, i18n);
  }).join(", ");
  let content = "";
  if (optionsAreObjects(options)) {
    content = Array.isArray(cellData) ? findLabel(cellData) // hasMany
    : findLabel([cellData]);
  } else {
    content = Array.isArray(cellData) ? cellData.join(", ") // hasMany
    : cellData;
  }
  return /*#__PURE__*/_jsx("span", {
    children: content
  });
};
//# sourceMappingURL=index.js.map