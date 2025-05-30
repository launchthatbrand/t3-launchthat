"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { toWords, transformColumnsToSearchParams } from "@convexcms/core/shared";
import { FieldLabel } from "../../../../fields/FieldLabel/index.js";
import { useField } from "../../../../forms/useField/index.js";
import { Pill } from "../../../Pill/index.js";
export const QueryPresetsColumnField = ({
  field: {
    label,
    required
  },
  path
}) => {
  const {
    value
  } = useField({
    path
  });
  return /*#__PURE__*/_jsxs("div", {
    className: "field-type query-preset-columns-field",
    children: [/*#__PURE__*/_jsx(FieldLabel, {
      as: "h3",
      label: label,
      path: path,
      required: required
    }), /*#__PURE__*/_jsx("div", {
      className: "value-wrapper",
      children: value ? transformColumnsToSearchParams(value).map((column, i) => {
        const isColumnActive = !column.startsWith("-");
        return /*#__PURE__*/_jsx(Pill, {
          pillStyle: isColumnActive ? "always-white" : "light-gray",
          children: toWords(column)
        }, i);
      }) : "No columns selected"
    })]
  });
};
//# sourceMappingURL=index.js.map