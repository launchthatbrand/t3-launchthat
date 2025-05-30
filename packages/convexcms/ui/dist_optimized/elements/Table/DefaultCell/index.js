"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react"; // TODO: abstract this out to support all routers
import { fieldAffectsData, fieldIsID } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { useConfig } from "../../../providers/Config/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
import { formatAdminURL } from "../../../utilities/formatAdminURL.js";
import { getDisplayedFieldValue } from "../../../utilities/getDisplayedFieldValue.js";
import { Link } from "../../Link/index.js";
import { CodeCell } from "./fields/Code/index.js";
import { cellComponents } from "./fields/index.js";
export const DefaultCell = props => {
  const {
    cellData,
    className: classNameFromProps,
    collectionSlug,
    field,
    field: {
      admin
    },
    link,
    onClick: onClickFromProps,
    rowData
  } = props;
  const {
    i18n
  } = useTranslation();
  const {
    config: {
      routes: {
        admin: adminRoute
      }
    },
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const classNameFromConfigContext = admin && "className" in admin ? admin.className : undefined;
  const className = classNameFromProps || (field.admin && "className" in field.admin ? field.admin.className : null) || classNameFromConfigContext;
  const onClick = onClickFromProps;
  let WrapElement = "span";
  const wrapElementProps = {
    className
  };
  if (link) {
    wrapElementProps.prefetch = false;
    WrapElement = Link;
    wrapElementProps.href = collectionConfig?.slug ? formatAdminURL({
      adminRoute,
      path: `/collections/${collectionConfig?.slug}/${encodeURIComponent(rowData.id)}`
    }) : "";
  }
  if (typeof onClick === "function") {
    WrapElement = "button";
    wrapElementProps.type = "button";
    wrapElementProps.onClick = () => {
      onClick({
        cellData,
        collectionSlug: collectionConfig?.slug,
        rowData
      });
    };
  }
  if (fieldIsID(field)) {
    return /*#__PURE__*/_jsx(WrapElement, {
      ...wrapElementProps,
      children: /*#__PURE__*/_jsx(CodeCell, {
        cellData: `ID: ${cellData}`,
        collectionConfig: collectionConfig,
        collectionSlug: collectionSlug,
        field: {
          ...field,
          type: "code"
        },
        nowrap: true,
        rowData: rowData
      })
    });
  }
  const displayedValue = getDisplayedFieldValue(cellData, field, i18n);
  const DefaultCellComponent = typeof cellData !== "undefined" && cellComponents[field.type];
  let CellComponent = null;
  // Handle JSX labels before using DefaultCellComponent
  if (/*#__PURE__*/React.isValidElement(displayedValue)) {
    CellComponent = displayedValue;
  } else if (DefaultCellComponent) {
    CellComponent = /*#__PURE__*/_jsx(DefaultCellComponent, {
      cellData: cellData,
      rowData: rowData,
      ...props
    });
  } else if (!DefaultCellComponent) {
    // DefaultCellComponent does not exist for certain field types like `text`
    if (collectionConfig?.upload && fieldAffectsData(field) && field.name === "filename" && field.type === "text") {
      const FileCellComponent = cellComponents.File;
      CellComponent = /*#__PURE__*/_jsx(FileCellComponent, {
        cellData: cellData,
        rowData: rowData,
        ...props,
        collectionConfig: collectionConfig,
        field: field
      });
    } else {
      return /*#__PURE__*/_jsxs(WrapElement, {
        ...wrapElementProps,
        children: [(displayedValue === "" || typeof displayedValue === "undefined" || displayedValue === null) && i18n.t("general:noLabel", {
          label: getTranslation(("label" in field ? field.label : null) || "data", i18n)
        }), typeof displayedValue === "string" && displayedValue, typeof displayedValue === "number" && displayedValue, typeof displayedValue === "object" && displayedValue !== null && JSON.stringify(displayedValue)]
      });
    }
  }
  if ((field.type === "select" || field.type === "radio") && field.options.length && cellData) {
    const classes = Array.isArray(cellData) ? cellData.map(value => `selected--${value}`).join(" ") : `selected--${cellData}`;
    const className = [wrapElementProps.className, classes].filter(Boolean).join(" ");
    return /*#__PURE__*/_jsx(WrapElement, {
      ...wrapElementProps,
      className: className,
      children: CellComponent
    });
  }
  return /*#__PURE__*/_jsx(WrapElement, {
    ...wrapElementProps,
    children: CellComponent
  });
};
//# sourceMappingURL=index.js.map