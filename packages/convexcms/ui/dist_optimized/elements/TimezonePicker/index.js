"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import { useMemo } from "react";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { ReactSelect } from "../ReactSelect/index.js";
import { formatOptions } from "../WhereBuilder/Condition/Select/formatOptions.js";
export const TimezonePicker = props => {
  const {
    id,
    onChange: onChangeFromProps,
    options: optionsFromProps,
    required,
    selectedTimezone: selectedTimezoneFromProps
  } = props;
  const {
    t
  } = useTranslation();
  const options = formatOptions(optionsFromProps);
  const selectedTimezone = useMemo(() => {
    return options.find(t => {
      const value = typeof t === "string" ? t : t.value;
      return value === (selectedTimezoneFromProps || "UTC");
    });
  }, [options, selectedTimezoneFromProps]);
  return /*#__PURE__*/_jsxs("div", {
    className: "timezone-picker-wrapper",
    children: [/*#__PURE__*/_jsx(FieldLabel, {
      htmlFor: id,
      label: `${t("general:timezone")} ${required ? "*" : ""}`,
      required: required,
      unstyled: true
    }), /*#__PURE__*/_jsx(ReactSelect, {
      className: "timezone-picker",
      inputId: id,
      isClearable: true,
      isCreatable: false,
      onChange: val => {
        if (onChangeFromProps) {
          onChangeFromProps(val?.value || "");
        }
      },
      options: options,
      value: selectedTimezone
    })]
  });
};
//# sourceMappingURL=index.js.map