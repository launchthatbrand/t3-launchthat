"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { formatFilesize, isImage } from "@convexcms/core/shared";
import { Button } from "../../../elements/Button/index.js";
import { useDocumentDrawer } from "../../../elements/DocumentDrawer/index.js";
import { ThumbnailComponent } from "../../../elements/Thumbnail/index.js";
import { useConfig } from "../../../providers/Config/index.js";
const baseClass = "upload-relationship-details";
export function RelationshipContent(props) {
  const {
    id,
    allowEdit,
    allowRemove,
    alt,
    byteSize,
    className,
    collectionSlug,
    displayPreview,
    filename,
    mimeType,
    onRemove,
    reloadDoc,
    src,
    thumbnailSrc,
    withMeta = true,
    x,
    y
  } = props;
  const {
    config
  } = useConfig();
  const collectionConfig = "collections" in config ? config.collections.find(collection => collection.slug === collectionSlug) : undefined;
  const [DocumentDrawer, _, {
    openDrawer
  }] = useDocumentDrawer({
    id: src ? id : undefined,
    collectionSlug
  });
  const onSave = React.useCallback(async ({
    doc
  }) => reloadDoc(doc.id, collectionSlug), [reloadDoc, collectionSlug]);
  function generateMetaText(mimeType, size) {
    const sections = [];
    if (size) {
      sections.push(formatFilesize(size));
    }
    if (x && y) {
      sections.push(`${x}x${y}`);
    }
    if (mimeType) {
      sections.push(mimeType);
    }
    return sections.join(" — ");
  }
  const metaText = withMeta ? generateMetaText(mimeType, byteSize) : "";
  const previewAllowed = displayPreview ?? collectionConfig.upload?.displayPreview ?? true;
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, className].filter(Boolean).join(" "),
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__imageAndDetails`,
      children: [previewAllowed && /*#__PURE__*/_jsx(ThumbnailComponent, {
        alt: alt,
        className: `${baseClass}__thumbnail`,
        filename: filename,
        fileSrc: isImage(mimeType) && thumbnailSrc,
        size: "small"
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__details`,
        children: [/*#__PURE__*/_jsx("p", {
          className: `${baseClass}__filename`,
          children: src ? /*#__PURE__*/_jsx("a", {
            href: src,
            target: "_blank",
            children: filename
          }) : filename
        }), withMeta ? /*#__PURE__*/_jsx("p", {
          className: `${baseClass}__meta`,
          children: metaText
        }) : null]
      })]
    }), allowEdit !== false || allowRemove !== false ? /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__actions`,
      children: [allowEdit !== false ? /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__edit`,
        icon: "edit",
        iconStyle: "none",
        onClick: openDrawer
      }) : null, allowRemove !== false ? /*#__PURE__*/_jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__remove`,
        icon: "x",
        iconStyle: "none",
        onClick: () => onRemove()
      }) : null, /*#__PURE__*/_jsx(DocumentDrawer, {
        onSave: onSave
      })]
    }) : null]
  });
}
//# sourceMappingURL=index.js.map