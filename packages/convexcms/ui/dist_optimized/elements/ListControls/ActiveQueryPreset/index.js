"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import { getTranslation } from "@convexcms/translations";
import { PeopleIcon } from "../../../icons/People/index.js";
import { XIcon } from "../../../icons/X/index.js";
import { useConfig } from "../../../providers/Config/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
import { Pill } from "../../Pill/index.js";
const baseClass = "active-query-preset";
export function ActiveQueryPreset({
  activePreset,
  openPresetListDrawer,
  resetPreset
}) {
  const {
    i18n,
    t
  } = useTranslation();
  const {
    getEntityConfig
  } = useConfig();
  const presetsConfig = getEntityConfig({
    collectionSlug: "payload-query-presets"
  });
  return /*#__PURE__*/_jsxs(Pill, {
    className: [baseClass, activePreset && `${baseClass}--active`].filter(Boolean).join(" "),
    id: "select-preset",
    onClick: () => {
      openPresetListDrawer();
    },
    pillStyle: activePreset ? "always-white" : "light",
    children: [activePreset?.isShared && /*#__PURE__*/_jsx(PeopleIcon, {
      className: `${baseClass}__shared`
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__label-text`,
      children: activePreset?.title || t("general:selectLabel", {
        label: getTranslation(presetsConfig.labels.singular, i18n)
      })
    }), activePreset ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__clear`,
      id: "clear-preset",
      onClick: async e => {
        e.stopPropagation();
        await resetPreset();
      },
      onKeyDown: async e => {
        e.stopPropagation();
        await resetPreset();
      },
      role: "button",
      tabIndex: 0,
      children: /*#__PURE__*/_jsx(XIcon, {})
    }) : null]
  });
}
//# sourceMappingURL=index.js.map