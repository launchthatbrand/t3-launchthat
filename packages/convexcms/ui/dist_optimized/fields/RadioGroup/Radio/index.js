"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { useEditDepth } from "../../../providers/EditDepth/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
const baseClass = "radio-input";
export const Radio = props => {
  const {
    isSelected,
    onChange,
    option,
    path,
    readOnly,
    uuid
  } = props;
  const {
    i18n
  } = useTranslation();
  const editDepth = useEditDepth();
  const id = `field-${path}-${option.value}${editDepth > 1 ? `-${editDepth}` : ""}${uuid ? `-${uuid}` : ""}`;
  return /*#__PURE__*/_jsx("label", {
    htmlFor: id,
    children: /*#__PURE__*/_jsxs("div", {
      className: [baseClass, isSelected && `${baseClass}--is-selected`].filter(Boolean).join(" "),
      children: [/*#__PURE__*/_jsx("input", {
        checked: isSelected,
        disabled: readOnly,
        id: id,
        name: path,
        onChange: () => typeof onChange === "function" ? onChange(option.value) : null,
        type: "radio"
      }), /*#__PURE__*/_jsx("span", {
        className: [`${baseClass}__styled-radio`, readOnly && `${baseClass}__styled-radio--disabled`].filter(Boolean).join(" ")
      }), /*#__PURE__*/_jsx("span", {
        className: `${baseClass}__label`,
        children: getTranslation(option.label, i18n)
      })]
    })
  });
};
//# sourceMappingURL=index.js.map