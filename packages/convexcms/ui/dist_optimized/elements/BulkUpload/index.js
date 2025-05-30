"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { validateMimeType } from "@convexcms/core/shared";
import { useModal } from "@faceless-ui/modal";
import { toast } from "sonner";
import { useConfig } from "../../providers/Config/index.js";
import { useTranslation } from "../../providers/Translation/index.js";
import { Drawer, useDrawerDepth } from "../Drawer/index.js";
import { AddFilesView } from "./AddFilesView/index.js";
import { AddingFilesView } from "./AddingFilesView/index.js";
import { FormsManagerProvider, useFormsManager } from "./FormsManager/index.js";
const drawerSlug = "bulk-upload-drawer-slug";
function DrawerContent() {
  const {
    addFiles,
    forms,
    isInitializing
  } = useFormsManager();
  const {
    closeModal
  } = useModal();
  const {
    collectionSlug,
    drawerSlug
  } = useBulkUpload();
  const {
    getEntityConfig
  } = useConfig();
  const {
    t
  } = useTranslation();
  const uploadCollection = getEntityConfig({
    collectionSlug
  });
  const uploadConfig = uploadCollection?.upload;
  const uploadMimeTypes = uploadConfig?.mimeTypes;
  const onDrop = React.useCallback(acceptedFiles => {
    const fileTransfer = new DataTransfer();
    for (const candidateFile of acceptedFiles) {
      if (uploadMimeTypes === undefined || uploadMimeTypes.length === 0 || validateMimeType(candidateFile.type, uploadMimeTypes)) {
        fileTransfer.items.add(candidateFile);
      }
    }
    if (fileTransfer.files.length === 0) {
      toast.error(t("error:invalidFileType"));
    } else {
      void addFiles(fileTransfer.files);
    }
  }, [addFiles, t, uploadMimeTypes]);
  if (!collectionSlug) {
    return null;
  }
  if (!forms.length && !isInitializing) {
    return /*#__PURE__*/_jsx(AddFilesView, {
      acceptMimeTypes: uploadMimeTypes?.join(", "),
      onCancel: () => closeModal(drawerSlug),
      onDrop: onDrop
    });
  } else {
    return /*#__PURE__*/_jsx(AddingFilesView, {});
  }
}
export function BulkUploadDrawer() {
  const {
    drawerSlug
  } = useBulkUpload();
  return /*#__PURE__*/_jsx(Drawer, {
    gutter: false,
    Header: null,
    slug: drawerSlug,
    children: /*#__PURE__*/_jsx(FormsManagerProvider, {
      children: /*#__PURE__*/_jsx(DrawerContent, {})
    })
  });
}
const Context = /*#__PURE__*/React.createContext({
  collectionSlug: "",
  currentActivePath: undefined,
  drawerSlug: "",
  initialFiles: undefined,
  maxFiles: undefined,
  onCancel: () => null,
  onSuccess: () => null,
  setCollectionSlug: () => null,
  setCurrentActivePath: () => null,
  setInitialFiles: () => null,
  setMaxFiles: () => null,
  setOnCancel: () => null,
  setOnSuccess: () => null
});
export function BulkUploadProvider({
  children
}) {
  const [collection, setCollection] = React.useState();
  const [onSuccessFunctionMap, setOnSuccessFunctionMap] = React.useState();
  const [onCancelFunction, setOnCancelFunction] = React.useState();
  const [initialFiles, setInitialFiles] = React.useState(undefined);
  const [maxFiles, setMaxFiles] = React.useState(undefined);
  const [currentActivePath, setCurrentActivePath] = React.useState(undefined);
  const drawerSlug = useBulkUploadDrawerSlug();
  const setCollectionSlug = slug => {
    setCollection(slug);
  };
  const setOnSuccess = React.useCallback((path, onSuccess) => {
    setOnSuccessFunctionMap(prev => ({
      ...prev,
      [path]: onSuccess
    }));
  }, []);
  return /*#__PURE__*/_jsx(Context, {
    value: {
      collectionSlug: collection,
      currentActivePath,
      drawerSlug,
      initialFiles,
      maxFiles,
      onCancel: () => {
        if (typeof onCancelFunction === "function") {
          onCancelFunction();
        }
      },
      onSuccess: (docIDs, errorCount) => {
        if (onSuccessFunctionMap && Object.hasOwn(onSuccessFunctionMap, currentActivePath)) {
          const onSuccessFunction = onSuccessFunctionMap[currentActivePath];
          onSuccessFunction(docIDs, errorCount);
        }
      },
      setCollectionSlug,
      setCurrentActivePath,
      setInitialFiles,
      setMaxFiles,
      setOnCancel: setOnCancelFunction,
      setOnSuccess
    },
    children: /*#__PURE__*/_jsxs(React.Fragment, {
      children: [children, /*#__PURE__*/_jsx(BulkUploadDrawer, {})]
    })
  });
}
export const useBulkUpload = () => React.use(Context);
export function useBulkUploadDrawerSlug() {
  const depth = useDrawerDepth();
  return `${drawerSlug}-${depth || 1}`;
}
//# sourceMappingURL=index.js.map