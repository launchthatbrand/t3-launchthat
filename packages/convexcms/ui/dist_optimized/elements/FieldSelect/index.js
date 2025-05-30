"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useState } from "react";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { useForm } from "../../forms/Form/context.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { filterOutUploadFields } from "../../utilities/filterOutUploadFields.js";
import { ReactSelect } from "../ReactSelect/index.js";
import { reduceFieldOptions } from "./reduceFieldOptions.js";
const baseClass = "field-select";
export const FieldSelect = ({
  fields,
  onChange,
  permissions
}) => {
  const {
    t
  } = useTranslation();
  const {
    dispatchFields,
    getFields
  } = useForm();
  const [options] = useState(() => reduceFieldOptions({
    fields: filterOutUploadFields(fields),
    formState: getFields(),
    permissions
  }));
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx(FieldLabel, {
      label: t("fields:selectFieldsToEdit")
    }), /*#__PURE__*/_jsx(ReactSelect, {
      getOptionValue: option => {
        if (typeof option.value === "object" && "path" in option.value) {
          return String(option.value.path);
        }
        return String(option.value);
      },
      isMulti: true,
      onChange: selected => onChange({
        dispatchFields,
        formState: getFields(),
        selected
      }),
      options: options
    })]
  });
};
//# sourceMappingURL=index.js.map