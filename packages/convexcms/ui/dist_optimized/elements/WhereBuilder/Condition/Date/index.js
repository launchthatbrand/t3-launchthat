'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { DatePickerField } from '../../../DatePicker/index.js';
const baseClass = 'condition-value-date';
export const DateFilter = ({
  disabled,
  field: {
    admin
  },
  onChange,
  value
}) => {
  const {
    date
  } = admin || {};
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsx(DatePickerField, {
      ...date,
      onChange: onChange,
      readOnly: disabled,
      value: value
    })
  });
};
//# sourceMappingURL=index.js.map