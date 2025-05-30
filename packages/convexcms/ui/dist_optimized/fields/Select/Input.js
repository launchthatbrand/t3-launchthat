"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { ReactSelect } from "../../elements/ReactSelect/index.js";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { FieldDescription } from "../../fields/FieldDescription/index.js";
import { FieldError } from "../../fields/FieldError/index.js";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { fieldBaseClass } from "../shared/index.js";
export const SelectInput = props => {
  const {
    AfterInput,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    hasMany = false,
    isClearable = true,
    isSortable = true,
    label,
    Label,
    localized,
    onChange,
    onInputChange,
    options,
    path,
    readOnly,
    required,
    showError,
    style,
    value
  } = props;
  const {
    i18n
  } = useTranslation();
  let valueToRender;
  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map(val => {
      const matchingOption = options.find(option => option.value === val);
      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
        value: matchingOption?.value ?? val
      };
    });
  } else if (value) {
    const matchingOption = options.find(option => option.value === value);
    valueToRender = {
      label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
      value: matchingOption?.value ?? value
    };
  } else {
    // If value is not present then render nothing, allowing select fields to reset to their initial 'Select an option' state
    valueToRender = null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, "select", className, showError && "error", readOnly && "read-only"].filter(Boolean).join(" "),
    id: `field-${path.replace(/\./g, "__")}`,
    style: style,
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
      }), BeforeInput, /*#__PURE__*/_jsx(ReactSelect, {
        disabled: readOnly,
        isClearable: isClearable,
        isMulti: hasMany,
        isSortable: isSortable,
        onChange: onChange,
        onInputChange: onInputChange,
        options: options.map(option => ({
          ...option,
          label: getTranslation(option.label, i18n)
        })),
        showError: showError,
        value: valueToRender
      }), AfterInput]
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
//# sourceMappingURL=Input.js.map