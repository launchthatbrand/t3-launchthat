'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Banner } from '../../elements/Banner/index.js';
import { CheckboxField } from '../../fields/Checkbox/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
export const NullifyLocaleField = t0 => {
  const $ = _c(4);
  const {
    fieldValue,
    localized,
    path
  } = t0;
  const {
    code: currentLocale
  } = useLocale();
  const {
    config: t1
  } = useConfig();
  const {
    localization
  } = t1;
  const [checked, setChecked] = React.useState(typeof fieldValue !== "number");
  const {
    t
  } = useTranslation();
  if (!localized || !localization) {
    return null;
  }
  if (localization.defaultLocale === currentLocale || !localization.fallback) {
    return null;
  }
  if (fieldValue) {
    let hideCheckbox = false;
    if (typeof fieldValue === "number" && fieldValue > 0) {
      hideCheckbox = true;
    }
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      hideCheckbox = true;
    }
    if (hideCheckbox) {
      if (checked) {
        setChecked(false);
      }
      return null;
    }
  }
  let t2;
  if ($[0] !== checked || $[1] !== path || $[2] !== t) {
    t2 = _jsx(Banner, {
      children: _jsx(CheckboxField, {
        checked,
        field: {
          name: "",
          label: t("general:fallbackToDefaultLocale")
        },
        id: `field-${path.replace(/\./g, "__")}`,
        path,
        schemaPath: ""
      })
    });
    $[0] = checked;
    $[1] = path;
    $[2] = t;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
};
//# sourceMappingURL=index.js.map