'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { EditIcon } from '../../../../icons/Edit/index.js';
import { useCellProps } from '../../../../providers/TableColumns/RenderDefaultCell/index.js';
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js';
import { DefaultCell } from '../../../Table/DefaultCell/index.js';
import './index.scss';
export const DrawerLink = props => {
  const $ = _c(15);
  const {
    onDrawerDelete: onDrawerDeleteFromProps,
    onDrawerSave: onDrawerSaveFromProps
  } = props;
  const cellProps = useCellProps();
  const t0 = cellProps?.rowData.id;
  const t1 = cellProps?.collectionSlug;
  let t2;
  if ($[0] !== t0 || $[1] !== t1) {
    t2 = {
      id: t0,
      collectionSlug: t1
    };
    $[0] = t0;
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const [DocumentDrawer, DocumentDrawerToggler, t3] = useDocumentDrawer(t2);
  const {
    closeDrawer
  } = t3;
  let t4;
  if ($[3] !== closeDrawer || $[4] !== onDrawerSaveFromProps) {
    t4 = args => {
      closeDrawer();
      if (typeof onDrawerSaveFromProps === "function") {
        onDrawerSaveFromProps(args);
      }
    };
    $[3] = closeDrawer;
    $[4] = onDrawerSaveFromProps;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const onDrawerSave = t4;
  let t5;
  if ($[6] !== closeDrawer || $[7] !== onDrawerDeleteFromProps) {
    t5 = args_0 => {
      closeDrawer();
      if (typeof onDrawerDeleteFromProps === "function") {
        onDrawerDeleteFromProps(args_0);
      }
    };
    $[6] = closeDrawer;
    $[7] = onDrawerDeleteFromProps;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  const onDrawerDelete = t5;
  let t6;
  if ($[9] !== DocumentDrawer || $[10] !== DocumentDrawerToggler || $[11] !== cellProps || $[12] !== onDrawerDelete || $[13] !== onDrawerSave) {
    t6 = _jsxs("div", {
      className: "drawer-link",
      children: [_jsx(DefaultCell, {
        ...cellProps,
        className: "drawer-link__cell",
        link: false,
        onClick: null
      }), _jsx(DocumentDrawerToggler, {
        children: _jsx(EditIcon, {})
      }), _jsx(DocumentDrawer, {
        onDelete: onDrawerDelete,
        onSave: onDrawerSave
      })]
    });
    $[9] = DocumentDrawer;
    $[10] = DocumentDrawerToggler;
    $[11] = cellProps;
    $[12] = onDrawerDelete;
    $[13] = onDrawerSave;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
};
//# sourceMappingURL=index.js.map