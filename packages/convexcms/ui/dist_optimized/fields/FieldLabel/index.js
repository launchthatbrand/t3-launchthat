"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { useForm } from "../../forms/Form/context.js";
import { useEditDepth } from "../../providers/EditDepth/index.js";
import { useLocale } from "../../providers/Locale/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { generateFieldID } from "../../utilities/generateFieldID.js";
export const FieldLabel = props => {
  const {
    as: Element = "label",
    hideLocale = false,
    htmlFor: htmlForFromProps,
    label,
    localized = false,
    path,
    required = false,
    unstyled = false
  } = props;
  const {
    uuid
  } = useForm();
  const editDepth = useEditDepth();
  const htmlFor = htmlForFromProps || generateFieldID(path, editDepth, uuid);
  const {
    i18n
  } = useTranslation();
  const {
    code,
    label: localLabel
  } = useLocale();
  if (label) {
    return /*#__PURE__*/_jsxs(Element, {
      className: `field-label ${unstyled ? "unstyled" : ""}`,
      htmlFor: htmlFor,
      children: [getTranslation(label, i18n), required && !unstyled && /*#__PURE__*/_jsx("span", {
        className: "required",
        children: "*"
      }), localized && !hideLocale && /*#__PURE__*/_jsxs("span", {
        className: "localized",
        children: ["— ", typeof localLabel === "string" ? localLabel : code]
      })]
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map