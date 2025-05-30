"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { useTranslation } from "../../providers/Translation/index.js";
export function isComponent(description) {
  return /*#__PURE__*/React.isValidElement(description);
}
export function ViewDescription(props) {
  const {
    i18n
  } = useTranslation();
  const {
    description
  } = props;
  if (description) {
    return /*#__PURE__*/_jsx("div", {
      className: "custom-view-description",
      children: getTranslation(description, i18n)
    });
  }
  return null;
}
//# sourceMappingURL=index.js.map