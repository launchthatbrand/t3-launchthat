"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useState } from "react";
import { hoistQueryParamsToAnd } from "@convexcms/core/shared";
import { useModal } from "@faceless-ui/modal";
import { useDocumentDrawer } from "../../elements/DocumentDrawer/index.js";
import { useEffectEvent } from "../../hooks/useEffectEvent.js";
import { useConfig } from "../../providers/Config/index.js";
import { useServerFunctions } from "../../providers/ServerFunctions/index.js";
import { ListDrawerContextProvider } from "../ListDrawer/Provider.js";
import { LoadingOverlay } from "../Loading/index.js";
export const ListDrawerContent = ({
  allowCreate = true,
  collectionSlugs,
  disableQueryPresets,
  drawerSlug,
  enableRowSelections,
  filterOptions,
  onBulkSelect,
  onSelect,
  overrideEntityVisibility = true,
  selectedCollection: selectedCollectionFromProps
}) => {
  const {
    closeModal,
    isModalOpen
  } = useModal();
  const {
    serverFunction
  } = useServerFunctions();
  const [ListView, setListView] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const {
    config: {
      collections
    },
    getEntityConfig
  } = useConfig();
  const isOpen = isModalOpen(drawerSlug);
  const enabledCollections = collections.filter(({
    slug
  }) => {
    return collectionSlugs.includes(slug);
  });
  const [selectedOption, setSelectedOption] = useState(() => {
    const initialSelection = selectedCollectionFromProps || enabledCollections[0]?.slug;
    const found = getEntityConfig({
      collectionSlug: initialSelection
    });
    return found ? {
      label: found.labels,
      value: found.slug
    } : undefined;
  });
  const [DocumentDrawer, DocumentDrawerToggler, {
    drawerSlug: documentDrawerSlug
  }] = useDocumentDrawer({
    collectionSlug: selectedOption.value
  });
  const updateSelectedOption = useEffectEvent(selectedCollectionFromProps => {
    if (selectedCollectionFromProps && selectedCollectionFromProps !== selectedOption?.value) {
      setSelectedOption({
        label: getEntityConfig({
          collectionSlug: selectedCollectionFromProps
        })?.labels,
        value: selectedCollectionFromProps
      });
    }
  });
  useEffect(() => {
    updateSelectedOption(selectedCollectionFromProps);
  }, [selectedCollectionFromProps]);
  const renderList = useCallback(async (slug, query) => {
    try {
      const newQuery = {
        ...(query || {}),
        where: {
          ...(query?.where || {})
        }
      };
      const filterOption = filterOptions?.[slug];
      if (filterOptions && typeof filterOption !== "boolean") {
        newQuery.where = hoistQueryParamsToAnd(newQuery.where, filterOption);
      }
      const {
        List: ViewResult
      } = await serverFunction({
        name: "render-list",
        args: {
          allowCreate,
          collectionSlug: slug,
          disableBulkDelete: true,
          disableBulkEdit: true,
          disableQueryPresets,
          drawerSlug,
          enableRowSelections,
          overrideEntityVisibility,
          query: newQuery
        }
      });
      setListView(ViewResult);
      setIsLoading(false);
    } catch (_err) {
      console.error("Error rendering List View: ", _err); // eslint-disable-line no-console
      if (isOpen) {
        closeModal(drawerSlug);
      }
    }
  }, [serverFunction, closeModal, allowCreate, drawerSlug, isOpen, enableRowSelections, filterOptions, overrideEntityVisibility, disableQueryPresets]);
  useEffect(() => {
    if (!ListView) {
      void renderList(selectedOption.value);
    }
  }, [renderList, ListView, selectedOption.value]);
  const onCreateNew = useCallback(({
    doc
  }) => {
    if (typeof onSelect === "function") {
      onSelect({
        collectionSlug: selectedOption.value,
        doc,
        docID: doc.id
      });
    }
    closeModal(documentDrawerSlug);
    closeModal(drawerSlug);
  }, [closeModal, documentDrawerSlug, drawerSlug, onSelect, selectedOption.value]);
  const onQueryChange = useCallback(query => {
    void renderList(selectedOption.value, query);
  }, [renderList, selectedOption.value]);
  const setMySelectedOption = useCallback(incomingSelection => {
    setSelectedOption(incomingSelection);
    void renderList(incomingSelection.value);
  }, [renderList]);
  if (isLoading) {
    return /*#__PURE__*/_jsx(LoadingOverlay, {});
  }
  return /*#__PURE__*/_jsxs(ListDrawerContextProvider, {
    allowCreate: allowCreate,
    createNewDrawerSlug: documentDrawerSlug,
    DocumentDrawerToggler: DocumentDrawerToggler,
    drawerSlug: drawerSlug,
    enabledCollections: collectionSlugs,
    onBulkSelect: onBulkSelect,
    onQueryChange: onQueryChange,
    onSelect: onSelect,
    selectedOption: selectedOption,
    setSelectedOption: setMySelectedOption,
    children: [ListView, /*#__PURE__*/_jsx(DocumentDrawer, {
      onSave: onCreateNew
    })]
  });
};
//# sourceMappingURL=DrawerContent.js.map