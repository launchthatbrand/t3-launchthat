"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { formatAdminURL } from "@convexcms/core/shared";
import { LogOutIcon } from "../../icons/LogOut/index.js";
import { useConfig } from "../../providers/Config/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { Link } from "../Link/index.js";
const baseClass = "nav";
export const Logout = ({
  tabIndex = 0
}) => {
  const {
    t
  } = useTranslation();
  const {
    config
  } = useConfig();
  const {
    admin: {
      routes: {
        logout: logoutRoute
      }
    },
    routes: {
      admin: adminRoute
    }
  } = config;
  return /*#__PURE__*/_jsx(Link, {
    "aria-label": t("authentication:logOut"),
    className: `${baseClass}__log-out`,
    href: formatAdminURL({
      adminRoute,
      path: logoutRoute
    }),
    prefetch: false,
    tabIndex: tabIndex,
    title: t("authentication:logOut"),
    children: /*#__PURE__*/_jsx(LogOutIcon, {})
  });
};
//# sourceMappingURL=index.js.map