"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./index.scss";
import React from "react";
import { File } from "../../graphics/File/index.js";
import { ShimmerEffect } from "../ShimmerEffect/index.js";
const baseClass = "thumbnail";
export const Thumbnail = props => {
  const {
    className = "",
    doc: {
      filename,
      mimeType
    } = {},
    fileSrc,
    imageCacheTag,
    size
  } = props;
  const [fileExists, setFileExists] = React.useState(undefined);
  const classNames = [baseClass, `${baseClass}--size-${size || "medium"}`, className].join(" ");
  React.useEffect(() => {
    if (!fileSrc || typeof mimeType === "string" && !mimeType.startsWith("image")) {
      setFileExists(false);
      return;
    }
    setFileExists(undefined);
    const img = new Image();
    img.src = fileSrc;
    img.onload = () => {
      setFileExists(true);
    };
    img.onerror = () => {
      setFileExists(false);
    };
  }, [fileSrc, mimeType]);
  let src = null;
  /**
  * If an imageCacheTag is provided, append it to the fileSrc
  * Check if the fileSrc already has a query string, if it does, append the imageCacheTag with an ampersand
  */
  if (fileSrc) {
    const queryChar = fileSrc?.includes("?") ? "&" : "?";
    src = imageCacheTag ? `${fileSrc}${queryChar}${encodeURIComponent(imageCacheTag)}` : fileSrc;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: classNames,
    children: [fileExists === undefined && /*#__PURE__*/_jsx(ShimmerEffect, {
      height: "100%"
    }), fileExists && /*#__PURE__*/_jsx("img", {
      alt: filename,
      src: src
    }), fileExists === false && /*#__PURE__*/_jsx(File, {})]
  });
};
export function ThumbnailComponent(props) {
  const {
    alt,
    className = "",
    filename,
    fileSrc,
    imageCacheTag,
    size
  } = props;
  const [fileExists, setFileExists] = React.useState(undefined);
  const classNames = [baseClass, `${baseClass}--size-${size || "medium"}`, className].join(" ");
  React.useEffect(() => {
    if (!fileSrc) {
      setFileExists(false);
      return;
    }
    setFileExists(undefined);
    const img = new Image();
    img.src = fileSrc;
    img.onload = () => {
      setFileExists(true);
    };
    img.onerror = () => {
      setFileExists(false);
    };
  }, [fileSrc]);
  let src = "";
  /**
  * If an imageCacheTag is provided, append it to the fileSrc
  * Check if the fileSrc already has a query string, if it does, append the imageCacheTag with an ampersand
  */
  if (fileSrc) {
    const queryChar = fileSrc?.includes("?") ? "&" : "?";
    src = imageCacheTag ? `${fileSrc}${queryChar}${encodeURIComponent(imageCacheTag)}` : fileSrc;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: classNames,
    children: [fileExists === undefined && /*#__PURE__*/_jsx(ShimmerEffect, {
      height: "100%"
    }), fileExists && /*#__PURE__*/_jsx("img", {
      alt: alt || filename,
      src: src
    }), fileExists === false && /*#__PURE__*/_jsx(File, {})]
  });
}
//# sourceMappingURL=index.js.map