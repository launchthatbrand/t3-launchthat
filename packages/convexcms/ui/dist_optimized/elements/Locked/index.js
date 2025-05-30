"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useState } from "react";
import { LockIcon } from "../../icons/Lock/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { isClientUserObject } from "../../utilities/isClientUserObject.js";
import { Tooltip } from "../Tooltip/index.js";
const baseClass = "locked";
export const Locked = ({
  className,
  user
}) => {
  const [hovered, setHovered] = useState(false);
  const {
    t
  } = useTranslation();
  const userToUse = isClientUserObject(user) ? user.email ?? user.id : t("general:anotherUser");
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, className].filter(Boolean).join(" "),
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    role: "button",
    tabIndex: 0,
    children: [/*#__PURE__*/_jsx(Tooltip, {
      alignCaret: "left",
      className: `${baseClass}__tooltip`,
      position: "top",
      show: hovered,
      children: `${userToUse} ${t("general:isEditing")}`
    }), /*#__PURE__*/_jsx(LockIcon, {})]
  });
};
//# sourceMappingURL=index.js.map