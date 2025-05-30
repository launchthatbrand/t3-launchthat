'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ChevronIcon } from '../../icons/Chevron/index.js';
import { CopyIcon } from '../../icons/Copy/index.js';
import { MoreIcon } from '../../icons/More/index.js';
import { PlusIcon } from '../../icons/Plus/index.js';
import { XIcon } from '../../icons/X/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Popup, PopupList } from '../Popup/index.js';
import './index.scss';
const baseClass = 'array-actions';
export const ArrayAction = t0 => {
  const $ = _c(10);
  const {
    addRow,
    duplicateRow,
    hasMaxRows,
    index,
    isSortable,
    moveRow,
    removeRow,
    rowCount
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== addRow || $[1] !== duplicateRow || $[2] !== hasMaxRows || $[3] !== index || $[4] !== isSortable || $[5] !== moveRow || $[6] !== removeRow || $[7] !== rowCount || $[8] !== t) {
    t1 = _jsx(Popup, {
      button: _jsx(MoreIcon, {}),
      buttonClassName: `${baseClass}__button`,
      className: baseClass,
      horizontalAlign: "center",
      render: t2 => {
        const {
          close
        } = t2;
        return _jsxs(PopupList.ButtonGroup, {
          buttonSize: "small",
          children: [isSortable && index !== 0 && _jsxs(PopupList.Button, {
            className: `${baseClass}__action ${baseClass}__move-up`,
            onClick: () => {
              moveRow(index, index - 1);
              close();
            },
            children: [_jsx("div", {
              className: `${baseClass}__action-chevron`,
              children: _jsx(ChevronIcon, {
                direction: "up"
              })
            }), t("general:moveUp")]
          }), isSortable && index < rowCount - 1 && _jsxs(PopupList.Button, {
            className: `${baseClass}__action`,
            onClick: () => {
              moveRow(index, index + 1);
              close();
            },
            children: [_jsx("div", {
              className: `${baseClass}__action-chevron`,
              children: _jsx(ChevronIcon, {})
            }), t("general:moveDown")]
          }), !hasMaxRows && _jsxs(React.Fragment, {
            children: [_jsxs(PopupList.Button, {
              className: `${baseClass}__action ${baseClass}__add`,
              onClick: () => {
                addRow(index + 1);
                close();
              },
              children: [_jsx(PlusIcon, {}), t("general:addBelow")]
            }), _jsxs(PopupList.Button, {
              className: `${baseClass}__action ${baseClass}__duplicate`,
              onClick: () => {
                duplicateRow(index);
                close();
              },
              children: [_jsx(CopyIcon, {}), t("general:duplicate")]
            })]
          }), _jsxs(PopupList.Button, {
            className: `${baseClass}__action ${baseClass}__remove`,
            onClick: () => {
              removeRow(index);
              close();
            },
            children: [_jsx(XIcon, {}), t("general:remove")]
          })]
        });
      },
      size: "medium"
    });
    $[0] = addRow;
    $[1] = duplicateRow;
    $[2] = hasMaxRows;
    $[3] = index;
    $[4] = isSortable;
    $[5] = moveRow;
    $[6] = removeRow;
    $[7] = rowCount;
    $[8] = t;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  return t1;
};
//# sourceMappingURL=index.js.map