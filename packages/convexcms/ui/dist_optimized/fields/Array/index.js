"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useCallback } from "react";
import { getTranslation } from "@convexcms/translations";
import { Banner } from "../../elements/Banner/index.js";
import { Button } from "../../elements/Button/index.js";
import { DraggableSortableItem } from "../../elements/DraggableSortable/DraggableSortableItem/index.js";
import { DraggableSortable } from "../../elements/DraggableSortable/index.js";
import { ErrorPill } from "../../elements/ErrorPill/index.js";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { FieldDescription } from "../../fields/FieldDescription/index.js";
import { FieldError } from "../../fields/FieldError/index.js";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { useForm, useFormSubmitted } from "../../forms/Form/context.js";
import { extractRowsAndCollapsedIDs, toggleAllRows } from "../../forms/Form/rowHelpers.js";
import { NullifyLocaleField } from "../../forms/NullifyField/index.js";
import { useField } from "../../forms/useField/index.js";
import { withCondition } from "../../forms/withCondition/index.js";
import { useConfig } from "../../providers/Config/index.js";
import { useDocumentInfo } from "../../providers/DocumentInfo/index.js";
import { useLocale } from "../../providers/Locale/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { scrollToID } from "../../utilities/scrollToID.js";
import { fieldBaseClass } from "../shared/index.js";
import { ArrayRow } from "./ArrayRow.js";
const baseClass = "array-field";
export const ArrayFieldComponent = props => {
  const {
    field: {
      name,
      admin: {
        className,
        description,
        isSortable = true
      } = {},
      fields,
      label,
      localized,
      maxRows,
      minRows: minRowsProp,
      required
    },
    forceRender = false,
    path,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps,
    validate
  } = props;
  const schemaPath = schemaPathFromProps ?? name;
  const minRows = minRowsProp ?? required ? 1 : 0;
  const {
    setDocFieldPreferences
  } = useDocumentInfo();
  const {
    addFieldRow,
    dispatchFields,
    moveFieldRow,
    removeFieldRow,
    setModified
  } = useForm();
  const submitted = useFormSubmitted();
  const {
    code: locale
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    config: {
      localization
    }
  } = useConfig();
  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale;
      return locale === defaultLocale;
    }
    return true;
  })();
  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = p => {
    if ("labels" in p && p?.labels) {
      return p.labels;
    }
    if ("labels" in p.field && p.field.labels) {
      return {
        plural: p.field.labels?.plural,
        singular: p.field.labels?.singular
      };
    }
    if ("label" in p.field && p.field.label) {
      return {
        plural: undefined,
        singular: p.field.label
      };
    }
    return {
      plural: t("general:rows"),
      singular: t("general:row")
    };
  };
  const labels = getLabels(props);
  const memoizedValidate = useCallback((value, options) => {
    // alternative locales can be null
    if (!editingDefaultLocale && value === null) {
      return true;
    }
    if (typeof validate === "function") {
      return validate(value, {
        ...options,
        maxRows,
        minRows,
        required
      });
    }
  }, [maxRows, minRows, required, validate, editingDefaultLocale]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    errorPaths,
    rows = [],
    showError,
    valid,
    value
  } = useField({
    hasRows: true,
    path,
    validate: memoizedValidate
  });
  const addRow = useCallback(rowIndex => {
    addFieldRow({
      path,
      rowIndex,
      schemaPath
    });
    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex}`);
    }, 0);
  }, [addFieldRow, path, schemaPath]);
  const duplicateRow = useCallback(rowIndex => {
    dispatchFields({
      type: "DUPLICATE_ROW",
      path,
      rowIndex
    });
    setModified(true);
    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex}`);
    }, 0);
  }, [dispatchFields, path, setModified]);
  const removeRow = useCallback(rowIndex => {
    removeFieldRow({
      path,
      rowIndex
    });
  }, [removeFieldRow, path]);
  const moveRow = useCallback((moveFromIndex, moveToIndex) => {
    moveFieldRow({
      moveFromIndex,
      moveToIndex,
      path
    });
  }, [path, moveFieldRow]);
  const toggleCollapseAll = useCallback(collapsed => {
    const {
      collapsedIDs,
      updatedRows
    } = toggleAllRows({
      collapsed,
      rows
    });
    setDocFieldPreferences(path, {
      collapsed: collapsedIDs
    });
    dispatchFields({
      type: "SET_ALL_ROWS_COLLAPSED",
      path,
      updatedRows
    });
  }, [dispatchFields, path, rows, setDocFieldPreferences]);
  const setCollapse = useCallback((rowID, collapsed) => {
    const {
      collapsedIDs,
      updatedRows
    } = extractRowsAndCollapsedIDs({
      collapsed,
      rowID,
      rows
    });
    dispatchFields({
      type: "SET_ROW_COLLAPSED",
      path,
      updatedRows
    });
    setDocFieldPreferences(path, {
      collapsed: collapsedIDs
    });
  }, [dispatchFields, path, rows, setDocFieldPreferences]);
  const hasMaxRows = maxRows && rows.length >= maxRows;
  const fieldErrorCount = errorPaths.length;
  const fieldHasErrors = submitted && errorPaths.length > 0;
  const showRequired = (readOnly || disabled) && rows.length === 0;
  const showMinRows = rows.length < minRows || required && rows.length === 0;
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`].filter(Boolean).join(" "),
    id: `field-${path.replace(/\./g, "__")}`,
    children: [showError && /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Error,
      Fallback: /*#__PURE__*/_jsx(FieldError, {
        path: path,
        showError: showError
      })
    }), /*#__PURE__*/_jsxs("header", {
      className: `${baseClass}__header`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__header-wrap`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__header-content`,
          children: [/*#__PURE__*/_jsx("h3", {
            className: `${baseClass}__title`,
            children: /*#__PURE__*/_jsx(RenderCustomComponent, {
              CustomComponent: Label,
              Fallback: /*#__PURE__*/_jsx(FieldLabel, {
                as: "span",
                label: label,
                localized: localized,
                path: path,
                required: required
              })
            })
          }), fieldHasErrors && fieldErrorCount > 0 && /*#__PURE__*/_jsx(ErrorPill, {
            count: fieldErrorCount,
            i18n: i18n,
            withMessage: true
          })]
        }), rows?.length > 0 && /*#__PURE__*/_jsxs("ul", {
          className: `${baseClass}__header-actions`,
          children: [/*#__PURE__*/_jsx("li", {
            children: /*#__PURE__*/_jsx("button", {
              className: `${baseClass}__header-action`,
              onClick: () => toggleCollapseAll(true),
              type: "button",
              children: t("fields:collapseAll")
            })
          }), /*#__PURE__*/_jsx("li", {
            children: /*#__PURE__*/_jsx("button", {
              className: `${baseClass}__header-action`,
              onClick: () => toggleCollapseAll(false),
              type: "button",
              children: t("fields:showAll")
            })
          })]
        })]
      }), /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: /*#__PURE__*/_jsx(FieldDescription, {
          description: description,
          path: path
        })
      })]
    }), /*#__PURE__*/_jsx(NullifyLocaleField, {
      fieldValue: value,
      localized: localized,
      path: path
    }), BeforeInput, (rows?.length > 0 || !valid && (showRequired || showMinRows)) && /*#__PURE__*/_jsxs(DraggableSortable, {
      className: `${baseClass}__draggable-rows`,
      ids: rows.map(row => row.id),
      onDragEnd: ({
        moveFromIndex,
        moveToIndex
      }) => moveRow(moveFromIndex, moveToIndex),
      children: [rows.map((rowData, i) => {
        const {
          id: rowID,
          isLoading
        } = rowData;
        const rowPath = `${path}.${i}`;
        const rowErrorCount = errorPaths?.filter(errorPath => errorPath.startsWith(rowPath + ".")).length;
        return /*#__PURE__*/_jsx(DraggableSortableItem, {
          disabled: readOnly || disabled || !isSortable,
          id: rowID,
          children: draggableSortableItemProps => /*#__PURE__*/_jsx(ArrayRow, {
            ...draggableSortableItemProps,
            addRow: addRow,
            CustomRowLabel: rows?.[i]?.customComponents?.RowLabel,
            duplicateRow: duplicateRow,
            errorCount: rowErrorCount,
            fields: fields,
            forceRender: forceRender,
            hasMaxRows: hasMaxRows,
            isLoading: isLoading,
            isSortable: isSortable,
            labels: labels,
            moveRow: moveRow,
            parentPath: path,
            path: rowPath,
            permissions: permissions,
            readOnly: readOnly || disabled,
            removeRow: removeRow,
            row: rowData,
            rowCount: rows?.length,
            rowIndex: i,
            schemaPath: schemaPath,
            setCollapse: setCollapse
          })
        }, rowID);
      }), !valid && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [showRequired && /*#__PURE__*/_jsx(Banner, {
          children: t("validation:fieldHasNo", {
            label: getTranslation(labels.plural, i18n)
          })
        }), showMinRows && /*#__PURE__*/_jsx(Banner, {
          type: "error",
          children: t("validation:requiresAtLeast", {
            count: minRows,
            label: getTranslation(minRows > 1 ? labels.plural : labels.singular, i18n) || t(minRows > 1 ? "general:rows" : "general:row")
          })
        })]
      })]
    }), !hasMaxRows && !readOnly && /*#__PURE__*/_jsx(Button, {
      buttonStyle: "icon-label",
      className: `${baseClass}__add-row`,
      icon: "plus",
      iconPosition: "left",
      iconStyle: "with-border",
      onClick: () => {
        void addRow(value || 0);
      },
      children: t("fields:addLabel", {
        label: getTranslation(labels.singular, i18n)
      })
    }), AfterInput]
  });
};
export const ArrayField = withCondition(ArrayFieldComponent);
//# sourceMappingURL=index.js.map