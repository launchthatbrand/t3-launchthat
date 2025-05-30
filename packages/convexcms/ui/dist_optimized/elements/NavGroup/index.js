"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useState } from "react";
import { ChevronIcon } from "../../icons/Chevron/index.js";
import { usePreferences } from "../../providers/Preferences/index.js";
import { AnimateHeight } from "../AnimateHeight/index.js";
import { useNav } from "../Nav/context.js";
const baseClass = "nav-group";
const preferencesKey = "nav";
export const NavGroup = ({
  children,
  isOpen: isOpenFromProps,
  label
}) => {
  const [collapsed, setCollapsed] = useState(typeof isOpenFromProps !== "undefined" ? !isOpenFromProps : false);
  const [animate, setAnimate] = useState(false);
  const {
    setPreference
  } = usePreferences();
  const {
    navOpen
  } = useNav();
  if (label) {
    const toggleCollapsed = () => {
      setAnimate(true);
      const newGroupPrefs = {};
      if (!newGroupPrefs?.[label]) {
        newGroupPrefs[label] = {
          open: Boolean(collapsed)
        };
      } else {
        newGroupPrefs[label].open = Boolean(collapsed);
      }
      void setPreference(preferencesKey, {
        groups: newGroupPrefs
      }, true);
      setCollapsed(!collapsed);
    };
    return /*#__PURE__*/_jsxs("div", {
      className: [`${baseClass}`, `${label}`, collapsed && `${baseClass}--collapsed`].filter(Boolean).join(" "),
      id: `nav-group-${label}`,
      children: [/*#__PURE__*/_jsxs("button", {
        className: [`${baseClass}__toggle`, `${baseClass}__toggle--${collapsed ? "collapsed" : "open"}`].filter(Boolean).join(" "),
        onClick: toggleCollapsed,
        tabIndex: !navOpen ? -1 : 0,
        type: "button",
        children: [/*#__PURE__*/_jsx("div", {
          className: `${baseClass}__label`,
          children: label
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__indicator`,
          children: /*#__PURE__*/_jsx(ChevronIcon, {
            className: `${baseClass}__indicator`,
            direction: !collapsed ? "up" : undefined
          })
        })]
      }), /*#__PURE__*/_jsx(AnimateHeight, {
        duration: animate ? 200 : 0,
        height: collapsed ? 0 : "auto",
        children: /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__content`,
          children: children
        })
      })]
    });
  }
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: children
  });
};
//# sourceMappingURL=index.js.map