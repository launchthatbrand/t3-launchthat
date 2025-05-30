"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { DraggableSortableItem } from "../../../elements/DraggableSortable/DraggableSortableItem/index.js";
import { DragHandleIcon } from "../../../icons/DragHandle/index.js";
import { EditIcon } from "../../../icons/Edit/index.js";
import { Button } from "../../Button/index.js";
import { useDocumentDrawer } from "../../DocumentDrawer/index.js";
import { Thumbnail } from "../../Thumbnail/index.js";
const baseClass = "file-details-draggable";
export const DraggableFileDetails = props => {
  const {
    collectionSlug,
    doc,
    hideRemoveFile,
    imageCacheTag,
    isSortable,
    removeItem,
    rowIndex,
    uploadConfig
  } = props;
  const {
    id,
    filename,
    thumbnailURL,
    url
  } = doc;
  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    id,
    collectionSlug
  });
  return /*#__PURE__*/_jsx(DraggableSortableItem, {
    id: id,
    children: draggableSortableItemProps => /*#__PURE__*/_jsxs("div", {
      className: [baseClass, draggableSortableItemProps && isSortable && `${baseClass}--has-drag-handle`].filter(Boolean).join(" "),
      ref: draggableSortableItemProps.setNodeRef,
      style: {
        transform: draggableSortableItemProps.transform,
        transition: draggableSortableItemProps.transition,
        zIndex: draggableSortableItemProps.isDragging ? 1 : undefined
      },
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}--drag-wrapper`,
        children: [isSortable && draggableSortableItemProps && /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__drag`,
          ...draggableSortableItemProps.attributes,
          ...draggableSortableItemProps.listeners,
          children: /*#__PURE__*/_jsx(DragHandleIcon, {})
        }), /*#__PURE__*/_jsx(Thumbnail, {
          className: `${baseClass}__thumbnail`,
          collectionSlug: collectionSlug,
          doc: doc,
          fileSrc: thumbnailURL || url,
          imageCacheTag: imageCacheTag,
          uploadConfig: uploadConfig
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__main-detail`,
        children: filename
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__actions`,
        children: [/*#__PURE__*/_jsx(DocumentDrawer, {}), /*#__PURE__*/_jsx(DocumentDrawerToggler, {
          children: /*#__PURE__*/_jsx(EditIcon, {})
        }), !hideRemoveFile && removeItem && /*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__remove`,
          icon: "x",
          iconStyle: "none",
          onClick: () => removeItem(rowIndex),
          round: true
        })]
      })]
    })
  }, id);
};
//# sourceMappingURL=index.js.map