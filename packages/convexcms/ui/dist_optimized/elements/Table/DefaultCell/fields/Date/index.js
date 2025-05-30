"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { useConfig } from "../../../../../providers/Config/index.js";
import { useTranslation } from "../../../../../providers/Translation/index.js";
import { formatDate } from "../../../../../utilities/formatDocTitle/formatDateTitle.js";
export const DateCell = ({
  cellData,
  field: {
    admin: {
      date
    } = {}
  }
}) => {
  const {
    config: {
      admin: {
        dateFormat: dateFormatFromRoot
      }
    }
  } = useConfig();
  const dateFormat = date?.displayFormat || dateFormatFromRoot;
  const {
    i18n
  } = useTranslation();
  return /*#__PURE__*/_jsx("span", {
    children: cellData && formatDate({
      date: cellData,
      i18n,
      pattern: dateFormat
    })
  });
};
//# sourceMappingURL=index.js.map