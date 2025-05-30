"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { Fragment } from "react";
import { getTranslation } from "@convexcms/translations";
import { PayloadIcon } from "../../graphics/Icon/index.js";
import { useConfig } from "../../providers/Config/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { Link } from "../Link/index.js";
import { RenderCustomComponent } from "../RenderCustomComponent/index.js";
import { StepNavProvider, useStepNav } from "./context.js";
export { SetStepNav } from "./SetStepNav.js";
const baseClass = "step-nav";
const StepNav = ({
  className,
  CustomIcon
}) => {
  const {
    i18n
  } = useTranslation();
  const {
    stepNav
  } = useStepNav();
  const {
    config: {
      routes: {
        admin
      }
    }
  } = useConfig();
  const {
    t
  } = useTranslation();
  return /*#__PURE__*/_jsx(Fragment, {
    children: stepNav.length > 0 ? /*#__PURE__*/_jsxs("nav", {
      className: [baseClass, className].filter(Boolean).join(" "),
      children: [/*#__PURE__*/_jsx(Link, {
        className: `${baseClass}__home`,
        href: admin,
        prefetch: false,
        tabIndex: 0,
        children: /*#__PURE__*/_jsx("span", {
          title: t("general:dashboard"),
          children: /*#__PURE__*/_jsx(RenderCustomComponent, {
            CustomComponent: CustomIcon,
            Fallback: /*#__PURE__*/_jsx(PayloadIcon, {})
          })
        })
      }), /*#__PURE__*/_jsx("span", {
        children: "/"
      }), stepNav.map((item, i) => {
        const StepLabel = getTranslation(item.label, i18n);
        const isLast = stepNav.length === i + 1;
        const Step = isLast ? /*#__PURE__*/_jsx("span", {
          className: `${baseClass}__last`,
          children: StepLabel
        }, i) : /*#__PURE__*/_jsxs(Fragment, {
          children: [item.url ? /*#__PURE__*/_jsx(Link, {
            href: item.url,
            prefetch: false,
            children: /*#__PURE__*/_jsx("span", {
              children: StepLabel
            }, i)
          }) : /*#__PURE__*/_jsx("span", {
            children: StepLabel
          }, i), /*#__PURE__*/_jsx("span", {
            children: "/"
          })]
        }, i);
        return Step;
      })]
    }) : /*#__PURE__*/_jsx("div", {
      className: [baseClass, className].filter(Boolean).join(" "),
      children: /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__home`,
        children: /*#__PURE__*/_jsx("span", {
          title: t("general:dashboard"),
          children: /*#__PURE__*/_jsx(RenderCustomComponent, {
            CustomComponent: CustomIcon,
            Fallback: /*#__PURE__*/_jsx(PayloadIcon, {})
          })
        })
      })
    })
  });
};
export { StepNav, StepNavProvider, useStepNav };
//# sourceMappingURL=index.js.map