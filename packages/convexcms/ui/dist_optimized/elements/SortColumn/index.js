"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { ChevronIcon } from "../../icons/Chevron/index.js";
import { useListQuery } from "../../providers/ListQuery/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
const baseClass = "sort-column";
export const SortColumn = props => {
  const {
    name,
    appearance,
    disable = false,
    Label,
    label
  } = props;
  const {
    handleSortChange,
    query
  } = useListQuery();
  const {
    t
  } = useTranslation();
  const {
    sort
  } = query;
  const desc = `-${name}`;
  const asc = name;
  const ascClasses = [`${baseClass}__asc`];
  if (sort === asc) {
    ascClasses.push(`${baseClass}--active`);
  }
  const descClasses = [`${baseClass}__desc`];
  if (sort === desc) {
    descClasses.push(`${baseClass}--active`);
  }
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, appearance && `${baseClass}--appearance-${appearance}`].filter(Boolean).join(" "),
    children: [/*#__PURE__*/_jsx("span", {
      className: `${baseClass}__label`,
      children: Label ?? /*#__PURE__*/_jsx(FieldLabel, {
        hideLocale: true,
        label: label,
        unstyled: true
      })
    }), !disable && /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__buttons`,
      children: [/*#__PURE__*/_jsx("button", {
        "aria-label": t("general:sortByLabelDirection", {
          direction: t("general:ascending"),
          label
        }),
        className: [...ascClasses, `${baseClass}__button`].filter(Boolean).join(" "),
        onClick: () => void handleSortChange(asc),
        type: "button",
        children: /*#__PURE__*/_jsx(ChevronIcon, {
          direction: "up"
        })
      }), /*#__PURE__*/_jsx("button", {
        "aria-label": t("general:sortByLabelDirection", {
          direction: t("general:descending"),
          label
        }),
        className: [...descClasses, `${baseClass}__button`].filter(Boolean).join(" "),
        onClick: () => void handleSortChange(desc),
        type: "button",
        children: /*#__PURE__*/_jsx(ChevronIcon, {})
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map