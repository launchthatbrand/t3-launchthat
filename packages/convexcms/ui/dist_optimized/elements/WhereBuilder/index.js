"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { useMemo } from "react";
import { transformWhereQuery, validateWhereQuery } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { useListQuery } from "../../providers/ListQuery/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { Button } from "../Button/index.js";
import { Condition } from "./Condition/index.js";
import fieldTypes from "./field-types.js";
import { reduceFields } from "./reduceFields.js";
const baseClass = "where-builder";
/**
 * The WhereBuilder component is used to render the filter controls for a collection's list view.
 * It is part of the {@link ListControls} component which is used to render the controls (search, filter, where).
 */
export const WhereBuilder = props => {
  const {
    collectionPluralLabel,
    fields,
    renderedFilters,
    resolvedFilterOptions
  } = props;
  const {
    i18n,
    t
  } = useTranslation();
  const reducedFields = useMemo(() => reduceFields({
    fields,
    i18n
  }), [fields, i18n]);
  const {
    handleWhereChange,
    query
  } = useListQuery();
  const conditions = useMemo(() => {
    const whereFromSearch = query.where;
    if (whereFromSearch) {
      if (validateWhereQuery(whereFromSearch)) {
        return whereFromSearch.or;
      }
      // Transform the where query to be in the right format. This will transform something simple like [text][equals]=example%20post to the right format
      const transformedWhere = transformWhereQuery(whereFromSearch);
      if (validateWhereQuery(transformedWhere)) {
        return transformedWhere.or;
      }
      console.warn(`Invalid where query in URL: ${JSON.stringify(whereFromSearch)}`); // eslint-disable-line no-console
    }
    return [];
  }, [query.where]);
  const addCondition = React.useCallback(async ({
    andIndex,
    field,
    orIndex,
    relation
  }) => {
    const newConditions = [...conditions];
    const defaultOperator = fieldTypes[field.field.type].operators[0].value;
    if (relation === "and") {
      newConditions[orIndex].and.splice(andIndex, 0, {
        [field.value]: {
          [defaultOperator]: undefined
        }
      });
    } else {
      newConditions.push({
        and: [{
          [field.value]: {
            [defaultOperator]: undefined
          }
        }]
      });
    }
    await handleWhereChange({
      or: newConditions
    });
  }, [conditions, handleWhereChange]);
  const updateCondition = React.useCallback(async ({
    andIndex,
    field,
    operator: incomingOperator,
    orIndex,
    value: valueArg
  }) => {
    const existingCondition = conditions[orIndex].and[andIndex];
    const defaults = fieldTypes[field.field.type];
    const operator = incomingOperator || defaults.operators[0].value;
    if (typeof existingCondition === "object" && field.value) {
      const value = valueArg ?? existingCondition?.[operator];
      const valueChanged = value !== existingCondition?.[field.value]?.[operator];
      const operatorChanged = operator !== Object.keys(existingCondition?.[field.value] || {})?.[0];
      if (valueChanged || operatorChanged) {
        const newRowCondition = {
          [field.value]: {
            [operator]: value
          }
        };
        const newConditions = [...conditions];
        newConditions[orIndex].and[andIndex] = newRowCondition;
        await handleWhereChange({
          or: newConditions
        });
      }
    }
  }, [conditions, handleWhereChange]);
  const removeCondition = React.useCallback(async ({
    andIndex,
    orIndex
  }) => {
    const newConditions = [...conditions];
    newConditions[orIndex].and.splice(andIndex, 1);
    if (newConditions[orIndex].and.length === 0) {
      newConditions.splice(orIndex, 1);
    }
    await handleWhereChange({
      or: newConditions
    });
  }, [conditions, handleWhereChange]);
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [conditions.length > 0 && /*#__PURE__*/_jsxs(React.Fragment, {
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__label`,
        children: t("general:filterWhere", {
          label: getTranslation(collectionPluralLabel, i18n)
        })
      }), /*#__PURE__*/_jsx("ul", {
        className: `${baseClass}__or-filters`,
        children: conditions.map((or, orIndex) => {
          const compoundOrKey = `${orIndex}_${Array.isArray(or?.and) ? or.and.length : ""}`;
          return /*#__PURE__*/_jsxs("li", {
            children: [orIndex !== 0 && /*#__PURE__*/_jsx("div", {
              className: `${baseClass}__label`,
              children: t("general:or")
            }), /*#__PURE__*/_jsx("ul", {
              className: `${baseClass}__and-filters`,
              children: Array.isArray(or?.and) && or.and.map((_, andIndex) => {
                const condition = conditions[orIndex].and[andIndex];
                const fieldName = Object.keys(condition)[0];
                const operator = Object.keys(condition?.[fieldName] || {})?.[0] || undefined;
                const value = condition?.[fieldName]?.[operator] || undefined;
                return /*#__PURE__*/_jsxs("li", {
                  children: [andIndex !== 0 && /*#__PURE__*/_jsx("div", {
                    className: `${baseClass}__label`,
                    children: t("general:and")
                  }), /*#__PURE__*/_jsx(Condition, {
                    addCondition: addCondition,
                    andIndex: andIndex,
                    fieldName: fieldName,
                    filterOptions: resolvedFilterOptions?.get(fieldName),
                    operator: operator,
                    orIndex: orIndex,
                    reducedFields: reducedFields,
                    removeCondition: removeCondition,
                    RenderedFilter: renderedFilters?.get(fieldName),
                    updateCondition: updateCondition,
                    value: value
                  })]
                }, andIndex);
              })
            })]
          }, compoundOrKey);
        })
      }), /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__add-or`,
        icon: "plus",
        iconPosition: "left",
        iconStyle: "with-border",
        onClick: async () => {
          await addCondition({
            andIndex: 0,
            field: reducedFields[0],
            orIndex: conditions.length,
            relation: "or"
          });
        },
        children: t("general:or")
      })]
    }), conditions.length === 0 && /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__no-filters`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__label`,
        children: t("general:noFiltersSet")
      }), /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__add-first-filter`,
        icon: "plus",
        iconPosition: "left",
        iconStyle: "with-border",
        onClick: async () => {
          if (reducedFields.length > 0) {
            await addCondition({
              andIndex: 0,
              field: reducedFields.find(field => !field.field.admin?.disableListFilter),
              orIndex: conditions.length,
              relation: "or"
            });
          }
        },
        children: t("general:addFilter")
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map