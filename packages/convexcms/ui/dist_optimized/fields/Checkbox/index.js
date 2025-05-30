"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useMemo } from "react";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { FieldDescription } from "../../fields/FieldDescription/index.js";
import { FieldError } from "../../fields/FieldError/index.js";
import { useForm } from "../../forms/Form/context.js";
import { useField } from "../../forms/useField/index.js";
import { withCondition } from "../../forms/withCondition/index.js";
import { useEditDepth } from "../../providers/EditDepth/index.js";
import { generateFieldID } from "../../utilities/generateFieldID.js";
import { mergeFieldStyles } from "../mergeFieldStyles.js";
import { fieldBaseClass } from "../shared/index.js";
import { CheckboxInput } from "./Input.js";
import "./index.scss";
const baseClass = "checkbox";
export { CheckboxInput };
const CheckboxFieldComponent = props => {
  const {
    id,
    checked: checkedFromProps,
    disableFormData,
    field,
    field: {
      admin: {
        className,
        description
      } = {},
      label,
      required
    } = {},
    onChange: onChangeFromProps,
    partialChecked,
    path,
    readOnly,
    validate
  } = props;
  const {
    uuid
  } = useForm();
  const editDepth = useEditDepth();
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === "function") {
      return validate(value, {
        ...options,
        required
      });
    }
  }, [validate, required]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    setValue,
    showError,
    value
  } = useField({
    disableFormData,
    path,
    validate: memoizedValidate
  });
  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value);
      if (typeof onChangeFromProps === "function") {
        onChangeFromProps(!value);
      }
    }
  }, [onChangeFromProps, readOnly, setValue, value]);
  const checked = checkedFromProps || Boolean(value);
  const fieldID = id || generateFieldID(path, editDepth, uuid);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, showError && "error", className, value && `${baseClass}--checked`, (readOnly || disabled) && `${baseClass}--read-only`].filter(Boolean).join(" "),
    style: styles,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Error,
      Fallback: /*#__PURE__*/_jsx(FieldError, {
        path: path,
        showError: showError
      })
    }), /*#__PURE__*/_jsx(CheckboxInput, {
      AfterInput: AfterInput,
      BeforeInput: BeforeInput,
      checked: checked,
      id: fieldID,
      inputRef: null,
      Label: Label,
      label: label,
      name: path,
      onToggle: onToggle,
      partialChecked: partialChecked,
      readOnly: readOnly || disabled,
      required: required
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
export const CheckboxField = withCondition(CheckboxFieldComponent);
//# sourceMappingURL=index.js.map