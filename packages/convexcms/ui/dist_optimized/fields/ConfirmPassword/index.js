"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { confirmPassword } from "@convexcms/core/shared";
import { useField } from "../../forms/useField/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { FieldError } from "../FieldError/index.js";
import { FieldLabel } from "../FieldLabel/index.js";
import { fieldBaseClass } from "../shared/index.js";
export const ConfirmPasswordField = props => {
  const {
    disabled: disabledFromProps,
    path = "confirm-password"
  } = props;
  const {
    t
  } = useTranslation();
  const {
    disabled,
    setValue,
    showError,
    value
  } = useField({
    path,
    validate: (value, options) => {
      return confirmPassword(value, {
        name: "confirm-password",
        type: "text",
        required: true,
        ...options
      });
    }
  });
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, "confirm-password", showError && "error"].filter(Boolean).join(" "),
    children: [/*#__PURE__*/_jsx(FieldLabel, {
      htmlFor: "field-confirm-password",
      label: t("authentication:confirmPassword"),
      required: true
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      children: [/*#__PURE__*/_jsx(FieldError, {
        path: path
      }), /*#__PURE__*/_jsx("input", {
        "aria-label": t("authentication:confirmPassword"),
        autoComplete: "off",
        disabled: !!(disabled || disabledFromProps),
        id: "field-confirm-password",
        name: "confirm-password",
        onChange: setValue,
        type: "password",
        value: value || ""
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map