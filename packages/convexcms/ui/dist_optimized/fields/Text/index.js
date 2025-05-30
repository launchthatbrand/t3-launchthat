"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import "./index.scss";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useField } from "../../forms/useField/index.js";
import { withCondition } from "../../forms/withCondition/index.js";
import { useConfig } from "../../providers/Config/index.js";
import { useLocale } from "../../providers/Locale/index.js";
import { mergeFieldStyles } from "../mergeFieldStyles.js";
import { isFieldRTL } from "../shared/index.js";
import { TextInput } from "./Input.js";
export { TextInput };
const TextFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        placeholder,
        rtl
      } = {},
      hasMany,
      label,
      localized,
      maxLength,
      maxRows,
      minLength,
      minRows,
      required
    },
    inputRef,
    path,
    readOnly,
    validate
  } = props;
  const locale = useLocale();
  const {
    config: {
      localization: localizationConfig
    }
  } = useConfig();
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === "function") {
      return validate(value, {
        ...options,
        maxLength,
        minLength,
        required
      });
    }
  }, [validate, minLength, maxLength, required]);
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
    path,
    validate: memoizedValidate
  });
  const renderRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localizationConfig || undefined
  });
  const [valueToRender, setValueToRender] = useState([]); // Only for hasMany
  const handleHasManyChange = useCallback(selectedOption => {
    if (!(readOnly || disabled)) {
      let newValue;
      if (!selectedOption) {
        newValue = [];
      } else if (Array.isArray(selectedOption)) {
        newValue = selectedOption.map(option => option.value?.value || option.value);
      } else {
        newValue = [selectedOption.value?.value || selectedOption.value];
      }
      setValue(newValue);
    }
  }, [readOnly, setValue, disabled]);
  // useEffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(value.map((val, index) => {
        return {
          id: `${val}${index}`,
          label: `${val}`,
          value: {
            // React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
            toString: () => `${val}${index}`,
            value: val?.value || val
          }
        };
      }));
    }
  }, [value, hasMany]);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsx(TextInput, {
    AfterInput: AfterInput,
    BeforeInput: BeforeInput,
    className: className,
    Description: Description,
    description: description,
    Error: Error,
    hasMany: hasMany,
    inputRef: inputRef,
    Label: Label,
    label: label,
    localized: localized,
    maxRows: maxRows,
    minRows: minRows,
    onChange: hasMany ? handleHasManyChange : e => {
      setValue(e.target.value);
    },
    path: path,
    placeholder: placeholder,
    readOnly: readOnly || disabled,
    required: required,
    rtl: renderRTL,
    showError: showError,
    style: styles,
    value: value || "",
    valueToRender: valueToRender
  });
};
export const TextField = withCondition(TextFieldComponent);
//# sourceMappingURL=index.js.map