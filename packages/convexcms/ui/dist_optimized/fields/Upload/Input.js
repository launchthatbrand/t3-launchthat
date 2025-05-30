"use client";

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import "./index.scss";
import React, { useCallback, useEffect, useMemo } from "react";
import { useModal } from "@faceless-ui/modal";
import * as qs from "qs-esm";
import { useBulkUpload } from "../../elements/BulkUpload/index.js";
import { Button } from "../../elements/Button/index.js";
import { useDocumentDrawer } from "../../elements/DocumentDrawer/index.js";
import { Dropzone } from "../../elements/Dropzone/index.js";
import { useListDrawer } from "../../elements/ListDrawer/index.js";
import { RenderCustomComponent } from "../../elements/RenderCustomComponent/index.js";
import { ShimmerEffect } from "../../elements/ShimmerEffect/index.js";
import { FieldDescription } from "../../fields/FieldDescription/index.js";
import { FieldError } from "../../fields/FieldError/index.js";
import { FieldLabel } from "../../fields/FieldLabel/index.js";
import { useAuth } from "../../providers/Auth/index.js";
import { useLocale } from "../../providers/Locale/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { fieldBaseClass } from "../shared/index.js";
import { UploadComponentHasMany } from "./HasMany/index.js";
import { UploadComponentHasOne } from "./HasOne/index.js";
export const baseClass = "upload";
export function UploadInput(props) {
  const {
    AfterInput,
    allowCreate,
    api,
    BeforeInput,
    className,
    Description,
    description,
    displayPreview,
    Error,
    filterOptions: filterOptionsFromProps,
    hasMany,
    isSortable,
    Label,
    label,
    localized,
    maxRows,
    onChange: onChangeFromProps,
    path,
    readOnly,
    relationTo,
    required,
    serverURL,
    showError,
    style,
    value
  } = props;
  const [populatedDocs, setPopulatedDocs] = React.useState();
  const [activeRelationTo, setActiveRelationTo] = React.useState(Array.isArray(relationTo) ? relationTo[0] : relationTo);
  const {
    openModal
  } = useModal();
  const {
    drawerSlug,
    setCollectionSlug,
    setCurrentActivePath,
    setInitialFiles,
    setMaxFiles,
    setOnSuccess
  } = useBulkUpload();
  const {
    permissions
  } = useAuth();
  const {
    code
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const filterOptions = useMemo(() => {
    return {
      ...filterOptionsFromProps,
      [activeRelationTo]: {
        ...(filterOptionsFromProps?.[activeRelationTo] || {}),
        id: {
          ...(filterOptionsFromProps?.[activeRelationTo]?.id || {}),
          not_in: (filterOptionsFromProps?.[activeRelationTo]?.id?.not_in || []).concat(...(Array.isArray(value) || value ? [value] : []))
        }
      }
    };
  }, [value, activeRelationTo, filterOptionsFromProps]);
  const [ListDrawer,, {
    closeDrawer: closeListDrawer,
    openDrawer: openListDrawer
  }] = useListDrawer({
    collectionSlugs: typeof relationTo === "string" ? [relationTo] : relationTo,
    filterOptions
  });
  const [CreateDocDrawer,, {
    closeDrawer: closeCreateDocDrawer,
    openDrawer: openCreateDocDrawer
  }] = useDocumentDrawer({
    collectionSlug: activeRelationTo
  });
  /**
  * Prevent initial retrieval of documents from running more than once
  */
  const loadedValueDocsRef = React.useRef(false);
  const canCreate = useMemo(() => {
    if (!allowCreate) {
      return false;
    }
    if (typeof activeRelationTo === "string") {
      if (permissions?.collections && permissions.collections?.[activeRelationTo]?.create) {
        return true;
      }
    }
    return false;
  }, [activeRelationTo, permissions, allowCreate]);
  const onChange = React.useCallback(newValue => {
    if (typeof onChangeFromProps === "function") {
      onChangeFromProps(newValue);
    }
  }, [onChangeFromProps]);
  const populateDocs = React.useCallback(async (ids, relatedCollectionSlug) => {
    if (!ids.length) {
      return;
    }
    const query = {
      depth: 0,
      draft: true,
      limit: ids.length,
      locale: code,
      where: {
        and: [{
          id: {
            in: ids
          }
        }]
      }
    };
    const response = await fetch(`${serverURL}${api}/${relatedCollectionSlug}`, {
      body: qs.stringify(query),
      credentials: "include",
      headers: {
        "Accept-Language": i18n.language,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-HTTP-Method-Override": "GET"
      },
      method: "POST"
    });
    if (response.ok) {
      const json = await response.json();
      let sortedDocs = ids.map(id => json.docs.find(doc => {
        return String(doc.id) === String(id);
      }));
      if (sortedDocs.includes(undefined) && hasMany) {
        sortedDocs = sortedDocs.map((doc, index) => doc ? doc : {
          id: ids[index],
          filename: `${t("general:untitled")} - ID: ${ids[index]}`,
          isPlaceholder: true
        });
      }
      return {
        ...json,
        docs: sortedDocs
      };
    }
    return null;
  }, [code, serverURL, api, i18n.language, t, hasMany]);
  const onUploadSuccess = useCallback(newDocs => {
    if (hasMany) {
      const mergedValue = [...(Array.isArray(value) ? value : []), ...newDocs.map(doc => doc.id)];
      onChange(mergedValue);
      setPopulatedDocs(currentDocs => [...(currentDocs || []), ...newDocs.map(doc => ({
        relationTo: activeRelationTo,
        value: doc
      }))]);
    } else {
      const firstDoc = newDocs[0];
      onChange(firstDoc.id);
      setPopulatedDocs([{
        relationTo: activeRelationTo,
        value: firstDoc
      }]);
    }
  }, [value, onChange, activeRelationTo, hasMany]);
  const onLocalFileSelection = React.useCallback(fileList => {
    let fileListToUse = fileList;
    if (!hasMany && fileList && fileList.length > 1) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(fileList[0]);
      fileListToUse = dataTransfer.files;
    }
    if (fileListToUse) {
      setInitialFiles(fileListToUse);
    }
    setCollectionSlug(relationTo);
    if (typeof maxRows === "number") {
      setMaxFiles(maxRows);
    }
    setCurrentActivePath(path);
    openModal(drawerSlug);
  }, [drawerSlug, hasMany, openModal, relationTo, setCollectionSlug, setInitialFiles, maxRows, setMaxFiles, path, setCurrentActivePath]);
  // only hasMany can bulk select
  const onListBulkSelect = React.useCallback(async docs => {
    const selectedDocIDs = [];
    for (const [id, isSelected] of docs) {
      if (isSelected) {
        selectedDocIDs.push(id);
      }
    }
    const loadedDocs = await populateDocs(selectedDocIDs, activeRelationTo);
    if (loadedDocs) {
      setPopulatedDocs(currentDocs => [...(currentDocs || []), ...loadedDocs.docs.map(doc => ({
        relationTo: activeRelationTo,
        value: doc
      }))]);
    }
    onChange([...(Array.isArray(value) ? value : []), ...selectedDocIDs]);
    closeListDrawer();
  }, [activeRelationTo, closeListDrawer, onChange, populateDocs, value]);
  const onDocCreate = React.useCallback(data => {
    if (data.doc) {
      setPopulatedDocs(currentDocs => [...(currentDocs || []), {
        relationTo: activeRelationTo,
        value: data.doc
      }]);
      onChange(data.doc.id);
    }
    closeCreateDocDrawer();
  }, [closeCreateDocDrawer, activeRelationTo, onChange]);
  const onListSelect = useCallback(async ({
    collectionSlug,
    doc
  }) => {
    const loadedDocs = await populateDocs([doc.id], collectionSlug);
    const selectedDoc = loadedDocs ? loadedDocs.docs?.[0] : null;
    setPopulatedDocs(currentDocs => {
      if (selectedDoc) {
        if (hasMany) {
          return [...(currentDocs || []), {
            relationTo: activeRelationTo,
            value: selectedDoc
          }];
        }
        return [{
          relationTo: activeRelationTo,
          value: selectedDoc
        }];
      }
      return currentDocs;
    });
    if (hasMany) {
      onChange([...(Array.isArray(value) ? value : []), doc.id]);
    } else {
      onChange(doc.id);
    }
    closeListDrawer();
  }, [closeListDrawer, hasMany, populateDocs, onChange, value, activeRelationTo]);
  const reloadDoc = React.useCallback(async (docID, collectionSlug) => {
    const {
      docs
    } = await populateDocs([docID], collectionSlug);
    if (docs[0]) {
      let updatedDocsToPropogate = [];
      setPopulatedDocs(currentDocs => {
        const existingDocIndex = currentDocs?.findIndex(doc => {
          const hasExisting = doc.value?.id === docs[0].id || doc.value?.isPlaceholder;
          return hasExisting && doc.relationTo === collectionSlug;
        });
        if (existingDocIndex > -1) {
          const updatedDocs = [...currentDocs];
          updatedDocs[existingDocIndex] = {
            relationTo: collectionSlug,
            value: docs[0]
          };
          updatedDocsToPropogate = updatedDocs;
          return updatedDocs;
        }
      });
      if (updatedDocsToPropogate.length && hasMany) {
        onChange(updatedDocsToPropogate.map(doc => doc.value?.id));
      }
    }
  }, [populateDocs, onChange, hasMany]);
  // only hasMany can reorder
  const onReorder = React.useCallback(newValue => {
    const newValueIDs = newValue.map(({
      value
    }) => value.id);
    onChange(newValueIDs);
    setPopulatedDocs(newValue);
  }, [onChange]);
  const onRemove = React.useCallback(newValue => {
    const newValueIDs = newValue ? newValue.map(({
      value
    }) => value.id) : null;
    onChange(hasMany ? newValueIDs : newValueIDs ? newValueIDs[0] : null);
    setPopulatedDocs(newValue ? newValue : []);
  }, [onChange, hasMany]);
  useEffect(() => {
    async function loadInitialDocs() {
      if (value) {
        loadedValueDocsRef.current = true;
        const loadedDocs = await populateDocs(Array.isArray(value) ? value : [value], activeRelationTo);
        if (loadedDocs) {
          setPopulatedDocs(loadedDocs.docs.map(doc => ({
            relationTo: activeRelationTo,
            value: doc
          })));
        }
      }
    }
    if (!loadedValueDocsRef.current) {
      void loadInitialDocs();
    }
  }, [populateDocs, activeRelationTo, value]);
  useEffect(() => {
    setOnSuccess(path, onUploadSuccess);
  }, [value, path, onUploadSuccess, setOnSuccess]);
  const showDropzone = !value || hasMany && Array.isArray(value) && (typeof maxRows !== "number" || value.length < maxRows) || !hasMany && populatedDocs?.[0] && typeof populatedDocs[0].value === "undefined";
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, showError && "error", readOnly && "read-only"].filter(Boolean).join(" "),
    id: `field-${path?.replace(/\./g, "__")}`,
    style: style,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__wrap`,
      children: /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          path: path,
          showError: showError
        })
      })
    }), BeforeInput, /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__dropzoneAndUpload`,
      children: [hasMany && Array.isArray(value) && value.length > 0 ? /*#__PURE__*/_jsx(_Fragment, {
        children: populatedDocs && populatedDocs?.length > 0 ? /*#__PURE__*/_jsx(UploadComponentHasMany, {
          displayPreview: displayPreview,
          fileDocs: populatedDocs,
          isSortable: isSortable && !readOnly,
          onRemove: onRemove,
          onReorder: onReorder,
          readonly: readOnly,
          reloadDoc: reloadDoc,
          serverURL: serverURL
        }) : /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__loadingRows`,
          children: value.map(id => /*#__PURE__*/_jsx(ShimmerEffect, {
            height: "40px"
          }, id))
        })
      }) : null, !hasMany && value ? /*#__PURE__*/_jsx(_Fragment, {
        children: populatedDocs && populatedDocs?.length > 0 && populatedDocs[0].value ? /*#__PURE__*/_jsx(UploadComponentHasOne, {
          displayPreview: displayPreview,
          fileDoc: populatedDocs[0],
          onRemove: onRemove,
          readonly: readOnly,
          reloadDoc: reloadDoc,
          serverURL: serverURL
        }) : populatedDocs && value && !populatedDocs?.[0]?.value ? /*#__PURE__*/_jsxs(_Fragment, {
          children: [t("general:untitled"), " - ID: ", value]
        }) : /*#__PURE__*/_jsx(ShimmerEffect, {
          height: "62px"
        })
      }) : null, showDropzone ? /*#__PURE__*/_jsx(Dropzone, {
        disabled: readOnly || !canCreate,
        multipleFiles: hasMany,
        onChange: onLocalFileSelection,
        children: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__dropzoneContent`,
          children: [/*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__dropzoneContent__buttons`,
            children: [canCreate && /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsx(Button, {
                buttonStyle: "pill",
                className: `${baseClass}__createNewToggler`,
                disabled: readOnly || !canCreate,
                onClick: () => {
                  if (!readOnly) {
                    if (hasMany) {
                      onLocalFileSelection();
                    } else {
                      openCreateDocDrawer();
                    }
                  }
                },
                size: "small",
                children: t("general:createNew")
              }), /*#__PURE__*/_jsx("span", {
                className: `${baseClass}__dropzoneContent__orText`,
                children: t("general:or")
              })]
            }), /*#__PURE__*/_jsx(Button, {
              buttonStyle: "pill",
              className: `${baseClass}__listToggler`,
              disabled: readOnly,
              onClick: openListDrawer,
              size: "small",
              children: t("fields:chooseFromExisting")
            }), /*#__PURE__*/_jsx(CreateDocDrawer, {
              onSave: onDocCreate
            }), /*#__PURE__*/_jsx(ListDrawer, {
              allowCreate: canCreate,
              enableRowSelections: hasMany,
              onBulkSelect: onListBulkSelect,
              onSelect: onListSelect
            })]
          }), canCreate && !readOnly && /*#__PURE__*/_jsxs("p", {
            className: `${baseClass}__dragAndDropText`,
            children: [t("general:or"), " ", t("upload:dragAndDrop")]
          })]
        })
      }) : /*#__PURE__*/_jsx(_Fragment, {
        children: !readOnly && !populatedDocs && (!value || typeof maxRows !== "number" || Array.isArray(value) && value.length < maxRows) ? /*#__PURE__*/_jsx(ShimmerEffect, {
          height: "40px"
        }) : null
      })]
    }), AfterInput, /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
}
//# sourceMappingURL=Input.js.map