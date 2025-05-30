import { jsx as _jsx } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { toWords, transformColumnsToSearchParams } from "@convexcms/core/shared";
import { Pill } from "../../../Pill/index.js";
const baseClass = "query-preset-columns-cell";
export const QueryPresetsColumnsCell = ({
  cellData
}) => {
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: cellData ? transformColumnsToSearchParams(cellData).map((column, i) => {
      const isColumnActive = !column.startsWith("-");
      // to void very lengthy cells, only display the active columns
      if (!isColumnActive) {
        return null;
      }
      return /*#__PURE__*/_jsx(Pill, {
        pillStyle: isColumnActive ? "always-white" : "light",
        children: toWords(column)
      }, i);
    }) : "No columns selected"
  });
};
//# sourceMappingURL=index.js.map