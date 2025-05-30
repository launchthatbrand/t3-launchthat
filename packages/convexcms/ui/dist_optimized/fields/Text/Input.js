"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { getTranslation } from "@convexcms/translations";
import { ReactSelect } from "../../elements/ReactSelect/index.js";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { FieldDescription } from "../../fields/FieldDescription/index.js";
import { FieldError } from "../../fields/FieldError/index.js";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { fieldBaseClass } from "../shared/index.js";
export const TextInput = props => {
  const {
    AfterInput,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    hasMany,
    inputRef,
    Label,
    label,
    localized,
    maxRows,
    onChange,
    onKeyDown,
    path,
    placeholder,
    readOnly,
    required,
    rtl,
    showError,
    style,
    value,
    valueToRender
  } = props;
  const {
    i18n,
    t
  } = useTranslation();
  const editableProps = (data, className, selectProps) => {
    const editableClassName = `${className}--editable`;
    return {
      onBlur: event => {
        event.currentTarget.contentEditable = "false";
      },
      onClick: event => {
        event.currentTarget.contentEditable = "true";
        event.currentTarget.classList.add(editableClassName);
        event.currentTarget.focus();
      },
      onKeyDown: event => {
        if (event.key === "Enter" || event.key === "Tab" || event.key === "Escape") {
          event.currentTarget.contentEditable = "false";
          event.currentTarget.classList.remove(editableClassName);
          data.value.value = event.currentTarget.innerText;
          data.label = event.currentTarget.innerText;
          if (data.value.value.replaceAll("\n", "")) {
            selectProps.onChange(selectProps.value, {
              action: "create-option",
              option: data
            });
          } else {
            if (Array.isArray(selectProps.value)) {
              const newValues = selectProps.value.filter(v => v.id !== data.id);
              selectProps.onChange(newValues, {
                action: "pop-value",
                removedValue: data
              });
            }
          }
          event.preventDefault();
        }
        event.stopPropagation();
      }
    };
  };
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, "text", className, showError && "error", readOnly && "read-only", hasMany && "has-many"].filter(Boolean).join(" "),
    style: style,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          path: path,
          showError: showError
        })
      }), BeforeInput, hasMany ? /*#__PURE__*/_jsx(ReactSelect, {
        className: `field-${path.replace(/\./g, "__")}`,
        components: {
          DropdownIndicator: null
        },
        customProps: {
          editableProps
        },
        disabled: readOnly,
        // prevent adding additional options if maxRows is reached
        filterOption: () => !maxRows ? true : !(Array.isArray(value) && maxRows && value.length >= maxRows),
        isClearable: false,
        isCreatable: true,
        isMulti: true,
        isSortable: true,
        menuIsOpen: false,
        noOptionsMessage: () => {
          const isOverHasMany = Array.isArray(value) && value.length >= maxRows;
          if (isOverHasMany) {
            return t("validation:limitReached", {
              max: maxRows,
              value: value.length + 1
            });
          }
          return null;
        },
        onChange: onChange,
        options: [],
        placeholder: t("general:enterAValue"),
        showError: showError,
        value: valueToRender
      }) : /*#__PURE__*/_jsx("input", {
        "data-rtl": rtl,
        disabled: readOnly,
        id: `field-${path?.replace(/\./g, "__")}`,
        name: path,
        onChange: onChange,
        onKeyDown: onKeyDown,
        placeholder: getTranslation(placeholder, i18n),
        ref: inputRef,
        type: "text",
        value: value || ""
      }), AfterInput, /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: /*#__PURE__*/_jsx(FieldDescription, {
          description: description,
          path: path
        })
      })]
    })]
  });
};
//# sourceMappingURL=Input.js.map