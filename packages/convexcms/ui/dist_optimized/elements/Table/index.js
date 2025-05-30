"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
const baseClass = "table";
export const Table = ({
  appearance,
  columns,
  data
}) => {
  const activeColumns = columns?.filter(col => col?.active);
  if (!activeColumns || activeColumns.length === 0) {
    return /*#__PURE__*/_jsx("div", {
      children: "No columns selected"
    });
  }
  return /*#__PURE__*/_jsx("div", {
    className: [baseClass, appearance && `${baseClass}--appearance-${appearance}`].filter(Boolean).join(" "),
    children: /*#__PURE__*/_jsxs("table", {
      cellPadding: "0",
      cellSpacing: "0",
      children: [/*#__PURE__*/_jsx("thead", {
        children: /*#__PURE__*/_jsx("tr", {
          children: activeColumns.map((col, i) => /*#__PURE__*/_jsx("th", {
            id: `heading-${col.accessor}`,
            children: col.Heading
          }, i))
        })
      }), /*#__PURE__*/_jsx("tbody", {
        children: data && data.map((row, rowIndex) => /*#__PURE__*/_jsx("tr", {
          className: `row-${rowIndex + 1}`,
          children: activeColumns.map((col, colIndex) => {
            const {
              accessor
            } = col;
            return /*#__PURE__*/_jsx("td", {
              className: `cell-${accessor}`,
              children: col.renderedCells[rowIndex]
            }, colIndex);
          })
        }, rowIndex))
      })]
    })
  });
};
//# sourceMappingURL=index.js.map