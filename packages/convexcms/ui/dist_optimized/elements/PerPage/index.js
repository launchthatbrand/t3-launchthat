"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
// TODO: abstract the `next/navigation` dependency out from this component
import { collectionDefaults, isNumber } from "@convexcms/core/shared";
import { ChevronIcon } from "../../icons/Chevron/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { Popup, PopupList } from "../Popup/index.js";
const baseClass = "per-page";
const defaultLimits = collectionDefaults.admin.pagination.limits;
export const PerPage = ({
  defaultLimit = 10,
  handleChange,
  limit,
  limits = defaultLimits
}) => {
  const {
    t
  } = useTranslation();
  const limitToUse = isNumber(limit) ? limit : defaultLimit;
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsx(Popup, {
      button: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__base-button`,
        children: [/*#__PURE__*/_jsx("span", {
          children: t("general:perPage", {
            limit: limitToUse
          })
        }), " ", /*#__PURE__*/_jsx(ChevronIcon, {
          className: `${baseClass}__icon`
        })]
      }),
      horizontalAlign: "right",
      render: ({
        close
      }) => /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
        children: limits.map((limitNumber, i) => /*#__PURE__*/_jsxs(PopupList.Button, {
          className: [`${baseClass}__button`, limitNumber === limitToUse && `${baseClass}__button-active`].filter(Boolean).join(" "),
          onClick: () => {
            close();
            if (handleChange) {
              handleChange(limitNumber);
            }
          },
          children: [limitNumber === limitToUse && /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__chevron`,
            children: /*#__PURE__*/_jsx(ChevronIcon, {
              direction: "right",
              size: "small"
            })
          }), " ", /*#__PURE__*/_jsx("span", {
            children: limitNumber
          })]
        }, i))
      }),
      size: "small"
    })
  });
};
//# sourceMappingURL=index.js.map