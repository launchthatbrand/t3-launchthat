'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment, useState } from 'react';
import { components } from 'react-select';
import { Tooltip } from '../../../../elements/Tooltip/index.js';
import { EditIcon } from '../../../../icons/Edit/index.js';
import { useAuth } from '../../../../providers/Auth/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'relationship--multi-value-label';
export const MultiValueLabel = props => {
  const $ = _c(26);
  const {
    data: t0,
    selectProps: t1
  } = props;
  const {
    allowEdit,
    label,
    relationTo,
    value
  } = t0;
  let t2;
  if ($[0] !== t1) {
    t2 = t1 === undefined ? {} : t1;
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const {
    customProps: t3
  } = t2;
  let t4;
  if ($[2] !== t3) {
    t4 = t3 === undefined ? {} : t3;
    $[2] = t3;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  const {
    draggableProps,
    onDocumentDrawerOpen
  } = t4;
  const {
    permissions
  } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const {
    t
  } = useTranslation();
  const hasReadPermission = Boolean(permissions?.collections?.[relationTo]?.read);
  let t5;
  if ($[4] !== draggableProps) {
    t5 = draggableProps || {};
    $[4] = draggableProps;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  let t6;
  if ($[6] !== allowEdit || $[7] !== hasReadPermission || $[8] !== label || $[9] !== onDocumentDrawerOpen || $[10] !== props || $[11] !== relationTo || $[12] !== showTooltip || $[13] !== t || $[14] !== t5 || $[15] !== value) {
    let t7;
    if ($[17] !== allowEdit || $[18] !== hasReadPermission || $[19] !== label || $[20] !== onDocumentDrawerOpen || $[21] !== relationTo || $[22] !== showTooltip || $[23] !== t || $[24] !== value) {
      t7 = relationTo && hasReadPermission && allowEdit !== false && _jsx(Fragment, {
        children: _jsxs("button", {
          "aria-label": `Edit ${label}`,
          className: `${baseClass}__drawer-toggler`,
          onClick: () => {
            setShowTooltip(false);
            onDocumentDrawerOpen({
              id: value,
              collectionSlug: relationTo,
              hasReadPermission
            });
          },
          onKeyDown: _temp,
          onMouseDown: _temp2,
          onMouseEnter: () => setShowTooltip(true),
          onMouseLeave: () => setShowTooltip(false),
          onTouchEnd: _temp3,
          type: "button",
          children: [_jsx(Tooltip, {
            className: `${baseClass}__tooltip`,
            show: showTooltip,
            children: t("general:editLabel", {
              label: ""
            })
          }), _jsx(EditIcon, {
            className: `${baseClass}__icon`
          })]
        })
      });
      $[17] = allowEdit;
      $[18] = hasReadPermission;
      $[19] = label;
      $[20] = onDocumentDrawerOpen;
      $[21] = relationTo;
      $[22] = showTooltip;
      $[23] = t;
      $[24] = value;
      $[25] = t7;
    } else {
      t7 = $[25];
    }
    t6 = _jsxs("div", {
      className: baseClass,
      children: [_jsx("div", {
        className: `${baseClass}__content`,
        children: _jsx(components.MultiValueLabel, {
          ...props,
          innerProps: {
            className: `${baseClass}__text`,
            ...t5
          }
        })
      }), t7]
    });
    $[6] = allowEdit;
    $[7] = hasReadPermission;
    $[8] = label;
    $[9] = onDocumentDrawerOpen;
    $[10] = props;
    $[11] = relationTo;
    $[12] = showTooltip;
    $[13] = t;
    $[14] = t5;
    $[15] = value;
    $[16] = t6;
  } else {
    t6 = $[16];
  }
  return t6;
};
function _temp(e) {
  if (e.key === "Enter") {
    e.stopPropagation();
  }
}
function _temp2(e_0) {
  return e_0.stopPropagation();
}
function _temp3(e_1) {
  return e_1.stopPropagation();
}
//# sourceMappingURL=index.js.map