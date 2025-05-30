"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { ArrayAction } from "../../elements/ArrayAction/index.js";
import { Collapsible } from "../../elements/Collapsible/index.js";
import { ErrorPill } from "../../elements/ErrorPill/index.js";
import { ShimmerEffect } from "../../elements/ShimmerEffect/index.js";
import { useFormSubmitted } from "../../forms/Form/context.js";
import { RenderFields } from "../../forms/RenderFields/index.js";
import { RowLabel } from "../../forms/RowLabel/index.js";
import { useThrottledValue } from "../../hooks/useThrottledValue.js";
import { useTranslation } from "../../providers/Translation/index.js";
const baseClass = "array-field";
export const ArrayRow = ({
  addRow,
  attributes,
  CustomRowLabel,
  duplicateRow,
  errorCount,
  fields,
  forceRender = false,
  hasMaxRows,
  isDragging,
  isLoading: isLoadingFromProps,
  isSortable,
  labels,
  listeners,
  moveRow,
  parentPath,
  path,
  permissions,
  readOnly,
  removeRow,
  row,
  rowCount,
  rowIndex,
  schemaPath,
  setCollapse,
  setNodeRef,
  transform,
  transition
}) => {
  const isLoading = useThrottledValue(isLoadingFromProps, 500);
  const {
    i18n
  } = useTranslation();
  const hasSubmitted = useFormSubmitted();
  const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowIndex + 1).padStart(2, "0")}`;
  const fieldHasErrors = errorCount > 0 && hasSubmitted;
  const classNames = [`${baseClass}__row`, fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`].filter(Boolean).join(" ");
  return /*#__PURE__*/_jsx("div", {
    id: `${parentPath.split(".").join("-")}-row-${rowIndex}`,
    ref: setNodeRef,
    style: {
      transform,
      transition,
      zIndex: isDragging ? 1 : undefined
    },
    children: /*#__PURE__*/_jsx(Collapsible, {
      actions: !readOnly ? /*#__PURE__*/_jsx(ArrayAction, {
        addRow: addRow,
        duplicateRow: duplicateRow,
        hasMaxRows: hasMaxRows,
        index: rowIndex,
        isSortable: isSortable,
        moveRow: moveRow,
        removeRow: removeRow,
        rowCount: rowCount
      }) : undefined,
      className: classNames,
      collapsibleStyle: fieldHasErrors ? "error" : "default",
      dragHandleProps: isSortable ? {
        id: row.id,
        attributes,
        listeners
      } : undefined,
      header: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__row-header`,
        children: [isLoading ? /*#__PURE__*/_jsx(ShimmerEffect, {
          height: "1rem",
          width: "8rem"
        }) : /*#__PURE__*/_jsx(RowLabel, {
          CustomComponent: CustomRowLabel,
          label: fallbackLabel,
          path: path,
          rowNumber: rowIndex
        }), fieldHasErrors && /*#__PURE__*/_jsx(ErrorPill, {
          count: errorCount,
          i18n: i18n,
          withMessage: true
        })]
      }),
      isCollapsed: row.collapsed,
      onToggle: collapsed => setCollapse(row.id, collapsed),
      children: isLoading ? /*#__PURE__*/_jsx(ShimmerEffect, {}) : /*#__PURE__*/_jsx(RenderFields, {
        className: `${baseClass}__fields`,
        fields: fields,
        forceRender: forceRender,
        margins: "small",
        parentIndexPath: "",
        parentPath: path,
        parentSchemaPath: schemaPath,
        permissions: permissions === true ? permissions : permissions?.fields,
        readOnly: readOnly
      })
    })
  }, `${parentPath}-row-${row.id}`);
};
//# sourceMappingURL=ArrayRow.js.map