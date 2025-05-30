"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { isImage } from "@convexcms/core/shared";
import { DraggableSortableItem } from "../../../elements/DraggableSortable/DraggableSortableItem/index.js";
import { DraggableSortable } from "../../../elements/DraggableSortable/index.js";
import { DragHandleIcon } from "../../../icons/DragHandle/index.js";
import { getBestFitFromSizes } from "../../../utilities/getBestFitFromSizes.js";
import { RelationshipContent } from "../RelationshipContent/index.js";
import { UploadCard } from "../UploadCard/index.js";
const baseClass = "upload upload--has-many";
export function UploadComponentHasMany(props) {
  const {
    className,
    displayPreview,
    fileDocs,
    isSortable,
    onRemove,
    onReorder,
    readonly,
    reloadDoc,
    serverURL
  } = props;
  const moveRow = React.useCallback((moveFromIndex, moveToIndex) => {
    if (moveFromIndex === moveToIndex) {
      return;
    }
    const updatedArray = [...fileDocs];
    const [item] = updatedArray.splice(moveFromIndex, 1);
    updatedArray.splice(moveToIndex, 0, item);
    onReorder(updatedArray);
  }, [fileDocs, onReorder]);
  const removeItem = React.useCallback(index => {
    const updatedArray = [...(fileDocs || [])];
    updatedArray.splice(index, 1);
    onRemove(updatedArray.length === 0 ? [] : updatedArray);
  }, [fileDocs, onRemove]);
  return /*#__PURE__*/_jsx("div", {
    className: [baseClass, className].filter(Boolean).join(" "),
    children: /*#__PURE__*/_jsx(DraggableSortable, {
      className: `${baseClass}__draggable-rows`,
      ids: fileDocs?.map(({
        value
      }) => String(value.id)),
      onDragEnd: ({
        moveFromIndex,
        moveToIndex
      }) => moveRow(moveFromIndex, moveToIndex),
      children: fileDocs.map(({
        relationTo,
        value
      }, index) => {
        const id = String(value.id);
        let src;
        let thumbnailSrc;
        if (value.url) {
          try {
            src = new URL(value.url, serverURL).toString();
          } catch {
            src = `${serverURL}${value.url}`;
          }
        }
        if (value.thumbnailURL) {
          try {
            thumbnailSrc = new URL(value.thumbnailURL, serverURL).toString();
          } catch {
            thumbnailSrc = `${serverURL}${value.thumbnailURL}`;
          }
        }
        if (isImage(value.mimeType)) {
          thumbnailSrc = getBestFitFromSizes({
            sizes: value.sizes,
            thumbnailURL: thumbnailSrc,
            url: src,
            width: value.width
          });
        }
        return /*#__PURE__*/_jsx(DraggableSortableItem, {
          disabled: !isSortable || readonly,
          id: id,
          children: draggableSortableItemProps => /*#__PURE__*/_jsx("div", {
            className: [`${baseClass}__dragItem`, draggableSortableItemProps && isSortable && `${baseClass}--has-drag-handle`].filter(Boolean).join(" "),
            ref: draggableSortableItemProps.setNodeRef,
            style: {
              transform: draggableSortableItemProps.transform,
              transition: draggableSortableItemProps.transition,
              zIndex: draggableSortableItemProps.isDragging ? 1 : undefined
            },
            children: /*#__PURE__*/_jsxs(UploadCard, {
              size: "small",
              children: [draggableSortableItemProps && /*#__PURE__*/_jsx("div", {
                className: `${baseClass}__drag`,
                ...draggableSortableItemProps.attributes,
                ...draggableSortableItemProps.listeners,
                children: /*#__PURE__*/_jsx(DragHandleIcon, {})
              }), /*#__PURE__*/_jsx(RelationshipContent, {
                allowEdit: !readonly,
                allowRemove: !readonly,
                alt: value?.alt || value?.filename,
                byteSize: value.filesize,
                collectionSlug: relationTo,
                displayPreview: displayPreview,
                filename: value.filename,
                id: id,
                mimeType: value?.mimeType,
                onRemove: () => removeItem(index),
                reloadDoc: reloadDoc,
                src: src,
                thumbnailSrc: thumbnailSrc,
                withMeta: false,
                x: value?.width,
                y: value?.height
              })]
            })
          })
        }, id);
      })
    })
  });
}
//# sourceMappingURL=index.js.map