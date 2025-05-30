"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { useConfig } from "../../providers/Config/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { formatDocTitle } from "../../utilities/formatDocTitle/index.js";
const baseClass = "thumbnail-card";
export const ThumbnailCard = props => {
  const {
    alignLabel,
    className,
    collection,
    doc,
    label: labelFromProps,
    onClick,
    thumbnail
  } = props;
  const {
    config
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const classes = [baseClass, className, typeof onClick === "function" && `${baseClass}--has-on-click`, alignLabel && `${baseClass}--align-label-${alignLabel}`].filter(Boolean).join(" ");
  let title = labelFromProps;
  if (!title) {
    title = formatDocTitle({
      collectionConfig: collection,
      data: doc,
      dateFormat: config.admin.dateFormat,
      fallback: doc?.filename,
      i18n
    });
  }
  return /*#__PURE__*/_jsxs("button", {
    className: classes,
    onClick: onClick,
    title: title,
    type: "button",
    children: [/*#__PURE__*/_jsx("div", {
      className: `${baseClass}__thumbnail`,
      children: thumbnail
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__label`,
      children: title
    })]
  });
};
//# sourceMappingURL=index.js.map