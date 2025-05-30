"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { FieldDescription } from "../../fields/FieldDescription/index.js";
import { FieldError } from "../../fields/FieldError/index.js";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { fieldBaseClass } from "../shared/index.js";
export const PasswordInput = props => {
  const {
    AfterInput,
    autoComplete = "off",
    BeforeInput,
    className,
    description,
    Description,
    Error,
    inputRef,
    Label,
    label,
    localized,
    onChange,
    onKeyDown,
    path,
    placeholder,
    readOnly,
    required,
    rtl,
    showError,
    style,
    value,
    width
  } = props;
  const {
    i18n
  } = useTranslation();
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, "password", className, showError && "error", readOnly && "read-only"].filter(Boolean).join(" "),
    style: {
      ...style,
      width
    },
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          path: path,
          showError: showError
        })
      }), /*#__PURE__*/_jsxs("div", {
        children: [BeforeInput, /*#__PURE__*/_jsx("input", {
          "aria-label": getTranslation(label, i18n),
          autoComplete: autoComplete,
          "data-rtl": rtl,
          disabled: readOnly,
          id: `field-${path.replace(/\./g, "__")}`,
          name: path,
          onChange: onChange,
          onKeyDown: onKeyDown,
          placeholder: getTranslation(placeholder, i18n),
          ref: inputRef,
          type: "password",
          value: value || ""
        }), AfterInput]
      }), /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: /*#__PURE__*/_jsx(FieldDescription, {
          description: description,
          path: path
        })
      })]
    })]
  });
};
//# sourceMappingURL=input.js.map