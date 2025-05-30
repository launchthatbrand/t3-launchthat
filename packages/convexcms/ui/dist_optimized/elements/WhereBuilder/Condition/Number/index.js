'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from '../../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'condition-value-number';
export const NumberFilter = t0 => {
  const $ = _c(7);
  const {
    disabled,
    onChange,
    value
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== onChange) {
    t1 = e => onChange(e.target.value);
    $[0] = onChange;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== disabled || $[3] !== t || $[4] !== t1 || $[5] !== value) {
    t2 = _jsx("input", {
      className: baseClass,
      disabled,
      onChange: t1,
      placeholder: t("general:enterAValue"),
      type: "number",
      value
    });
    $[2] = disabled;
    $[3] = t;
    $[4] = t1;
    $[5] = value;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
};
//# sourceMappingURL=index.js.map