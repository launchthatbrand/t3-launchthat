"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useModal } from "@faceless-ui/modal";
import { ArrayAction } from "../../elements/ArrayAction/index.js";
import { useDrawerSlug } from "../../elements/Drawer/useDrawerSlug.js";
import { BlocksDrawer } from "./BlocksDrawer/index.js";
export const RowActions = props => {
  const {
    addRow,
    blocks,
    blockType,
    duplicateRow,
    hasMaxRows,
    isSortable,
    labels,
    moveRow,
    removeRow,
    rowCount,
    rowIndex
  } = props;
  const {
    closeModal,
    openModal
  } = useModal();
  const drawerSlug = useDrawerSlug("blocks-drawer");
  const [indexToAdd, setIndexToAdd] = React.useState(null);
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx(BlocksDrawer, {
      addRow: (_, rowBlockType) => {
        if (typeof addRow === "function") {
          void addRow(indexToAdd, rowBlockType);
        }
        closeModal(drawerSlug);
      },
      addRowIndex: rowIndex,
      blocks: blocks,
      drawerSlug: drawerSlug,
      labels: labels
    }), /*#__PURE__*/_jsx(ArrayAction, {
      addRow: index => {
        setIndexToAdd(index);
        openModal(drawerSlug);
      },
      duplicateRow: () => duplicateRow(rowIndex, blockType),
      hasMaxRows: hasMaxRows,
      index: rowIndex,
      isSortable: isSortable,
      moveRow: moveRow,
      removeRow: removeRow,
      rowCount: rowCount
    })]
  });
};
//# sourceMappingURL=RowActions.js.map