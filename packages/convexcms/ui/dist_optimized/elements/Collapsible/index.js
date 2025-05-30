'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { ChevronIcon } from '../../icons/Chevron/index.js';
import { DragHandleIcon } from '../../icons/DragHandle/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
import { AnimateHeight } from '../AnimateHeight/index.js';
import { CollapsibleProvider, useCollapsible } from './provider.js';
const baseClass = 'collapsible';
export { CollapsibleProvider, useCollapsible };
export const Collapsible = t0 => {
  const $ = _c(26);
  const {
    actions,
    children,
    className,
    collapsibleStyle: t1,
    dragHandleProps,
    header,
    initCollapsed,
    isCollapsed: collapsedFromProps,
    onToggle
  } = t0;
  const collapsibleStyle = t1 === undefined ? "default" : t1;
  const [collapsedLocal, setCollapsedLocal] = useState(Boolean(initCollapsed));
  const [hoveringToggle, setHoveringToggle] = useState(false);
  const {
    isWithinCollapsible
  } = useCollapsible();
  const {
    t
  } = useTranslation();
  const isCollapsed = typeof collapsedFromProps === "boolean" ? collapsedFromProps : collapsedLocal;
  let t2;
  if ($[0] !== isCollapsed || $[1] !== onToggle) {
    t2 = () => {
      if (typeof onToggle === "function") {
        onToggle(!isCollapsed);
      }
      setCollapsedLocal(!isCollapsed);
    };
    $[0] = isCollapsed;
    $[1] = onToggle;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const toggleCollapsible = t2;
  const t3 = dragHandleProps && `${baseClass}--has-drag-handle`;
  const t4 = isCollapsed && `${baseClass}--collapsed`;
  const t5 = isWithinCollapsible && `${baseClass}--nested`;
  const t6 = hoveringToggle && `${baseClass}--hovered`;
  const t7 = `${baseClass}--style-${collapsibleStyle}`;
  let t8;
  if ($[3] !== className || $[4] !== t3 || $[5] !== t4 || $[6] !== t5 || $[7] !== t6 || $[8] !== t7) {
    t8 = [baseClass, className, t3, t4, t5, t6, t7].filter(Boolean);
    $[3] = className;
    $[4] = t3;
    $[5] = t4;
    $[6] = t5;
    $[7] = t6;
    $[8] = t7;
    $[9] = t8;
  } else {
    t8 = $[9];
  }
  const t9 = t8.join(" ");
  let t10;
  let t11;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = () => setHoveringToggle(true);
    t11 = () => setHoveringToggle(false);
    $[10] = t10;
    $[11] = t11;
  } else {
    t10 = $[10];
    t11 = $[11];
  }
  const t12 = `${baseClass}__toggle--${isCollapsed ? "collapsed" : "open"}`;
  let t13;
  if ($[12] !== t12) {
    t13 = [`${baseClass}__toggle`, t12].filter(Boolean);
    $[12] = t12;
    $[13] = t13;
  } else {
    t13 = $[13];
  }
  const t14 = t13.join(" ");
  let t15;
  if ($[14] !== actions || $[15] !== children || $[16] !== dragHandleProps || $[17] !== header || $[18] !== isCollapsed || $[19] !== t || $[20] !== t14 || $[21] !== t9 || $[22] !== toggleCollapsible) {
    let t16;
    if ($[24] !== dragHandleProps) {
      t16 = dragHandleProps && _jsx("div", {
        className: `${baseClass}__drag`,
        ...dragHandleProps.attributes,
        ...dragHandleProps.listeners,
        children: _jsx(DragHandleIcon, {})
      });
      $[24] = dragHandleProps;
      $[25] = t16;
    } else {
      t16 = $[25];
    }
    t15 = _jsx("div", {
      className: t9,
      children: _jsxs(CollapsibleProvider, {
        isCollapsed,
        toggle: toggleCollapsible,
        children: [_jsxs("div", {
          className: `${baseClass}__toggle-wrap`,
          onMouseEnter: t10,
          onMouseLeave: t11,
          children: [_jsx("button", {
            className: t14,
            onClick: toggleCollapsible,
            type: "button",
            children: _jsx("span", {
              children: t("fields:toggleBlock")
            })
          }), t16, header ? _jsx("div", {
            className: [`${baseClass}__header-wrap`, dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`].filter(Boolean).join(" "),
            children: header
          }) : null, _jsxs("div", {
            className: `${baseClass}__actions-wrap`,
            children: [actions ? _jsx("div", {
              className: `${baseClass}__actions`,
              children: actions
            }) : null, _jsx("div", {
              className: `${baseClass}__indicator`,
              children: _jsx(ChevronIcon, {
                direction: !isCollapsed ? "up" : undefined
              })
            })]
          })]
        }), _jsx(AnimateHeight, {
          height: isCollapsed ? 0 : "auto",
          children: _jsx("div", {
            className: `${baseClass}__content`,
            children
          })
        })]
      })
    });
    $[14] = actions;
    $[15] = children;
    $[16] = dragHandleProps;
    $[17] = header;
    $[18] = isCollapsed;
    $[19] = t;
    $[20] = t14;
    $[21] = t9;
    $[22] = toggleCollapsible;
    $[23] = t15;
  } else {
    t15 = $[23];
  }
  return t15;
};
//# sourceMappingURL=index.js.map