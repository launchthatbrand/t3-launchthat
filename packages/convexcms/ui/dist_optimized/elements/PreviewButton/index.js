"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { Button } from "../Button/index.js";
import { usePreviewURL } from "./usePreviewURL.js";
const baseClass = "preview-btn";
export function PreviewButton(props) {
  const {
    generatePreviewURL,
    label
  } = usePreviewURL();
  return /*#__PURE__*/_jsx(Button, {
    buttonStyle: "secondary",
    className: baseClass,
    icon: "link",
    iconPosition: "left",
    // disabled={disabled}
    onClick: () => generatePreviewURL({
      openPreviewWindow: true
    }),
    size: "medium",
    children: label
  });
}
//# sourceMappingURL=index.js.map