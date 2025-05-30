"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { validateWhereQuery } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { useWindowInfo } from "@faceless-ui/window-info";
import { Popup, PopupList } from "../../elements/Popup/index.js";
import { useUseTitleField } from "../../hooks/useUseAsTitle.js";
import { ChevronIcon } from "../../icons/Chevron/index.js";
import { Dots } from "../../icons/Dots/index.js";
import { SearchIcon } from "../../icons/Search/index.js";
import { useListQuery } from "../../providers/ListQuery/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { AnimateHeight } from "../AnimateHeight/index.js";
import { ColumnSelector } from "../ColumnSelector/index.js";
import { Pill } from "../Pill/index.js";
import { SearchFilter } from "../SearchFilter/index.js";
import { WhereBuilder } from "../WhereBuilder/index.js";
import { ActiveQueryPreset } from "./ActiveQueryPreset/index.js";
import { getTextFieldsToBeSearched } from "./getTextFieldsToBeSearched.js";
import { useQueryPresets } from "./useQueryPresets.js";
const baseClass = "list-controls";
/**
 * The ListControls component is used to render the controls (search, filter, where)
 * for a collection's list view. You can find those directly above the table which lists
 * the collection's documents.
 */
export const ListControls = props => {
  const {
    beforeActions,
    collectionConfig,
    collectionSlug,
    disableQueryPresets,
    enableColumns = true,
    enableSort = false,
    listMenuItems: listMenuItemsFromProps,
    queryPreset: activePreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions
  } = props;
  const {
    handleSearchChange,
    query
  } = useListQuery();
  const {
    CreateNewPresetDrawer,
    DeletePresetModal,
    EditPresetDrawer,
    hasModifiedPreset,
    openPresetListDrawer,
    PresetListDrawer,
    queryPresetMenuItems,
    resetPreset
  } = useQueryPresets({
    activePreset,
    collectionSlug,
    queryPresetPermissions
  });
  const titleField = useUseTitleField(collectionConfig);
  const {
    i18n,
    t
  } = useTranslation();
  const {
    breakpoints: {
      s: smallBreak
    }
  } = useWindowInfo();
  const searchLabel = (titleField && getTranslation("label" in titleField && (typeof titleField.label === "string" || typeof titleField.label === "object") ? titleField.label : "name" in titleField ? titleField.name : null, i18n)) ?? "ID";
  const listSearchableFields = getTextFieldsToBeSearched(collectionConfig.admin.listSearchableFields, collectionConfig.fields);
  const searchLabelTranslated = useRef(t("general:searchBy", {
    label: getTranslation(searchLabel, i18n)
  }));
  const hasWhereParam = useRef(Boolean(query?.where));
  const shouldInitializeWhereOpened = validateWhereQuery(query?.where);
  const [visibleDrawer, setVisibleDrawer] = useState(shouldInitializeWhereOpened ? "where" : undefined);
  useEffect(() => {
    if (hasWhereParam.current && !query?.where) {
      hasWhereParam.current = false;
    } else if (query?.where) {
      hasWhereParam.current = true;
    }
  }, [setVisibleDrawer, query?.where]);
  useEffect(() => {
    if (listSearchableFields?.length > 0) {
      searchLabelTranslated.current = listSearchableFields.reduce((placeholderText, field, i) => {
        const label = "label" in field && field.label ? field.label : "name" in field ? field.name : null;
        if (i === 0) {
          return `${t("general:searchBy", {
            label: getTranslation(label, i18n)
          })}`;
        }
        if (i === listSearchableFields.length - 1) {
          return `${placeholderText} ${t("general:or")} ${getTranslation(label, i18n)}`;
        }
        return `${placeholderText}, ${getTranslation(label, i18n)}`;
      }, "");
    } else {
      searchLabelTranslated.current = t("general:searchBy", {
        label: getTranslation(searchLabel, i18n)
      });
    }
  }, [t, listSearchableFields, i18n, searchLabel]);
  let listMenuItems = listMenuItemsFromProps;
  if (collectionConfig?.enableQueryPresets && !disableQueryPresets && queryPresetMenuItems?.length > 0) {
    // Cannot push or unshift into `listMenuItemsFromProps` as it will mutate the original array
    listMenuItems = [...queryPresetMenuItems, listMenuItemsFromProps?.length > 0 ? /*#__PURE__*/_jsx(PopupList.Divider, {}, "divider") : null, ...(listMenuItemsFromProps || [])];
  }
  return /*#__PURE__*/_jsxs(Fragment, {
    children: [/*#__PURE__*/_jsxs("div", {
      className: baseClass,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__wrap`,
        children: [/*#__PURE__*/_jsx(SearchIcon, {}), /*#__PURE__*/_jsx(SearchFilter, {
          fieldName: titleField && "name" in titleField ? titleField?.name : null,
          handleChange: search => {
            return void handleSearchChange(search);
          },
          // @ts-expect-error @todo: fix types
          initialParams: query,
          label: searchLabelTranslated.current
        }, collectionSlug), activePreset && hasModifiedPreset ? /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__modified`,
          children: "Modified"
        }) : null, /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__buttons`,
          children: /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__buttons-wrap`,
            children: [!smallBreak && /*#__PURE__*/_jsx(React.Fragment, {
              children: beforeActions && beforeActions
            }), enableColumns && /*#__PURE__*/_jsx(Pill, {
              "aria-controls": `${baseClass}-columns`,
              "aria-expanded": visibleDrawer === "columns",
              className: `${baseClass}__toggle-columns`,
              icon: /*#__PURE__*/_jsx(ChevronIcon, {
                direction: visibleDrawer === "columns" ? "up" : "down"
              }),
              onClick: () => setVisibleDrawer(visibleDrawer !== "columns" ? "columns" : undefined),
              pillStyle: "light",
              children: t("general:columns")
            }), /*#__PURE__*/_jsx(Pill, {
              "aria-controls": `${baseClass}-where`,
              "aria-expanded": visibleDrawer === "where",
              className: `${baseClass}__toggle-where`,
              icon: /*#__PURE__*/_jsx(ChevronIcon, {
                direction: visibleDrawer === "where" ? "up" : "down"
              }),
              onClick: () => setVisibleDrawer(visibleDrawer !== "where" ? "where" : undefined),
              pillStyle: "light",
              children: t("general:filters")
            }), enableSort && /*#__PURE__*/_jsx(Pill, {
              "aria-controls": `${baseClass}-sort`,
              "aria-expanded": visibleDrawer === "sort",
              className: `${baseClass}__toggle-sort`,
              icon: /*#__PURE__*/_jsx(ChevronIcon, {}),
              onClick: () => setVisibleDrawer(visibleDrawer !== "sort" ? "sort" : undefined),
              pillStyle: "light",
              children: t("general:sort")
            }), !disableQueryPresets && /*#__PURE__*/_jsx(ActiveQueryPreset, {
              activePreset: activePreset,
              openPresetListDrawer: openPresetListDrawer,
              resetPreset: resetPreset
            }), listMenuItems && Array.isArray(listMenuItems) && listMenuItems.length > 0 && /*#__PURE__*/_jsx(Popup, {
              button: /*#__PURE__*/_jsx(Dots, {
                ariaLabel: t("general:moreOptions")
              }),
              className: `${baseClass}__popup`,
              horizontalAlign: "right",
              id: "list-menu",
              size: "large",
              verticalAlign: "bottom",
              children: /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
                children: listMenuItems.map((item, i) => /*#__PURE__*/_jsx(Fragment, {
                  children: item
                }, `list-menu-item-${i}`))
              })
            })]
          })
        })]
      }), enableColumns && /*#__PURE__*/_jsx(AnimateHeight, {
        className: `${baseClass}__columns`,
        height: visibleDrawer === "columns" ? "auto" : 0,
        id: `${baseClass}-columns`,
        children: /*#__PURE__*/_jsx(ColumnSelector, {
          collectionSlug: collectionConfig.slug
        })
      }), /*#__PURE__*/_jsx(AnimateHeight, {
        className: `${baseClass}__where`,
        height: visibleDrawer === "where" ? "auto" : 0,
        id: `${baseClass}-where`,
        children: /*#__PURE__*/_jsx(WhereBuilder, {
          collectionPluralLabel: collectionConfig?.labels?.plural,
          collectionSlug: collectionConfig.slug,
          fields: collectionConfig?.fields,
          renderedFilters: renderedFilters,
          resolvedFilterOptions: resolvedFilterOptions
        })
      })]
    }), PresetListDrawer, EditPresetDrawer, CreateNewPresetDrawer, DeletePresetModal]
  });
};
//# sourceMappingURL=index.js.map