"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { useEffectEvent } from "../../../hooks/useEffectEvent.js";
import { useTranslation } from "../../../providers/Translation/index.js";
import { Button } from "../../Button/index.js";
import { ReactSelect } from "../../ReactSelect/index.js";
import { DefaultFilter } from "./DefaultFilter/index.js";
const baseClass = "condition";
export const Condition = props => {
  const {
    addCondition,
    andIndex,
    fieldName,
    filterOptions,
    operator,
    orIndex,
    reducedFields,
    removeCondition,
    RenderedFilter,
    updateCondition,
    value
  } = props;
  const {
    t
  } = useTranslation();
  const reducedField = reducedFields.find(field => field.value === fieldName);
  const [internalValue, setInternalValue] = useState(value);
  const debouncedValue = useDebounce(internalValue, 300);
  const booleanSelect = ["exists"].includes(operator) || reducedField?.field?.type === "checkbox";
  let valueOptions = [];
  if (booleanSelect) {
    valueOptions = [{
      label: t("general:true"),
      value: "true"
    }, {
      label: t("general:false"),
      value: "false"
    }];
  } else if (reducedField?.field && "options" in reducedField.field) {
    valueOptions = reducedField.field.options;
  }
  const updateValue = useEffectEvent(async debouncedValue => {
    if (operator) {
      await updateCondition({
        andIndex,
        field: reducedField,
        operator,
        orIndex,
        value: debouncedValue === null ? "" : debouncedValue
      });
    }
  });
  useEffect(() => {
    void updateValue(debouncedValue);
  }, [debouncedValue]);
  const disabled = !reducedField?.value && typeof reducedField?.value !== "number" || reducedField?.field?.admin?.disableListFilter;
  const handleFieldChange = useCallback(async field => {
    setInternalValue(undefined);
    await updateCondition({
      andIndex,
      field: reducedFields.find(option => option.value === field.value),
      operator,
      orIndex,
      value: undefined
    });
  }, [andIndex, operator, orIndex, reducedFields, updateCondition]);
  const handleOperatorChange = useCallback(async operator => {
    await updateCondition({
      andIndex,
      field: reducedField,
      operator: operator.value,
      orIndex,
      value
    });
  }, [andIndex, reducedField, orIndex, updateCondition, value]);
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__wrap`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__inputs`,
        children: [/*#__PURE__*/_jsx("div", {
          className: `${baseClass}__field`,
          children: /*#__PURE__*/_jsx(ReactSelect, {
            disabled: disabled,
            isClearable: false,
            onChange: handleFieldChange,
            options: reducedFields.filter(field => !field.field.admin.disableListFilter),
            value: reducedField || {
              value: reducedField?.value
            }
          })
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__operator`,
          children: /*#__PURE__*/_jsx(ReactSelect, {
            disabled: disabled,
            isClearable: false,
            onChange: handleOperatorChange,
            options: reducedField?.operators,
            value: reducedField?.operators.find(o => operator === o.value) || null
          })
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__value`,
          children: RenderedFilter || /*#__PURE__*/_jsx(DefaultFilter, {
            booleanSelect: booleanSelect,
            disabled: !operator || !reducedField || reducedField?.field?.admin?.disableListFilter,
            filterOptions: filterOptions,
            internalField: reducedField,
            onChange: setInternalValue,
            operator: operator,
            options: valueOptions,
            value: internalValue ?? ""
          })
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__actions`,
        children: [/*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__actions-remove`,
          icon: "x",
          iconStyle: "with-border",
          onClick: () => removeCondition({
            andIndex,
            orIndex
          }),
          round: true
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__actions-add`,
          icon: "plus",
          iconStyle: "with-border",
          onClick: () => addCondition({
            andIndex: andIndex + 1,
            field: reducedFields.find(field => !field.field.admin?.disableListFilter),
            orIndex,
            relation: "and"
          }),
          round: true
        })]
      })]
    })
  });
};
//# sourceMappingURL=index.js.map