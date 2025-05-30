"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useEffect, useState } from "react";
// TODO: abstract the `next/navigation` dependency out from this component
import { usePathname, useRouter, useSearchParams } from "next/navigation.js";
import { sortableFieldTypes } from "@convexcms/core";
import { fieldAffectsData } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import * as qs from "qs-esm";
import { useTranslation } from "../../providers/Translation/index.js";
import { ReactSelect } from "../ReactSelect/index.js";
const baseClass = "sort-complex";
export const SortComplex = props => {
  const {
    collection,
    handleChange,
    modifySearchQuery = true
  } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    i18n,
    t
  } = useTranslation();
  const [sortOptions, setSortOptions] = useState();
  const [sortFields] = useState(() => collection.fields.reduce((fields, field) => {
    if (fieldAffectsData(field) && sortableFieldTypes.indexOf(field.type) > -1) {
      return [...fields, {
        label: getTranslation(field.label || field.name, i18n),
        value: field.name
      }];
    }
    return fields;
  }, []));
  const [sortField, setSortField] = useState(sortFields[0]);
  const [initialSort] = useState(() => ({
    label: t("general:descending"),
    value: "-"
  }));
  const [sortOrder, setSortOrder] = useState(initialSort);
  useEffect(() => {
    if (sortField?.value) {
      const newSortValue = `${sortOrder.value}${sortField.value}`;
      if (handleChange) {
        handleChange(newSortValue);
      }
      if (searchParams.get("sort") !== newSortValue && modifySearchQuery) {
        const search = qs.stringify({
          ...searchParams,
          sort: newSortValue
        }, {
          addQueryPrefix: true
        });
        router.replace(`${pathname}${search}`);
      }
    }
  }, [pathname, router, searchParams, sortField, sortOrder, modifySearchQuery, handleChange]);
  useEffect(() => {
    setSortOptions([{
      label: t("general:ascending"),
      value: ""
    }, {
      label: t("general:descending"),
      value: "-"
    }]);
  }, [i18n, t]);
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsx(React.Fragment, {
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__wrap`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__select`,
          children: [/*#__PURE__*/_jsx("div", {
            className: `${baseClass}__label`,
            children: t("general:columnToSort")
          }), /*#__PURE__*/_jsx(ReactSelect, {
            onChange: setSortField,
            options: sortFields,
            value: sortField
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__select`,
          children: [/*#__PURE__*/_jsx("div", {
            className: `${baseClass}__label`,
            children: t("general:order")
          }), /*#__PURE__*/_jsx(ReactSelect, {
            onChange: incomingSort => {
              setSortOrder(incomingSort || initialSort);
            },
            options: sortOptions,
            value: sortOrder
          })]
        })]
      })
    })
  });
};
//# sourceMappingURL=index.js.map