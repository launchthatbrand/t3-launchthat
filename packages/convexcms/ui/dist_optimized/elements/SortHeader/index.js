'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { SortDownIcon, SortUpIcon } from '../../icons/Sort/index.js';
import { useListQuery } from '../../providers/ListQuery/index.js';
import './index.scss';
import { useTranslation } from '../../providers/Translation/index.js';
const baseClass = 'sort-header';
function useSort() {
  const $ = _c(12);
  const {
    handleSortChange,
    orderableFieldName,
    query
  } = useListQuery();
  const querySort = Array.isArray(query.sort) ? query.sort[0] : query.sort;
  const sort = useRef(querySort === `-${orderableFieldName}` ? "desc" : "asc");
  const isActive = querySort === `-${orderableFieldName}` || querySort === orderableFieldName;
  let t0;
  let t1;
  if ($[0] !== isActive || $[1] !== orderableFieldName || $[2] !== querySort) {
    t0 = () => {
      if (!isActive) {
        return;
      }
      sort.current = querySort === `-${orderableFieldName}` ? "desc" : "asc";
    };
    t1 = [orderableFieldName, querySort, isActive];
    $[0] = isActive;
    $[1] = orderableFieldName;
    $[2] = querySort;
    $[3] = t0;
    $[4] = t1;
  } else {
    t0 = $[3];
    t1 = $[4];
  }
  useEffect(t0, t1);
  let t2;
  if ($[5] !== handleSortChange || $[6] !== isActive || $[7] !== orderableFieldName) {
    t2 = () => {
      if (isActive) {
        handleSortChange(sort.current === "asc" ? `-${orderableFieldName}` : orderableFieldName);
        sort.current = sort.current === "asc" ? "desc" : "asc";
        return;
      }
      handleSortChange(sort.current === "asc" ? orderableFieldName : `-${orderableFieldName}`);
    };
    $[5] = handleSortChange;
    $[6] = isActive;
    $[7] = orderableFieldName;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  const handleSortPress = t2;
  let t3;
  if ($[9] !== handleSortPress || $[10] !== isActive) {
    t3 = {
      handleSortPress,
      isActive,
      sort
    };
    $[9] = handleSortPress;
    $[10] = isActive;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
}
export const SortHeader = props => {
  const $ = _c(8);
  const {
    appearance
  } = props;
  const {
    handleSortPress,
    isActive,
    sort
  } = useSort();
  const {
    t
  } = useTranslation();
  const t0 = appearance && `${baseClass}--appearance-${appearance}`;
  let t1;
  if ($[0] !== t0) {
    t1 = [baseClass, t0].filter(Boolean);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = t1.join(" ");
  let t3;
  if ($[2] !== handleSortPress || $[3] !== isActive || $[4] !== sort.current || $[5] !== t || $[6] !== t2) {
    t3 = _jsx("div", {
      className: t2,
      children: _jsx("div", {
        className: `${baseClass}__buttons`,
        children: sort.current === "desc" ? _jsx("button", {
          "aria-label": t("general:sortByLabelDirection", {
            direction: t("general:ascending"),
            label: "Order"
          }),
          className: `${baseClass}__button ${baseClass}__${sort.current} ${isActive ? `${baseClass}--active` : ""}`,
          onClick: handleSortPress,
          type: "button",
          children: _jsx(SortDownIcon, {})
        }) : _jsx("button", {
          "aria-label": t("general:sortByLabelDirection", {
            direction: t("general:descending"),
            label: "Order"
          }),
          className: `${baseClass}__button ${baseClass}__${sort.current} ${isActive ? `${baseClass}--active` : ""}`,
          onClick: handleSortPress,
          type: "button",
          children: _jsx(SortUpIcon, {})
        })
      })
    });
    $[2] = handleSortPress;
    $[3] = isActive;
    $[4] = sort.current;
    $[5] = t;
    $[6] = t2;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
};
//# sourceMappingURL=index.js.map