"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { useListDrawerContext } from "../../../elements/ListDrawer/Provider.js";
import { DefaultCell } from "../../../elements/Table/DefaultCell/index.js";
import { useTableColumns } from "../index.js";
const baseClass = "default-cell";
const CellPropsContext = /*#__PURE__*/React.createContext(null);
export const useCellProps = () => React.use(CellPropsContext);
export const RenderDefaultCell = ({
  clientProps,
  columnIndex,
  isLinkedColumn
}) => {
  const {
    drawerSlug,
    onSelect
  } = useListDrawerContext();
  const {
    LinkedCellOverride
  } = useTableColumns();
  const propsToPass = {
    ...clientProps,
    columnIndex
  };
  if (isLinkedColumn && drawerSlug) {
    propsToPass.className = `${baseClass}__first-cell`;
    propsToPass.link = false;
    propsToPass.onClick = ({
      collectionSlug: rowColl,
      rowData
    }) => {
      if (typeof onSelect === "function") {
        onSelect({
          collectionSlug: rowColl,
          doc: rowData,
          docID: rowData.id
        });
      }
    };
  }
  return /*#__PURE__*/_jsx(CellPropsContext, {
    value: propsToPass,
    children: isLinkedColumn && LinkedCellOverride ? LinkedCellOverride : /*#__PURE__*/_jsx(DefaultCell, {
      ...propsToPass
    })
  });
};
//# sourceMappingURL=index.js.map