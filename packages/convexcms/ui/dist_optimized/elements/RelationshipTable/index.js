"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import { hoistQueryParamsToAnd, transformColumnsToPreferences } from "@convexcms/core/shared";
import { getTranslation } from "@convexcms/translations";
import { Button } from "../../elements/Button/index.js";
import { Pill } from "../../elements/Pill/index.js";
import { useEffectEvent } from "../../hooks/useEffectEvent.js";
import { ChevronIcon } from "../../icons/Chevron/index.js";
import { PlusIcon } from "../../icons/Plus/index.js";
import { useAuth } from "../../providers/Auth/index.js";
import { useConfig } from "../../providers/Config/index.js";
import { ListQueryProvider } from "../../providers/ListQuery/index.js";
import { useServerFunctions } from "../../providers/ServerFunctions/index.js";
import { TableColumnsProvider } from "../../providers/TableColumns/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { AnimateHeight } from "../AnimateHeight/index.js";
import { ColumnSelector } from "../ColumnSelector/index.js";
import { useDocumentDrawer } from "../DocumentDrawer/index.js";
import { Popup, PopupList } from "../Popup/index.js";
import { RelationshipProvider } from "../Table/RelationshipProvider/index.js";
import { DrawerLink } from "./cells/DrawerLink/index.js";
import { RelationshipTablePagination } from "./Pagination.js";
import "./index.scss";
const baseClass = "relationship-table";
export const RelationshipTable = props => {
  const {
    AfterInput,
    allowCreate = true,
    BeforeInput,
    disableTable = false,
    field,
    filterOptions,
    initialData: initialDataFromProps,
    initialDrawerData,
    Label,
    parent,
    relationTo
  } = props;
  const [Table, setTable] = useState(null);
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    permissions
  } = useAuth();
  const [initialData] = useState(() => {
    if (initialDataFromProps) {
      return {
        ...initialDataFromProps,
        docs: Array.isArray(initialDataFromProps.docs) ? initialDataFromProps.docs.reduce((acc, doc) => {
          if (typeof doc === "string") {
            return [...acc, {
              id: doc
            }];
          }
          return [...acc, doc];
        }, []) : []
      };
    }
  });
  const {
    i18n,
    t
  } = useTranslation();
  const [query, setQuery] = useState();
  const [openColumnSelector, setOpenColumnSelector] = useState(false);
  const [collectionConfig] = useState(() => getEntityConfig({
    collectionSlug: relationTo
  }));
  const [selectedCollection, setSelectedCollection] = useState(Array.isArray(relationTo) ? undefined : relationTo);
  const [isLoadingTable, setIsLoadingTable] = useState(!disableTable);
  const [data, setData] = useState(initialData);
  const [columnState, setColumnState] = useState();
  const {
    getTableState
  } = useServerFunctions();
  const renderTable = useCallback(async docs => {
    const newQuery = {
      limit: String(field?.defaultLimit || collectionConfig?.admin?.pagination?.defaultLimit),
      sort: field.defaultSort || collectionConfig?.defaultSort,
      ...(query || {}),
      where: {
        ...(query?.where || {})
      }
    };
    if (filterOptions) {
      newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOptions);
    }
    // map columns from string[] to ListPreferences['columns']
    const defaultColumns = field.admin.defaultColumns ? field.admin.defaultColumns.map(accessor => ({
      accessor,
      active: true
    })) : undefined;
    const {
      data: newData,
      state: newColumnState,
      Table: NewTable
    } = await getTableState({
      collectionSlug: relationTo,
      columns: transformColumnsToPreferences(query?.columns) || defaultColumns,
      docs,
      enableRowSelections: false,
      orderableFieldName: !field.orderable || Array.isArray(field.collection) ? undefined : `_${field.collection}_${field.name}_order`,
      parent,
      query: newQuery,
      renderRowTypes: true,
      tableAppearance: "condensed"
    });
    setData(newData);
    setTable(NewTable);
    setColumnState(newColumnState);
    setIsLoadingTable(false);
  }, [field.defaultLimit, field.defaultSort, field.admin.defaultColumns, field.collection, field.name, field.orderable, collectionConfig?.admin?.pagination?.defaultLimit, collectionConfig?.defaultSort, query, filterOptions, getTableState, relationTo, parent]);
  const handleTableRender = useEffectEvent((query, disableTable) => {
    if (!disableTable && (!Table || query)) {
      void renderTable();
    }
  });
  useEffect(() => {
    handleTableRender(query, disableTable);
  }, [query, disableTable]);
  const [DocumentDrawer, DocumentDrawerToggler, {
    closeDrawer,
    isDrawerOpen,
    openDrawer
  }] = useDocumentDrawer({
    collectionSlug: selectedCollection
  });
  const onDrawerSave = useCallback(args => {
    const foundDocIndex = data?.docs?.findIndex(doc => doc.id === args.doc.id);
    let withNewOrUpdatedDoc = undefined;
    if (foundDocIndex !== -1) {
      const newDocs = [...data.docs];
      newDocs[foundDocIndex] = args.doc;
      withNewOrUpdatedDoc = newDocs;
    } else {
      withNewOrUpdatedDoc = [args.doc, ...data.docs];
    }
    void renderTable(withNewOrUpdatedDoc);
  }, [data?.docs, renderTable]);
  const onDrawerCreate = useCallback(args => {
    closeDrawer();
    void onDrawerSave(args);
  }, [closeDrawer, onDrawerSave]);
  const onDrawerDelete = useCallback(args => {
    const newDocs = data.docs.filter(doc => doc.id !== args.id);
    void renderTable(newDocs);
  }, [data?.docs, renderTable]);
  const canCreate = allowCreate !== false && permissions?.collections?.[Array.isArray(relationTo) ? relationTo[0] : relationTo]?.create;
  useEffect(() => {
    if (Array.isArray(relationTo) && selectedCollection) {
      openDrawer();
    }
  }, [selectedCollection, openDrawer, relationTo]);
  useEffect(() => {
    if (Array.isArray(relationTo) && !isDrawerOpen && selectedCollection) {
      setSelectedCollection(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen]);
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__header`,
      children: [Label, /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__actions`,
        children: [!Array.isArray(relationTo) && canCreate && /*#__PURE__*/_jsx(DocumentDrawerToggler, {
          className: `${baseClass}__add-new`,
          children: i18n.t("fields:addNew")
        }), Array.isArray(relationTo) && /*#__PURE__*/_jsx(Fragment, {
          children: /*#__PURE__*/_jsx(Popup, {
            button: /*#__PURE__*/_jsxs(Button, {
              buttonStyle: "none",
              className: `${baseClass}__add-new-polymorphic`,
              children: [i18n.t("fields:addNew"), /*#__PURE__*/_jsx(PlusIcon, {})]
            }),
            buttonType: "custom",
            horizontalAlign: "center",
            render: ({
              close: closePopup
            }) => /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
              children: relationTo.map(relatedCollection => {
                if (permissions.collections[relatedCollection].create) {
                  return /*#__PURE__*/_jsx(PopupList.Button, {
                    className: `${baseClass}__relation-button--${relatedCollection}`,
                    onClick: () => {
                      closePopup();
                      setSelectedCollection(relatedCollection);
                    },
                    children: getTranslation(config.collections.find(each => each.slug === relatedCollection).labels.singular, i18n)
                  }, relatedCollection);
                }
                return null;
              })
            }),
            size: "medium"
          })
        }), /*#__PURE__*/_jsx(Pill, {
          "aria-controls": `${baseClass}-columns`,
          "aria-expanded": openColumnSelector,
          className: `${baseClass}__toggle-columns ${openColumnSelector ? `${baseClass}__buttons-active` : ""}`,
          icon: /*#__PURE__*/_jsx(ChevronIcon, {
            direction: openColumnSelector ? "up" : "down"
          }),
          onClick: () => setOpenColumnSelector(!openColumnSelector),
          pillStyle: "light",
          children: t("general:columns")
        })]
      })]
    }), BeforeInput, isLoadingTable ? /*#__PURE__*/_jsx("p", {
      children: t("general:loading")
    }) : /*#__PURE__*/_jsxs(Fragment, {
      children: [data?.docs && data.docs.length === 0 && /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__no-results`,
        children: [/*#__PURE__*/_jsx("p", {
          children: i18n.t("general:noResults", {
            label: Array.isArray(relationTo) ? i18n.t("general:documents") : getTranslation(collectionConfig?.labels?.plural, i18n)
          })
        }), canCreate && /*#__PURE__*/_jsx(Button, {
          onClick: openDrawer,
          children: i18n.t("general:createNewLabel", {
            label: getTranslation(collectionConfig?.labels?.singular, i18n)
          })
        })]
      }), data?.docs && data.docs.length > 0 && /*#__PURE__*/_jsx(RelationshipProvider, {
        children: /*#__PURE__*/_jsx(ListQueryProvider, {
          columns: transformColumnsToPreferences(columnState),
          data: data,
          defaultLimit: field.defaultLimit ?? collectionConfig?.admin?.pagination?.defaultLimit,
          modifySearchParams: false,
          onQueryChange: setQuery,
          orderableFieldName: !field.orderable || Array.isArray(field.collection) ? undefined : `_${field.collection}_${field.name}_order`,
          children: /*#__PURE__*/_jsxs(TableColumnsProvider, {
            collectionSlug: Array.isArray(relationTo) ? relationTo[0] : relationTo,
            columnState: columnState,
            LinkedCellOverride: /*#__PURE__*/_jsx(DrawerLink, {
              onDrawerDelete: onDrawerDelete,
              onDrawerSave: onDrawerSave
            }),
            children: [/*#__PURE__*/_jsx(AnimateHeight, {
              className: `${baseClass}__columns`,
              height: openColumnSelector ? "auto" : 0,
              id: `${baseClass}-columns`,
              children: /*#__PURE__*/_jsx("div", {
                className: `${baseClass}__columns-inner`,
                children: collectionConfig && /*#__PURE__*/_jsx(ColumnSelector, {
                  collectionSlug: collectionConfig.slug
                })
              })
            }), Table, /*#__PURE__*/_jsx(RelationshipTablePagination, {})]
          })
        })
      })]
    }), AfterInput, /*#__PURE__*/_jsx(DocumentDrawer, {
      initialData: initialDrawerData,
      onSave: onDrawerCreate
    })]
  });
};
//# sourceMappingURL=index.js.map