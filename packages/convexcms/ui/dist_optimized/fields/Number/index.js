"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isNumber } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { ReactSelect } from "../../elements/ReactSelect/index.js";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { useField } from "../../forms/useField/index.js";
import { withCondition } from "../../forms/withCondition/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { FieldDescription } from "../FieldDescription/index.js";
import { FieldError } from "../FieldError/index.js";
import { FieldLabel } from "../FieldLabel/index.js";
import { mergeFieldStyles } from "../mergeFieldStyles.js";
import { fieldBaseClass } from "../shared/index.js";
const NumberFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        placeholder,
        step = 1
      } = {},
      hasMany = false,
      label,
      localized,
      max = Infinity,
      maxRows = Infinity,
      min = -Infinity,
      required
    },
    onChange: onChangeFromProps,
    path,
    readOnly,
    validate
  } = props;
  const {
    i18n,
    t
  } = useTranslation();
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === "function") {
      return validate(value, {
        ...options,
        max,
        min,
        required
      });
    }
  }, [validate, min, max, required]);
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
  const handleChange = useCallback(e => {
    const val = parseFloat(e.target.value);
    let newVal = val;
    if (Number.isNaN(val)) {
      newVal = null;
    }
    if (typeof onChangeFromProps === "function") {
      onChangeFromProps(newVal);
    }
    setValue(newVal);
  }, [onChangeFromProps, setValue]);
  const [valueToRender, setValueToRender] = useState([]); // Only for hasMany
  const handleHasManyChange = useCallback(selectedOption => {
    if (!(readOnly || disabled)) {
      let newValue;
      if (!selectedOption) {
        newValue = [];
      } else if (Array.isArray(selectedOption)) {
        newValue = selectedOption.map(option => Number(option.value?.value || option.value));
      } else {
        newValue = [Number(selectedOption.value?.value || selectedOption.value)];
      }
      setValue(newValue);
    }
  }, [readOnly, disabled, setValue]);
  // useEffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(value.map((val, index) => {
        return {
          id: `${val}${index}`,
          label: `${val}`,
          value: {
            toString: () => `${val}${index}`,
            value: val?.value || val
          }
        };
      }));
    }
  }, [value, hasMany]);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, "number", className, showError && "error", (readOnly || disabled) && "read-only", hasMany && "has-many"].filter(Boolean).join(" "),
    style: styles,
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
        disabled: readOnly || disabled,
        filterOption: (_, rawInput) => {
          const isOverHasMany = Array.isArray(value) && value.length >= maxRows;
          return isNumber(rawInput) && !isOverHasMany;
        },
        isClearable: true,
        isCreatable: true,
        isMulti: true,
        isSortable: true,
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
        // numberOnly
        onChange: handleHasManyChange,
        options: [],
        placeholder: t("general:enterAValue"),
        showError: showError,
        value: valueToRender
      }) : /*#__PURE__*/_jsx("div", {
        children: /*#__PURE__*/_jsx("input", {
          disabled: readOnly || disabled,
          id: `field-${path.replace(/\./g, "__")}`,
          max: max,
          min: min,
          name: path,
          onChange: handleChange,
          onWheel: e => {
            // @ts-expect-error
            e.target.blur();
          },
          placeholder: getTranslation(placeholder, i18n),
          step: step,
          type: "number",
          value: typeof value === "number" ? value : ""
        })
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
export const NumberField = withCondition(NumberFieldComponent);
//# sourceMappingURL=index.js.map