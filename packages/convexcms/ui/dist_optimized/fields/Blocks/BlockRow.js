"use client";

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { Collapsible } from "../../elements/Collapsible/index.js";
import { ErrorPill } from "../../elements/ErrorPill/index.js";
import { Pill } from "../../elements/Pill/index.js";
import { ShimmerEffect } from "../../elements/ShimmerEffect/index.js";
import { useFormSubmitted } from "../../forms/Form/context.js";
import { RenderFields } from "../../forms/RenderFields/index.js";
import { RowLabel } from "../../forms/RowLabel/index.js";
import { useThrottledValue } from "../../hooks/useThrottledValue.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { RowActions } from "./RowActions.js";
import { SectionTitle } from "./SectionTitle/index.js";
const baseClass = "blocks-field";
export const BlockRow = ({
  addRow,
  attributes,
  block,
  blocks,
  duplicateRow,
  errorCount,
  fields,
  hasMaxRows,
  isLoading: isLoadingFromProps,
  isSortable,
  Label,
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
  transform
}) => {
  const isLoading = useThrottledValue(isLoadingFromProps, 500);
  const {
    i18n
  } = useTranslation();
  const hasSubmitted = useFormSubmitted();
  const fieldHasErrors = hasSubmitted && errorCount > 0;
  const showBlockName = !block.admin?.disableBlockName;
  const classNames = [`${baseClass}__row`, fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`].filter(Boolean).join(" ");
  let blockPermissions = undefined;
  if (permissions === true) {
    blockPermissions = true;
  } else {
    const permissionsBlockSpecific = permissions?.blocks?.[block.slug];
    if (permissionsBlockSpecific === true) {
      blockPermissions = true;
    } else {
      blockPermissions = permissionsBlockSpecific?.fields;
    }
  }
  return /*#__PURE__*/_jsx("div", {
    id: `${parentPath?.split(".").join("-")}-row-${rowIndex}`,
    ref: setNodeRef,
    style: {
      transform
    },
    children: /*#__PURE__*/_jsx(Collapsible, {
      actions: !readOnly ? /*#__PURE__*/_jsx(RowActions, {
        addRow: addRow,
        blocks: blocks,
        blockType: row.blockType,
        duplicateRow: duplicateRow,
        fields: block.fields,
        hasMaxRows: hasMaxRows,
        isSortable: isSortable,
        labels: labels,
        moveRow: moveRow,
        removeRow: removeRow,
        rowCount: rowCount,
        rowIndex: rowIndex
      }) : undefined,
      className: classNames,
      collapsibleStyle: fieldHasErrors ? "error" : "default",
      dragHandleProps: isSortable ? {
        id: row.id,
        attributes,
        listeners
      } : undefined,
      header: isLoading ? /*#__PURE__*/_jsx(ShimmerEffect, {
        height: "1rem",
        width: "8rem"
      }) : /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__block-header`,
        children: [/*#__PURE__*/_jsx(RowLabel, {
          CustomComponent: Label,
          label: /*#__PURE__*/_jsxs(_Fragment, {
            children: [/*#__PURE__*/_jsx("span", {
              className: `${baseClass}__block-number`,
              children: String(rowIndex + 1).padStart(2, "0")
            }), /*#__PURE__*/_jsx(Pill, {
              className: `${baseClass}__block-pill ${baseClass}__block-pill-${row.blockType}`,
              pillStyle: "white",
              children: getTranslation(block.labels.singular, i18n)
            }), showBlockName && /*#__PURE__*/_jsx(SectionTitle, {
              path: `${path}.blockName`,
              readOnly: readOnly
            })]
          }),
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
        margins: "small",
        parentIndexPath: "",
        parentPath: path,
        parentSchemaPath: schemaPath,
        permissions: blockPermissions,
        readOnly: readOnly
      })
    }, row.id)
  }, `${parentPath}-row-${rowIndex}`);
};
//# sourceMappingURL=BlockRow.js.map