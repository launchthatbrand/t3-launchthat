"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { useTranslation } from "../../providers/Translation/index.js";
const baseClass = "field-description";
export const FieldDescription = props => {
  const {
    className,
    description,
    marginPlacement,
    path
  } = props;
  const {
    i18n
  } = useTranslation();
  if (description) {
    return /*#__PURE__*/_jsx("div", {
      className: [baseClass, className, `field-description-${path?.replace(/\./g, "__")}`, marginPlacement && `${baseClass}--margin-${marginPlacement}`].filter(Boolean).join(" "),
      children: getTranslation(description, i18n)
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map