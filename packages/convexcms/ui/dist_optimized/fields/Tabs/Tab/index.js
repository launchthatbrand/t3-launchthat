"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useState } from "react";
import { tabHasName } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { ErrorPill } from "../../../elements/ErrorPill/index.js";
import { WatchChildErrors } from "../../../forms/WatchChildErrors/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
const baseClass = "tabs-field__tab-button";
export const TabComponent = ({
  hidden,
  isActive,
  parentPath,
  setIsActive,
  tab
}) => {
  const {
    i18n
  } = useTranslation();
  const [errorCount, setErrorCount] = useState(undefined);
  const path = [
  // removes parent 'tabs' path segment, i.e. `_index-0`
  ...(parentPath ? parentPath.split(".").slice(0, -1) : []), ...(tabHasName(tab) ? [tab.name] : [])];
  const fieldHasErrors = errorCount > 0;
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx(WatchChildErrors, {
      fields: tab.fields,
      path: path,
      setErrorCount: setErrorCount
    }), /*#__PURE__*/_jsxs("button", {
      className: [baseClass, fieldHasErrors && `${baseClass}--has-error`, isActive && `${baseClass}--active`, hidden && `${baseClass}--hidden`].filter(Boolean).join(" "),
      onClick: setIsActive,
      type: "button",
      children: [tab.label ? getTranslation(tab.label, i18n) : tabHasName(tab) ? tab.name : "", fieldHasErrors && /*#__PURE__*/_jsx(ErrorPill, {
        count: errorCount,
        i18n: i18n
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map