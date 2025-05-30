"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { ChevronIcon } from "../../../icons/Chevron/index.js";
import { useLocale } from "../../../providers/Locale/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
const baseClass = "localizer-button";
export const LocalizerLabel = props => {
  const {
    ariaLabel,
    className
  } = props;
  const locale = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  return /*#__PURE__*/_jsxs("div", {
    "aria-label": ariaLabel || t("general:locale"),
    className: [baseClass, className].filter(Boolean).join(" "),
    "data-locale": locale ? locale.code : undefined,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__label`,
      children: [`${t("general:locale")}:`, " "]
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__current`,
      children: [/*#__PURE__*/_jsx("span", {
        className: `${baseClass}__current-label`,
        children: `${getTranslation(locale.label, i18n)}`
      }), /*#__PURE__*/_jsx(ChevronIcon, {
        className: `${baseClass}__chevron`,
        size: "small"
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map