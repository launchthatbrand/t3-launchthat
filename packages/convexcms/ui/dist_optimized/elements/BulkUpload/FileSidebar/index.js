"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { isImage } from "@convexcms/core/shared";
import { useModal } from "@faceless-ui/modal";
import { useWindowInfo } from "@faceless-ui/window-info";
import { ChevronIcon } from "../../../icons/Chevron/index.js";
import { XIcon } from "../../../icons/X/index.js";
import { useTranslation } from "../../../providers/Translation/index.js";
import { AnimateHeight } from "../../AnimateHeight/index.js";
import { Button } from "../../Button/index.js";
import { Drawer } from "../../Drawer/index.js";
import { ErrorPill } from "../../ErrorPill/index.js";
import { Pill } from "../../Pill/index.js";
import { ShimmerEffect } from "../../ShimmerEffect/index.js";
import { Thumbnail } from "../../Thumbnail/index.js";
import { Actions } from "../ActionsBar/index.js";
import { AddFilesView } from "../AddFilesView/index.js";
import { useFormsManager } from "../FormsManager/index.js";
import { useBulkUpload } from "../index.js";
const addMoreFilesDrawerSlug = "bulk-upload-drawer--add-more-files";
const baseClass = "file-selections";
export function FileSidebar() {
  const {
    activeIndex,
    addFiles,
    forms,
    isInitializing,
    removeFile,
    setActiveIndex,
    thumbnailUrls,
    totalErrorCount
  } = useFormsManager();
  const {
    initialFiles,
    maxFiles
  } = useBulkUpload();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    closeModal,
    openModal
  } = useModal();
  const [showFiles, setShowFiles] = React.useState(false);
  const {
    breakpoints
  } = useWindowInfo();
  const handleRemoveFile = React.useCallback(indexToRemove => {
    removeFile(indexToRemove);
  }, [removeFile]);
  const handleAddFiles = React.useCallback(filelist => {
    void addFiles(filelist);
    closeModal(addMoreFilesDrawerSlug);
  }, [addFiles, closeModal]);
  const getFileSize = React.useCallback(file => {
    const size = file.size;
    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    const decimals = i > 1 ? 1 : 0;
    const formattedSize = (size / Math.pow(1024, i)).toFixed(decimals) + " " + ["B", "kB", "MB", "GB", "TB"][i];
    return formattedSize;
  }, []);
  const totalFileCount = isInitializing ? initialFiles.length : forms.length;
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, showFiles && `${baseClass}__showingFiles`].filter(Boolean).join(" "),
    children: [breakpoints.m && showFiles ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__mobileBlur`
    }) : null, /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__header`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__headerTopRow`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__header__text`,
          children: [/*#__PURE__*/_jsx(ErrorPill, {
            count: totalErrorCount,
            i18n: i18n,
            withMessage: true
          }), /*#__PURE__*/_jsx("p", {
            children: /*#__PURE__*/_jsxs("strong", {
              title: `${totalFileCount} ${t(totalFileCount > 1 ? "upload:filesToUpload" : "upload:fileToUpload")}`,
              children: [totalFileCount, " ", t(totalFileCount > 1 ? "upload:filesToUpload" : "upload:fileToUpload")]
            })
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__header__actions`,
          children: [(typeof maxFiles === "number" ? totalFileCount < maxFiles : true) ? /*#__PURE__*/_jsx(Pill, {
            className: `${baseClass}__header__addFile`,
            onClick: () => openModal(addMoreFilesDrawerSlug),
            children: t("upload:addFile")
          }) : null, /*#__PURE__*/_jsxs(Button, {
            buttonStyle: "transparent",
            className: `${baseClass}__toggler`,
            onClick: () => setShowFiles(prev => !prev),
            children: [/*#__PURE__*/_jsx("span", {
              className: `${baseClass}__toggler__label`,
              children: /*#__PURE__*/_jsxs("strong", {
                title: `${totalFileCount} ${t(totalFileCount > 1 ? "upload:filesToUpload" : "upload:fileToUpload")}`,
                children: [totalFileCount, " ", t(totalFileCount > 1 ? "upload:filesToUpload" : "upload:fileToUpload")]
              })
            }), /*#__PURE__*/_jsx(ChevronIcon, {
              direction: showFiles ? "down" : "up"
            })]
          }), /*#__PURE__*/_jsx(Drawer, {
            gutter: false,
            Header: null,
            slug: addMoreFilesDrawerSlug,
            children: /*#__PURE__*/_jsx(AddFilesView, {
              onCancel: () => closeModal(addMoreFilesDrawerSlug),
              onDrop: handleAddFiles
            })
          })]
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__header__mobileDocActions`,
        children: /*#__PURE__*/_jsx(Actions, {})
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__animateWrapper`,
      children: /*#__PURE__*/_jsx(AnimateHeight, {
        height: !breakpoints.m || showFiles ? "auto" : 0,
        children: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__filesContainer`,
          children: [isInitializing && forms.length === 0 && initialFiles.length > 0 ? Array.from(initialFiles).map((file, index) => /*#__PURE__*/_jsx(ShimmerEffect, {
            animationDelay: `calc(${index} * ${60}ms)`,
            height: "35px"
          }, index)) : null, forms.map(({
            errorCount,
            formState
          }, index) => {
            const currentFile = formState?.file?.value || {};
            return /*#__PURE__*/_jsxs("div", {
              className: [`${baseClass}__fileRowContainer`, index === activeIndex && `${baseClass}__fileRowContainer--active`, errorCount && errorCount > 0 && `${baseClass}__fileRowContainer--error`].filter(Boolean).join(" "),
              children: [/*#__PURE__*/_jsxs("button", {
                className: `${baseClass}__fileRow`,
                onClick: () => setActiveIndex(index),
                type: "button",
                children: [/*#__PURE__*/_jsx(Thumbnail, {
                  className: `${baseClass}__thumbnail`,
                  fileSrc: isImage(currentFile.type) ? thumbnailUrls[index] : null
                }), /*#__PURE__*/_jsx("div", {
                  className: `${baseClass}__fileDetails`,
                  children: /*#__PURE__*/_jsx("p", {
                    className: `${baseClass}__fileName`,
                    title: currentFile.name,
                    children: currentFile.name || t("upload:noFile")
                  })
                }), currentFile instanceof File ? /*#__PURE__*/_jsx("p", {
                  className: `${baseClass}__fileSize`,
                  children: getFileSize(currentFile)
                }) : null, /*#__PURE__*/_jsx("div", {
                  className: `${baseClass}__remove ${baseClass}__remove--underlay`,
                  children: /*#__PURE__*/_jsx(XIcon, {})
                }), errorCount ? /*#__PURE__*/_jsx(ErrorPill, {
                  className: `${baseClass}__errorCount`,
                  count: errorCount,
                  i18n: i18n
                }) : null]
              }), /*#__PURE__*/_jsx("button", {
                "aria-label": t("general:remove"),
                className: `${baseClass}__remove ${baseClass}__remove--overlay`,
                onClick: () => handleRemoveFile(index),
                type: "button",
                children: /*#__PURE__*/_jsx(XIcon, {})
              })]
            }, index);
          })]
        })
      })
    })]
  });
}
//# sourceMappingURL=index.js.map